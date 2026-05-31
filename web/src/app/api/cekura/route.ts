/**
 * /api/cekura
 *
 * GET  — returns a JSON summary of the latest Cekura evaluation run.
 * POST — pretends to kick off a new Cekura run (no external API call).
 *
 * The CEKURA_API_KEY env var is used only as a feature flag: when present the
 * response advertises `mode: "live"`, otherwise `mode: "demo"`.  No outbound
 * request is made to Cekura in either case from this route.
 *
 * runtime = "nodejs" keeps this on the same compute tier as the calls route.
 */
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { CEKURA_RUN } from "@/lib/data";

/** Returns "live" when a Cekura API key is configured, otherwise "demo". */
function cekuraMode(): "live" | "demo" {
  return process.env.CEKURA_API_KEY ? "live" : "demo";
}

// ── GET /api/cekura ──────────────────────────────────────────────────────────

/**
 * Returns a condensed summary of `CEKURA_RUN` suitable for polling by the
 * Cekura progress panel.  Only the scalar fields and the per-iteration
 * scorecards are included — persona detail (which is large) is omitted to
 * keep the payload small; the panel that needs personas reads `@/lib/data`
 * directly as a server import.
 *
 * Response shape:
 * ```json
 * {
 *   "agentName": "Riley — Recoup AI Collections",
 *   "model": "NVIDIA Nemotron-3-Super-120B",
 *   "baselineScore": 62,
 *   "finalScore": 100,
 *   "baselinePtp": 41,
 *   "finalPtp": 72,
 *   "iterations": [{ "n": 1, "label": "…", "complianceScore": 74, "ptpRate": 48 }, …],
 *   "mode": "demo"
 * }
 * ```
 */
export async function GET(): Promise<NextResponse> {
  const {
    agentName,
    model,
    baselineScore,
    finalScore,
    baselinePtp,
    finalPtp,
    iterations,
  } = CEKURA_RUN;

  // Return only the lightweight summary of each iteration (no diagnosis/fix
  // prose) so the response stays compact.
  const iterationSummaries = iterations.map(({ n, label, complianceScore, ptpRate }) => ({
    n,
    label,
    complianceScore,
    ptpRate,
  }));

  return NextResponse.json({
    agentName,
    model,
    baselineScore,
    finalScore,
    baselinePtp,
    finalPtp,
    iterations: iterationSummaries,
    mode: cekuraMode(),
  });
}

// ── POST /api/cekura ─────────────────────────────────────────────────────────

/**
 * Simulates kicking off a Cekura evaluation run.
 *
 * In a real integration this would POST to the Cekura API with the
 * CEKURA_API_KEY and return a run ID.  For the hackathon demo it simply
 * acknowledges the request so the client can animate a progress flow.
 *
 * Response:
 * ```json
 * { "started": true, "mode": "demo" }
 * ```
 */
export async function POST(_request: NextRequest): Promise<NextResponse> {
  // No external API call — graceful simulation only.
  return NextResponse.json({
    started: true,
    mode: cekuraMode(),
  });
}
