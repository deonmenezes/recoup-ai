// Grants & offer model. Takes the gross connection cost (the "offer") and applies
// a stack of (illustrative) government grants and rebates to reach a much cheaper
// net cost. Deterministic — the same inputs always produce the same offer, and the
// numbers mirror the iOS app exactly.

import type { Grant, GrantOffer, PropertyType, WireScenario } from "./types";

const round10 = (n: number) => Math.round(n / 10) * 10;

/**
 * Build the grant offer for a connection cost.
 * Grants scale with the cost (with caps) so a big bill like $80k gets big help —
 * but a floor keeps the net positive, so you always pay something.
 */
export function computeGrantOffer(
  gross: number,
  _propertyType: PropertyType,
  wireScenario: WireScenario
): GrantOffer {
  const grants: Grant[] = [
    {
      id: "usda_reap",
      name: "USDA REAP Grant",
      authority: "USDA Rural Energy for America",
      detail: "Covers up to 40% of rural energy connection costs.",
      amount: round10(Math.min(gross * 0.4, 40000)),
    },
    {
      id: "doe_grid_resilience",
      name: "Grid Resilience Grant",
      authority: "U.S. Dept. of Energy · IIJA",
      detail: "Bipartisan Infrastructure Law formula grant for grid hardening.",
      amount: round10(Math.min(gross * 0.15, 25000)),
    },
    // Line-extension cost-share only applies when a line is actually being run.
    ...(wireScenario === "standard"
      ? [
          {
            id: "state_line_extension",
            name: "Line-Extension Cost-Share",
            authority: "State Public Utilities Commission",
            detail: "State cost-share for new distribution line extensions.",
            amount: round10(Math.min(gross * 0.1, 12000)),
          } satisfies Grant,
        ]
      : []),
    {
      id: "lmi_subsidy",
      name: "LMI Connection Subsidy",
      authority: "State Energy Office",
      detail: "Low- & moderate-income service connection subsidy.",
      amount: round10(Math.min(gross * 0.08, 8000)),
    },
    {
      id: "gridpath_credit",
      name: "GridPath Clean-Connect Credit",
      authority: "GridPath",
      detail: "Unlocked by bundling a clean-energy plan.",
      amount: 1500,
    },
  ];

  const totalFace = grants.reduce((sum, g) => sum + g.amount, 0);
  // You always pay at least a floor — assistance can't zero out the bill.
  const floor = Math.max(round10(gross * 0.12), 250);
  const totalApplied = Math.min(totalFace, Math.max(gross - floor, 0));
  const net = Math.max(gross - totalApplied, 0);
  const percentOff = gross > 0 ? Math.round((totalApplied / gross) * 100) : 0;

  return { gross, grants, totalApplied, net, percentOff };
}
