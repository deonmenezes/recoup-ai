// Overpass client (PRD §7.2). Wraps the call with:
//  - a required User-Agent (Overpass returns 406 without one),
//  - an in-memory cache keyed by rounded coords (so a repeated demo lookup is instant),
//  - a widening-radius retry (OSM coverage varies by area),
//  - a graceful fixture fallback so a live demo never dies on a flaky API.

import { DEMO_FIXTURE_ELEMENTS } from "./fixtures";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const USER_AGENT = "GridPath/1.0 (clean-energy connection estimator; hackathon demo)";

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

interface QueryResult {
  elements: OverpassElement[];
  fromFixture: boolean;
}

const cache = new Map<string, OverpassElement[]>();

function buildQuery(lat: number, lon: number, radius: number): string {
  return `[out:json][timeout:25];
(
  way["power"="line"](around:${radius},${lat},${lon});
  way["power"="minor_line"](around:${radius},${lat},${lon});
  node["power"="pole"](around:${radius},${lat},${lon});
  node["power"="tower"](around:${radius},${lat},${lon});
  node["power"="transformer"](around:${radius},${lat},${lon});
  way["power"="transformer"](around:${radius},${lat},${lon});
  way["power"="substation"](around:${radius},${lat},${lon});
  node["power"="substation"](around:${radius},${lat},${lon});
);
out geom;`;
}

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

async function fetchOverpass(query: string): Promise<OverpassElement[] | null> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: new URLSearchParams({ data: query }).toString(),
        // Don't let a slow mirror hang the request forever.
        signal: AbortSignal.timeout(25000),
      });
      if (!res.ok) continue;
      const json = (await res.json()) as { elements?: OverpassElement[] };
      return json.elements ?? [];
    } catch {
      // Try the next mirror.
    }
  }
  return null;
}

/**
 * Query power infrastructure near a point. Widens the radius until it finds
 * something, caches the result, and falls back to a bundled fixture on failure.
 */
export async function queryPowerFeatures(
  lat: number,
  lon: number,
  radii: number[] = [2000, 4000, 8000]
): Promise<QueryResult> {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached) return { elements: cached, fromFixture: false };

  for (const radius of radii) {
    const elements = await fetchOverpass(buildQuery(lat, lon, radius));
    if (elements && elements.length > 0) {
      cache.set(key, elements);
      return { elements, fromFixture: false };
    }
  }

  // Live query failed or returned nothing — keep the demo alive.
  return { elements: DEMO_FIXTURE_ELEMENTS, fromFixture: true };
}
