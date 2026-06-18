// Assembles a full ConnectionEstimate from a geocoded point (PRD §8).
// One measured input — distance — drives cost, timeline, and the map line.

import { computeCost } from "./cost";
import { computeTimeline } from "./timeline";
import {
  findNearest,
  needsTransformer as computeNeedsTransformer,
  parseFeatures,
} from "./grid";
import { queryPowerFeatures } from "./overpass";
import type { ConnectionEstimate, ServiceMode, WireScenario } from "./types";

interface BuildArgs {
  address: string;
  lat: number;
  lon: number;
  mode?: ServiceMode;
  wireScenario?: WireScenario;
}

export async function buildEstimate({
  address,
  lat,
  lon,
  mode = "overhead",
  wireScenario = "standard",
}: BuildArgs): Promise<ConnectionEstimate | null> {
  const { elements, fromFixture } = await queryPowerFeatures(lat, lon);
  const features = parseFeatures(elements);

  const nearest = findNearest({ lat, lon }, features);
  if (!nearest) return null;

  const needsTransformer = computeNeedsTransformer({ lat, lon }, nearest, features);
  const distanceFeet = Math.round(nearest.distanceFeet);
  const estimatedCost = computeCost(distanceFeet, needsTransformer, mode, wireScenario);
  const estimatedTimeline = computeTimeline(distanceFeet, needsTransformer);

  const houseConnection = wireScenario === "house";
  const transformerNote = houseConnection
    ? " House connection: you hook onto the existing pole/meter, so there's no line run or new transformer."
    : needsTransformer
      ? " A new transformer is required (no existing pole/transformer within 150 ft)."
      : " You're within 150 ft of an existing pole/transformer, so no new transformer is needed.";

  const explanation = houseConnection
    ? `Nearest grid point is a ${nearest.type.replace("_", " ")} ${distanceFeet} ft away. ` +
      `House connection — cost = base fee + meter drop only (no wire run).` +
      transformerNote
    : `Nearest grid point is a ${nearest.type.replace("_", " ")} ${distanceFeet} ft away. ` +
      `Cost = base fee + (${distanceFeet} ft × ${mode} rate) + ${needsTransformer ? "transformer" : "no transformer"} + meter drop.` +
      transformerNote;

  return {
    id: `est_${lat.toFixed(5)}_${lon.toFixed(5)}_${mode}_${wireScenario}`,
    address,
    coordinates: { lat, lon },
    nearestGridPoint: { ...nearest.nearest, type: nearest.type },
    distanceFeet,
    needsTransformer,
    mode,
    wireScenario,
    estimatedCost,
    estimatedTimeline,
    explanation,
    features,
    fromFixture,
  };
}
