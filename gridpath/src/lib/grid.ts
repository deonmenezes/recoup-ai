// The core mechanic: given a property point and a set of OSM power features,
// find the single nearest connection point and the distance to it (PRD §7.2–7.3).
//
// Everything else (cost, timeline, the drawn line) falls out of this one number.

import { point, lineString, nearestPointOnLine, distance as turfDistance } from "@turf/turf";
import type { GridPointType, LatLon, PowerFeature } from "./types";

const METERS_TO_FEET = 3.28084;

/** Distance (ft) under which an existing pole/transformer counts as "right there". */
export const NEAR_POLE_FEET = 150;

/**
 * Poles sit ON the lines, so when the nearest line and a pole/transformer are
 * within this tolerance, the real connection point is the pole — you don't tap
 * a bare line mid-span when a drop point is right there.
 */
export const POLE_PREFERENCE_FEET = 50;

const NODE_TYPES: GridPointType[] = ["pole", "transformer"];

/** Raw Overpass element shape (only the bits we use). */
interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

const KNOWN_TYPES: GridPointType[] = [
  "line",
  "minor_line",
  "pole",
  "transformer",
  "substation",
];

function classify(tags: Record<string, string> | undefined): GridPointType | null {
  const power = tags?.power;
  if (!power) return null;
  return (KNOWN_TYPES as string[]).includes(power) ? (power as GridPointType) : null;
}

/** Normalize raw Overpass elements into map-ready PowerFeatures. */
export function parseFeatures(elements: OverpassElement[]): PowerFeature[] {
  const features: PowerFeature[] = [];

  for (const el of elements) {
    const type = classify(el.tags);
    if (!type) continue;

    if (el.type === "node" && el.lat != null && el.lon != null) {
      features.push({
        id: `node/${el.id}`,
        type,
        geometry: [{ lat: el.lat, lon: el.lon }],
      });
    } else if (el.geometry && el.geometry.length > 0) {
      features.push({
        id: `${el.type}/${el.id}`,
        type,
        geometry: el.geometry.map((g) => ({ lat: g.lat, lon: g.lon })),
      });
    }
  }

  return features;
}

export interface NearestResult {
  nearest: LatLon;
  type: GridPointType;
  distanceFeet: number;
}

/**
 * Find the nearest connection point across all features.
 * - Line-like features (≥2 points): nearestPointOnLine.
 * - Node-like features (1 point): straight-line distance.
 * Returns the global minimum, or null if there are no features.
 */
export function findNearest(
  origin: LatLon,
  features: PowerFeature[]
): NearestResult | null {
  const from = point([origin.lon, origin.lat]);
  let best: NearestResult | null = null;
  let bestNode: NearestResult | null = null; // nearest pole/transformer specifically

  for (const f of features) {
    let candidate: NearestResult | null = null;

    if (f.geometry.length >= 2) {
      const line = lineString(f.geometry.map((g) => [g.lon, g.lat]));
      const snapped = nearestPointOnLine(line, from, { units: "meters" });
      const [lon, lat] = snapped.geometry.coordinates;
      const meters = snapped.properties.dist ?? 0;
      candidate = {
        nearest: { lat, lon },
        type: f.type,
        distanceFeet: meters * METERS_TO_FEET,
      };
    } else {
      const g = f.geometry[0];
      const meters = turfDistance(from, point([g.lon, g.lat]), { units: "meters" });
      candidate = {
        nearest: { lat: g.lat, lon: g.lon },
        type: f.type,
        distanceFeet: meters * METERS_TO_FEET,
      };
    }

    if (candidate && (!best || candidate.distanceFeet < best.distanceFeet)) {
      best = candidate;
    }
    if (
      candidate &&
      NODE_TYPES.includes(candidate.type) &&
      (!bestNode || candidate.distanceFeet < bestNode.distanceFeet)
    ) {
      bestNode = candidate;
    }
  }

  // Prefer connecting at a pole/transformer when one is essentially as close as
  // the nearest line — the pole is the real, realistic connection point.
  if (
    best &&
    !NODE_TYPES.includes(best.type) &&
    bestNode &&
    bestNode.distanceFeet <= best.distanceFeet + POLE_PREFERENCE_FEET
  ) {
    return bestNode;
  }

  return best;
}

/**
 * A new transformer is needed only when tapping a raw line/substation AND there
 * is no existing pole/transformer within ~150 ft to step the voltage down (PRD §7.4).
 * Connecting at an existing distribution pole/transformer never needs a new one.
 */
export function needsTransformer(
  origin: LatLon,
  nearest: NearestResult,
  features: PowerFeature[]
): boolean {
  if (nearest.type === "pole" || nearest.type === "transformer") return false;

  const from = point([origin.lon, origin.lat]);
  const hasNearbyDropPoint = features.some((f) => {
    if (f.type !== "pole" && f.type !== "transformer") return false;
    const g = f.geometry[0];
    const meters = turfDistance(from, point([g.lon, g.lat]), { units: "meters" });
    return meters * METERS_TO_FEET <= NEAR_POLE_FEET;
  });
  return !hasNearbyDropPoint;
}
