// Transparent cost model (PRD §7.4).
//
// estimated_cost =
//     base_connection_fee            // flat utility hookup/admin fee
//   + (distance_ft × extension_rate) // running the line to you
//   + transformer_cost               // only if a new transformer is needed
//   + meter_service_drop             // flat
//
// Every number traces back to ONE measured input: distance to the grid.
// These are illustrative placeholders — tune RATES for your demo region.

import type { CostBreakdown, EstimatedCost, ServiceMode, WireScenario } from "./types";

export const RATES = {
  baseConnectionFee: 1500,
  /** Per-foot cost to extend the line to the property. */
  extensionRate: {
    overhead: 20,
    underground: 60,
  } as Record<ServiceMode, number>,
  transformerCost: 1000,
  meterServiceDrop: 500,
} as const;

export function computeCost(
  distanceFeet: number,
  needsTransformer: boolean,
  mode: ServiceMode,
  wireScenario: WireScenario = "standard"
): EstimatedCost {
  // A "house connection" hooks straight onto the existing pole/meter, so there's
  // no wire run and no new transformer — only the base fee + meter service drop.
  const houseConnection = wireScenario === "house";

  const breakdown: CostBreakdown = {
    baseConnectionFee: RATES.baseConnectionFee,
    lineExtension: houseConnection ? 0 : Math.round(distanceFeet * RATES.extensionRate[mode]),
    transformer: !houseConnection && needsTransformer ? RATES.transformerCost : 0,
    meterServiceDrop: RATES.meterServiceDrop,
  };

  const total =
    breakdown.baseConnectionFee +
    breakdown.lineExtension +
    breakdown.transformer +
    breakdown.meterServiceDrop;

  return { total, breakdown };
}

export function formatUsd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}
