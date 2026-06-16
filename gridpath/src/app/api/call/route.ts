// Outbound AI call endpoint: given a phone number and the selected location's
// estimate, GridPath places a Twilio voice call that speaks a short, contextual
// briefing about the grid connection + top clean-energy recommendation.
//
// Self-contained: builds the spoken script (Claude or template), wraps it in
// inline TwiML, and POSTs to the Twilio Calls REST API — no public webhook,
// SDK, or media-stream server required.

import { NextResponse } from "next/server";
import type { ConnectionEstimate } from "@/lib/types";
import { buildSignals, fallbackPlan } from "@/lib/cleanenergy";
import { fetchSolar } from "@/lib/google";
import { recommendWithClaude } from "@/lib/claude";
import {
  briefFacts,
  claudeBrief,
  encodeCtx,
  fallbackBrief,
  toTwiml,
} from "@/lib/voicebrief";
import { hasNvidia } from "@/lib/nemotron";
import { formatUsd } from "@/lib/cost";

interface CallRequest {
  phone?: string;
  estimate?: ConnectionEstimate;
}

/** Normalize a user-typed phone to E.164, defaulting to US (+1). */
function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? `+${digits}` : null;
  }
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

/**
 * Public HTTPS base Twilio can reach for the /api/voice webhook. Prefers an
 * explicit PUBLIC_BASE_URL; otherwise derives it from the request (works
 * automatically on Vercel). Returns null for localhost / non-https so we don't
 * hand Twilio an unreachable URL.
 */
function publicBaseFrom(request: Request): string | null {
  const explicit = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const h = request.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  if (!host || host.startsWith("localhost") || host.startsWith("127.0.0.1")) return null;
  if (proto !== "https") return null;
  return `${proto}://${host}`;
}

export async function POST(request: Request) {
  let body: CallRequest;
  try {
    body = (await request.json()) as CallRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { phone, estimate } = body;
  if (!phone || !estimate) {
    return NextResponse.json(
      { error: "phone and estimate are required" },
      { status: 400 }
    );
  }

  const to = normalizePhone(phone);
  if (!to) {
    return NextResponse.json(
      { error: "Enter a valid phone number, e.g. (628) 555-0142." },
      { status: 400 }
    );
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !from) {
    return NextResponse.json(
      {
        error:
          "Calling isn't configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.",
      },
      { status: 503 }
    );
  }

  try {
    // Build clean-energy context for the briefing (best-effort, fast fallback).
    const { coordinates, address } = estimate;
    let plan = null;
    try {
      const solar = await fetchSolar(coordinates.lat, coordinates.lon);
      const signals = buildSignals(address, solar);
      plan = (await recommendWithClaude(signals)) ?? fallbackPlan(signals);
    } catch (err) {
      console.error("call: plan context unavailable", err);
    }

    // Conversational mode: when NVIDIA (LLM) + a public URL for Twilio's speech
    // webhook are configured, the caller can ask follow-up questions and
    // Nemotron answers them. Otherwise fall back to a one-way spoken briefing.
    const publicBase = publicBaseFrom(request);
    const conversational = hasNvidia() && Boolean(publicBase);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const form = new URLSearchParams({ To: to, From: from });

    if (conversational) {
      const place = address.split(",")[0]?.trim() || "your location";
      const greeting =
        `Hi! This is Riley from GridPath with the rundown on ${place}. ` +
        `The nearest grid connection is about ${estimate.distanceFeet} feet away, ` +
        `the estimated cost to connect is ${formatUsd(estimate.estimatedCost.total)}, ` +
        `and the timeline is ${estimate.estimatedTimeline.label}.`;
      const ctx = encodeCtx({ facts: briefFacts(estimate, plan), greeting });
      form.set(
        "Url",
        `${publicBase}/api/voice?ctx=${encodeURIComponent(ctx)}&greet=1`
      );
      form.set("Method", "POST");
    } else {
      const script =
        (await claudeBrief(estimate, plan)) ?? fallbackBrief(estimate, plan);
      form.set("Twiml", toTwiml(script));
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization:
          "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    const data = (await res.json()) as { sid?: string; status?: string; message?: string };
    if (!res.ok) {
      console.error("Twilio call failed", res.status, data);
      return NextResponse.json(
        { error: data.message ?? "Twilio could not place the call." },
        { status: 502 }
      );
    }

    return NextResponse.json({ sid: data.sid, status: data.status, to });
  } catch (err) {
    console.error("call route failed", err);
    return NextResponse.json({ error: "Failed to place the call." }, { status: 500 });
  }
}
