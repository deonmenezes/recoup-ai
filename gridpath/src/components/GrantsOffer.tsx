"use client";

import { formatUsd } from "@/lib/cost";
import { computeGrantOffer } from "@/lib/grants";
import type { ConnectionEstimate, GrantOffer, PropertyType } from "@/lib/types";

/**
 * "This is your offer — and these grants make it much cheaper."
 * Shows the gross connection cost, the stack of grants applied, and the net cost.
 */
export default function GrantsOffer({
  estimate,
  propertyType = "new_build",
  offer: offerProp,
}: {
  estimate: ConnectionEstimate;
  propertyType?: PropertyType;
  /** Pass a precomputed offer to keep figures in sync; otherwise computed here. */
  offer?: GrantOffer;
}) {
  const offer =
    offerProp ??
    computeGrantOffer(estimate.estimatedCost.total, propertyType, estimate.wireScenario);

  return (
    <div className="offer">
      <div className="offer-head">
        <span className="offer-eyebrow">💸 Your offer & available grants</span>
        <span className="offer-save">Save {offer.percentOff}%</span>
      </div>

      <div className="offer-prices">
        <div className="offer-gross">
          <span className="offer-k">Connection offer</span>
          <span className="offer-strike">{formatUsd(offer.gross)}</span>
        </div>
        <div className="offer-arrow">→</div>
        <div className="offer-net">
          <span className="offer-k">Your cost after grants</span>
          <span className="offer-net-v">{formatUsd(offer.net)}</span>
        </div>
      </div>

      <div className="grant-list">
        {offer.grants.map((g) => (
          <div className="grant" key={g.id}>
            <div className="grant-main">
              <div className="grant-name">{g.name}</div>
              <div className="grant-auth">{g.authority}</div>
              <div className="grant-detail">{g.detail}</div>
            </div>
            <div className="grant-amount">−{formatUsd(g.amount)}</div>
          </div>
        ))}
      </div>

      <div className="grant-total">
        <span>Total assistance applied</span>
        <span className="grant-total-v">−{formatUsd(offer.totalApplied)}</span>
      </div>

      <div className="offer-note">
        Grants are illustrative and based on program eligibility — GridPath pre-fills your
        application so you can claim them in one step.
      </div>
    </div>
  );
}
