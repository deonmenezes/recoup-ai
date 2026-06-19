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

    const place = address.split(",")[0]?.trim() || "your location";
    // Warm, consent-seeking opener — Riley names the three things she has but
    // doesn't dump the figures; she walks through them conversationally (one at
    // a time) once the caller says yes. The exact numbers live in `facts`, which
    // the agent's prompt references. Used as the ElevenLabs `first_message`
    // ({{greeting}}) and as the opening line for the Nemotron fallback path.
    const greeting =
      `Hey, it's Riley from GridPath! So you just pulled up ${place} — ` +
      `I've got your grid connection estimate right here: the distance, the cost, ` +
      `and the timeline. Want me to run through it?`;

    // Preferred path: ElevenLabs Conversational AI over Twilio — a real-time,
    // natural two-way voice agent ("Riley"). The location facts are injected as
    // dynamic variables the agent's prompt references. Falls through to the
    // legacy Twilio/Nemotron path below if not configured or if the call fails.
    const elKey = process.env.ELEVENLABS_API_KEY;
    const elAgent = process.env.ELEVENLABS_AGENT_ID;
    const elPhone = process.env.ELEVENLABS_PHONE_NUMBER_ID;
    if (elKey && elAgent && elPhone) {
      try {
        const elRes = await fetch(
          "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
          {
            method: "POST",
            headers: { "xi-api-key": elKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              agent_id: elAgent,
              agent_phone_number_id: elPhone,
              to_number: to,
              conversation_initiation_client_data: {
                dynamic_variables: {
                  place,
                  greeting,
                  facts: briefFacts(estimate, plan),
                },
              },
            }),
          }
        );
        const elData = (await elRes.json().catch(() => ({}))) as {
          success?: boolean;
          callSid?: string;
          conversation_id?: string;
          message?: string;
        };
        if (
          elRes.ok &&
          elData.success !== false &&
          (elData.callSid || elData.conversation_id)
        ) {
          return NextResponse.json({
            sid: elData.callSid ?? null,
            status: "queued",
            to,
            provider: "elevenlabs",
            conversationId: elData.conversation_id ?? null,
          });
        }
        console.error(
          "ElevenLabs outbound-call failed; falling back to Twilio.",
          elRes.status,
          elData
        );
      } catch (err) {
        console.error(
          "ElevenLabs outbound-call threw; falling back to Twilio.",
          err
        );
      }
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    const form = new URLSearchParams({ To: to, From: from });

    if (conversational) {
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
