// Nominatim geocoding proxy (PRD §7.1). Server-side so we can set the required
// User-Agent and keep the client free of CORS/rate-limit headaches.

import { NextResponse } from "next/server";
import type { GeocodeResult } from "@/lib/types";
import { googleGeocode } from "@/lib/google";

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "GridPath/1.0 (clean-energy connection estimator; hackathon demo)";

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 3) {
    return NextResponse.json<GeocodeResult[]>([]);
  }

  // Prefer Google geocoding when a key is configured; otherwise OSM/Nominatim.
  const google = await googleGeocode(q);
  if (google) {
    return NextResponse.json(google);
  }

  const url = `${NOMINATIM}?q=${encodeURIComponent(q)}&format=json&addressdetails=0&limit=5&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return NextResponse.json<GeocodeResult[]>([]);
    }
    const items = (await res.json()) as NominatimItem[];
    const results: GeocodeResult[] = items.map((it) => ({
      label: it.display_name,
      lat: parseFloat(it.lat),
      lon: parseFloat(it.lon),
    }));
    return NextResponse.json(results);
  } catch {
    return NextResponse.json<GeocodeResult[]>([]);
  }
}
