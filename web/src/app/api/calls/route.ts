/**
 * /api/calls
 *
 * GET  — returns the current telephony mode (live | simulation).
 * POST — triggers an outbound call for a given accountId.
 *
 * The phone number is never returned in full; only the last 4 digits are
 * exposed to the client so as not to leak PII through the browser.
 *
 * runtime = "nodejs" is required because telephony.ts uses Buffer (Node API).
 */
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { SEED_DEBTORS } from "@/lib/data";
import {
  telephonyConfigured,
  placeOutboundCall,
} from "@/lib/server/telephony";

/** Mask a phone number to show only the last 4 digits, e.g. "•••• 6113". */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `•••• ${last4}`;
}

// ── GET /api/calls ───────────────────────────────────────────────────────────

/**
 * Returns the current telephony mode so the client can display an accurate
 * status indicator without needing any env var access of its own.
 *
 * @returns `{ ok: true, mode: "live" | "simulation" }`
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    mode: telephonyConfigured() ? "live" : "simulation",
  });
}

// ── POST /api/calls ──────────────────────────────────────────────────────────

interface CallRequestBody {
  accountId?: string;
}

/**
 * Triggers (or simulates) an outbound call for the given `accountId`.
 *
 * Request body: `{ accountId: string }`
 *
 * Successful live response:
 * ```json
 * { "mode": "live", "callSid": "CA…", "to": "•••• 6113" }
 * ```
 *
 * Simulation response:
 * ```json
 * { "mode": "simulation", "reason": "telephony not configured", "to": "•••• 6113" }
 * ```
 *
 * Error responses use standard HTTP status codes (400/404/500).
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: CallRequestBody;
  try {
    body = (await request.json()) as CallRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const { accountId } = body;

  if (!accountId || typeof accountId !== "string" || accountId.trim() === "") {
    return NextResponse.json(
      { ok: false, error: "accountId is required" },
      { status: 400 },
    );
  }

  // ── Look up the debtor ──────────────────────────────────────────────────────
  const debtor = SEED_DEBTORS.find(
    (d) => d.accountId === accountId.trim(),
  );

  if (!debtor) {
    return NextResponse.json(
      { ok: false, error: `Account not found: ${accountId}` },
      { status: 404 },
    );
  }

  const maskedPhone = maskPhone(debtor.phone);

  // ── Dispatch ────────────────────────────────────────────────────────────────
  if (!telephonyConfigured()) {
    // Graceful degradation — no Twilio credentials in env
    return NextResponse.json({
      mode: "simulation",
      reason: "telephony not configured",
      to: maskedPhone,
    });
  }

  const result = await placeOutboundCall({ to: debtor.phone });

  if (!result.ok) {
    // Return a 200 with an error payload rather than a 5xx so the client can
    // fall back to simulation without triggering error boundaries.
    return NextResponse.json({
      mode: "simulation",
      reason: result.error ?? "Twilio call failed",
      to: maskedPhone,
    });
  }

  return NextResponse.json({
    mode: "live",
    callSid: result.callSid,
    to: maskedPhone,
  });
}
