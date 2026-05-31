/**
 * /api/test-call — "Call me, talk to Riley live"
 *
 * POST { phone } → places a REAL outbound Twilio call to the caller's own
 * number and connects it to the live Pipecat Cloud agent (Riley). This is the
 * hosted, real-voice demo: the visitor's phone rings and they talk to the
 * compliant collections agent.
 *
 * Safety (this is a PUBLIC endpoint):
 *   • E.164 validation; US/Canada (+1) only by default.
 *   • Optional allowlist via TEST_CALL_ALLOWLIST (comma-separated E.164) — when
 *     set, only those numbers may be dialed (lock this to your own number after
 *     the demo to eliminate toll-fraud risk).
 *   • Best-effort per-IP rate limit (30s cooldown, 5/hour) + a global hourly cap.
 *
 * runtime = "nodejs" because telephony.ts uses Buffer (Node API).
 */
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { telephonyConfigured, placeOutboundCall } from "@/lib/server/telephony";

function maskPhone(phone: string): string {
  return `•••• ${phone.replace(/\D/g, "").slice(-4)}`;
}

/**
 * Normalize loose user input to E.164. Assumes US/Canada when no country code
 * is given. Returns null if it can't produce a plausible E.164 number.
 */
function normalizeE164(input: string): string | null {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (hasPlus) {
    return /^\+\d{8,15}$/.test(`+${digits}`) ? `+${digits}` : null;
  }
  if (digits.length === 10) return `+1${digits}`; // bare US/CA number
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

function allowedDestination(e164: string): { ok: boolean; reason?: string } {
  const allowlist = (process.env.TEST_CALL_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowlist.length > 0) {
    return allowlist.includes(e164)
      ? { ok: true }
      : { ok: false, reason: "This demo is locked to a specific number right now." };
  }
  // Default guard: US/Canada only (most toll-fraud targets premium intl numbers).
  if (!/^\+1\d{10}$/.test(e164)) {
    return { ok: false, reason: "Only US/Canada (+1) numbers are accepted in the demo." };
  }
  return { ok: true };
}

// ── Best-effort in-memory rate limit (per warm serverless instance) ──────────
const hits = new Map<string, number[]>();
let globalHourly: number[] = [];
function rateLimited(ip: string): string | null {
  const now = Date.now();
  globalHourly = globalHourly.filter((t) => now - t < 3_600_000);
  if (globalHourly.length >= 40) return "The demo is busy right now — please try again shortly.";
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 3_600_000);
  if (arr.length >= 5) return "You've reached the demo call limit for this hour.";
  if (arr.length && now - arr[arr.length - 1] < 30_000)
    return "Please wait a moment before requesting another call.";
  arr.push(now);
  hits.set(ip, arr);
  globalHourly.push(now);
  return null;
}

// ── GET — health / mode ──────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    mode: telephonyConfigured() ? "live" : "simulation",
    agent: process.env.PIPECAT_SERVICE_HOST ?? null,
  });
}

// ── POST — ring the caller ────────────────────────────────────────────────────
interface Body {
  phone?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Body must be valid JSON" }, { status: 400 });
  }

  if (!body.phone || typeof body.phone !== "string") {
    return NextResponse.json({ ok: false, error: "phone is required" }, { status: 400 });
  }

  const e164 = normalizeE164(body.phone);
  if (!e164) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid phone number (e.g. (628) 555-0142)." },
      { status: 400 },
    );
  }

  const allowed = allowedDestination(e164);
  if (!allowed.ok) {
    return NextResponse.json({ ok: false, error: allowed.reason }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const limited = rateLimited(ip);
  if (limited) {
    return NextResponse.json({ ok: false, error: limited }, { status: 429 });
  }

  if (!telephonyConfigured()) {
    return NextResponse.json({
      mode: "simulation",
      reason: "Live telephony isn't configured on this deployment.",
      to: maskPhone(e164),
    });
  }

  const result = await placeOutboundCall({ to: e164 });
  if (!result.ok) {
    return NextResponse.json({
      mode: "simulation",
      reason: result.error ?? "The call could not be placed.",
      to: maskPhone(e164),
    });
  }

  return NextResponse.json({
    mode: "live",
    callSid: result.callSid,
    to: maskPhone(e164),
  });
}
