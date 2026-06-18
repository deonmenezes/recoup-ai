"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/cost";
import Icon, { type IconName } from "@/components/Icon";
import type { CleanEnergyPlan, GeocodeResult } from "@/lib/types";

/** Map clean-energy option keys to geometric icons (avoids emoji from lib data). */
const OPTION_ICON: Record<string, IconName> = {
  rooftop_solar: "sun",
  battery: "battery",
  heat_pump: "heat",
  ev_charger: "plug",
};

export default function CleanEnergyPlanView({ selected }: { selected: GeocodeResult }) {
  const [plan, setPlan] = useState<CleanEnergyPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPlan(null);
    (async () => {
      try {
        const res = await fetch("/api/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: selected.label, lat: selected.lat, lon: selected.lon }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to build plan");
        if (!cancelled) setPlan(data as CleanEnergyPlan);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  return (
    <div className="cep">
      <div className="step-label">
        3. Make your energy clean
        {plan && (
          <span className={`src-badge ${plan.source}`}>
            {plan.source === "claude" ? (
              <>
                <Icon name="sparkle" size={11} /> Claude
              </>
            ) : (
              "estimate"
            )}
          </span>
        )}
      </div>

      {loading && (
        <div className="loading">
          <span className="spinner" />
          Claude is analyzing your roof, sun, and rates…
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {plan && !loading && (
        <>
          <div className="cep-headline">{plan.headline}</div>

          <div className="score">
            <div className="score-row">
              <span>Clean energy score</span>
              <span className="score-nums" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                {plan.cleanScoreBefore}
                <Icon name="arrow-right" size={13} />
                <b>{plan.cleanScoreAfter}</b>
              </span>
            </div>
            <div className="score-bar">
              <div className="score-before" style={{ width: `${plan.cleanScoreBefore}%` }} />
              <div
                className="score-after"
                style={{
                  left: `${plan.cleanScoreBefore}%`,
                  width: `${Math.max(0, plan.cleanScoreAfter - plan.cleanScoreBefore)}%`,
                }}
              />
            </div>
          </div>

          <p className="cep-summary">{plan.summary}</p>

          <div className="opt-list">
            {[...plan.options]
              .sort((a, b) => a.priority - b.priority)
              .map((o) => (
                <div key={o.key} className={`opt ${o.recommended ? "rec" : ""}`}>
                  <div className="opt-head">
                    <span className="opt-icon">
                      <Icon name={OPTION_ICON[o.key] ?? "leaf"} size={20} />
                    </span>
                    <span className="opt-name">{o.name}</span>
                    {o.recommended && <span className="opt-badge">Recommended</span>}
                  </div>
                  <div className="opt-headline">{o.headline}</div>
                  <div className="opt-what">{o.whatItIs}</div>
                  <div className="opt-stats">
                    <div>
                      <span className="os-k">Cost</span>
                      <span className="os-v">{formatUsd(o.estimatedCost)}</span>
                    </div>
                    <div>
                      <span className="os-k">Saves/yr</span>
                      <span className="os-v green">{formatUsd(o.annualSavings)}</span>
                    </div>
                    <div>
                      <span className="os-k">Payback</span>
                      <span className="os-v">{o.paybackYears} yr</span>
                    </div>
                    <div>
                      <span className="os-k">CO₂/yr</span>
                      <span className="os-v">{o.co2ReductionTons} t</span>
                    </div>
                  </div>
                  {o.incentives.length > 0 && (
                    <div className="opt-inc">
                      {o.incentives.map((i) => (
                        <span key={i} className="chip">
                          {i}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="bundle">
            <div className="bundle-title">Recommended bundle</div>
            <div className="bundle-items">{plan.recommendedBundle.items.join(" + ")}</div>
            <div className="bundle-stats">
              <span>
                {formatUsd(plan.recommendedBundle.totalCost)} <small>upfront</small>
              </span>
              <span className="green">
                {formatUsd(plan.recommendedBundle.totalAnnualSavings)} <small>/yr saved</small>
              </span>
            </div>
            <div className="bundle-note">{plan.recommendedBundle.note}</div>
          </div>

          {plan.signals.fromSolarApi && (
            <div className="src-note">Rooftop figures from Google Solar API for this address.</div>
          )}
        </>
      )}
    </div>
  );
}
