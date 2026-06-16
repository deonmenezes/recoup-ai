// Core endpoint: geocoded point -> full ConnectionEstimate (PRD §7.2–7.5).

import { NextResponse } from "next/server";
import { buildEstimate } from "@/lib/estimate";
import type { ServiceMode } from "@/lib/types";

interface GridRequest {
  address?: string;
  lat?: number;
  lon?: number;
  mode?: ServiceMode;
}

export async function POST(request: Request) {
  let body: GridRequest;
  try {
    body = (await request.json()) as GridRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { address, lat, lon } = body;
  const mode: ServiceMode = body.mode === "underground" ? "underground" : "overhead";

  if (typeof lat !== "number" || typeof lon !== "number" || !address) {
    return NextResponse.json(
      { error: "address, lat, and lon are required" },
      { status: 400 }
    );
  }

  try {
    const estimate = await buildEstimate({ address, lat, lon, mode });
    if (!estimate) {
      return NextResponse.json(
        { error: "No grid infrastructure found near this address." },
        { status: 404 }
      );
    }
    return NextResponse.json(estimate);
  } catch (err) {
    console.error("grid estimate failed", err);
    return NextResponse.json(
      { error: "Failed to compute estimate." },
      { status: 500 }
    );
  }
}
