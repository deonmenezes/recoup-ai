// Clean-energy advisor endpoint: address + point -> ranked clean-energy plan.
// Pipeline: Google Solar API (optional) -> grounded signals -> Claude (optional)
// -> deterministic fallback. Always returns a usable plan.

import { NextResponse } from "next/server";
import { buildSignals, fallbackPlan } from "@/lib/cleanenergy";
import { fetchSolar } from "@/lib/google";
import { recommendWithClaude } from "@/lib/claude";

interface RecommendRequest {
  address?: string;
  lat?: number;
  lon?: number;
}

export async function POST(request: Request) {
  let body: RecommendRequest;
  try {
    body = (await request.json()) as RecommendRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, lat, lon } = body;
  if (!address || typeof lat !== "number" || typeof lon !== "number") {
    return NextResponse.json(
      { error: "address, lat, and lon are required" },
      { status: 400 }
    );
  }

  try {
    const solar = await fetchSolar(lat, lon); // null without a Google key/coverage
    const signals = buildSignals(address, solar);

    const claudePlan = await recommendWithClaude(signals);
    const plan = claudePlan ?? fallbackPlan(signals);

    return NextResponse.json(plan);
  } catch (err) {
    console.error("recommend failed", err);
    return NextResponse.json({ error: "Failed to build plan." }, { status: 500 });
  }
}
