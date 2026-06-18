"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import AddressSearch from "@/components/AddressSearch";
import GovApplication from "@/components/GovApplication";
import GrantsOffer from "@/components/GrantsOffer";
import CallButton from "@/components/CallButton";
import CleanEnergyPlanView from "@/components/CleanEnergyPlan";
import { LogoFull } from "@/components/Logo";
import { formatUsd } from "@/lib/cost";
import { DEMO_ADDRESS } from "@/lib/fixtures";
import type { ConnectionEstimate, GeocodeResult, ServiceMode, WireScenario } from "@/lib/types";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading map…</div>,
});
const GoogleMap3D = dynamic(() => import("@/components/GoogleMap3D"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading 3D map…</div>,
});

export default function AppPage() {
  const [address, setAddress] = useState("");
  const [selected, setSelected] = useState<GeocodeResult | null>(null);
  const [mode, setMode] = useState<ServiceMode>("overhead");
  const [wireScenario, setWireScenario] = useState<WireScenario>("standard");
  const [estimate, setEstimate] = useState<ConnectionEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"estimate" | "apply">("estimate");
  const [showWhy, setShowWhy] = useState(false);
  const [google3dFailed, setGoogle3dFailed] = useState(false);

  const useGoogle = Boolean(GOOGLE_KEY) && !google3dFailed;

  const runEstimate = useCallback(async (sel: GeocodeResult, m: ServiceMode, w: WireScenario) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/grid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: sel.label, lat: sel.lat, lon: sel.lon, mode: m, wireScenario: w }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to estimate");
      setEstimate(data as ConnectionEstimate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSelect(r: GeocodeResult) {
    setSelected(r);
    setAddress(r.label);
    setStep("estimate");
    runEstimate(r, mode, wireScenario);
  }

  function handleClear() {
    setAddress("");
    setSelected(null);
    setEstimate(null);
    setError(null);
    setStep("estimate");
  }

  function changeMode(m: ServiceMode) {
    setMode(m);
    if (selected) runEstimate(selected, m, wireScenario);
  }

  function changeWireScenario(w: WireScenario) {
    setWireScenario(w);
    if (selected) runEstimate(selected, mode, w);
  }

  const useDemo = useCallback(() => {
    const demo: GeocodeResult = { label: DEMO_ADDRESS.label, lat: DEMO_ADDRESS.lat, lon: DEMO_ADDRESS.lon };
    setSelected(demo);
    setAddress(demo.label);
    setStep("estimate");
    setMode("overhead");
    setWireScenario("standard");
    runEstimate(demo, "overhead", "standard");
  }, [runEstimate]);

  // Auto-load the demo address when ?demo is present (handy for a live pitch).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current) return;
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("demo")) {
      autoRan.current = true;
      useDemo();
    }
  }, [useDemo]);

  const place = selected ? shortPlace(selected.label) : "Enter an address to begin";

  return (
    <div className="root">
      {/* ---------------- Top navbar ---------------- */}
      <nav className="app-nav">
        <div className="app-nav-left">
          <Link href="/" className="back-link" aria-label="Back to home">
            ← Back
          </Link>
          <Link href="/" className="app-nav-brand" aria-label="GridPath home">
            <LogoFull size={30} tagline={false} />
          </Link>
        </div>
        <div className="app-nav-links">
          <Link href="/">Home</Link>
          <a href="/#how">How it works</a>
          <a href="/#advisor">Clean energy</a>
          <a href="/#why">Why GridPath</a>
        </div>
      </nav>

      <div className="app">
        {/* ---------------- Left panel ---------------- */}
        <aside className="panel">
          <div>
            <div className="step-label">1. Enter an address</div>
            <AddressSearch
              value={address}
              onChange={setAddress}
              onSelect={handleSelect}
              onClear={handleClear}
            />
            {!selected ? (
              <div className="demo-hint">
                Works for any U.S. address.{" "}
                <button onClick={useDemo}>Try a demo address →</button>
              </div>
            ) : (
              <div className="found">
                <span className="found-check">✓</span>
                <div>
                  <strong>Address found!</strong>
                  <div className="found-addr">{selected.label}</div>
                </div>
              </div>
            )}
          </div>

          {selected && (
            <div>
              <div className="step-label">2. Your connection estimate</div>

              {loading && (
                <div className="loading">
                  <span className="spinner" />
                  Measuring distance to the grid…
                </div>
              )}

              {error && <div className="error">{error}</div>}

              {!loading && !error && estimate && step === "estimate" && (
                <>
                  <div className="wire-toggle">
                    <div className="wire-toggle-label">Connection scenario</div>
                    <div className="wire-toggle-btns">
                      <button
                        className={wireScenario === "standard" ? "active" : ""}
                        onClick={() => changeWireScenario("standard")}
                      >
                        <div className="wt-icon">🔌</div>
                        <div className="wt-name">Standard service</div>
                        <div className="wt-sub">Run a new line — wire length applies</div>
                      </button>
                      <button
                        className={wireScenario === "house" ? "active" : ""}
                        onClick={() => changeWireScenario("house")}
                      >
                        <div className="wt-icon">🏠</div>
                        <div className="wt-name">House connection</div>
                        <div className="wt-sub">Connect at the pole — no wire run</div>
                      </button>
                    </div>
                  </div>

                  <div className="stack-cards">
                    <div className="scard">
                      <div className="scard-icon green">📏</div>
                      <div>
                        <div className="scard-k">Distance to Grid</div>
                        <div className="scard-v">
                          {estimate.distanceFeet} ft{" "}
                          <span className="scard-sub">
                            ({(estimate.distanceFeet / 5280).toFixed(2)} miles)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="scard">
                      <div className="scard-icon amber">$</div>
                      <div>
                        <div className="scard-k">Estimated Cost</div>
                        <div className="scard-v cost">
                          {formatUsd(estimate.estimatedCost.total)} <span className="scard-sub">USD</span>
                        </div>
                      </div>
                    </div>
                    <div className="scard">
                      <div className="scard-icon purple">◷</div>
                      <div>
                        <div className="scard-k">Estimated Timeline</div>
                        <div className="scard-v">{estimate.estimatedTimeline.label}</div>
                        <div className="scard-sub">{estimate.estimatedTimeline.applicationNote}</div>
                      </div>
                    </div>
                  </div>

                  {estimate.fromFixture && (
                    <div className="fixture-badge">Demo data (live grid lookup unavailable)</div>
                  )}

                  <GrantsOffer estimate={estimate} />

                  <button className="btn" onClick={() => setStep("apply")}>
                    Apply for grants & connect →
                  </button>
                  <div className="takes">🔒 Auto-fills your government application · downloads a PDF</div>
                </>
              )}

              {!loading && !error && estimate && step === "apply" && (
                <GovApplication estimate={estimate} onBack={() => setStep("estimate")} />
              )}
            </div>
          )}

          {selected && estimate && !loading && !error && step === "estimate" && (
            <CallButton estimate={estimate} />
          )}

          {selected && <CleanEnergyPlanView selected={selected} />}
        </aside>

        {/* ---------------- Map ---------------- */}
        <main className="map-wrap">
          {useGoogle ? (
            <GoogleMap3D
              apiKey={GOOGLE_KEY as string}
              estimate={estimate}
              onFail={() => setGoogle3dFailed(true)}
            />
          ) : (
            <MapView estimate={estimate} />
          )}

          <div className="map-top-left">📍 {place}</div>

          <div className="map-top-right">
            <button className="pill" onClick={() => setShowWhy((v) => !v)}>
              ⓘ Why this estimate?
            </button>
          </div>

          {showWhy && estimate && (
            <div className="why-card">
              <strong>How we calculated this</strong>
              <p>{estimate.explanation}</p>
              <button onClick={() => setShowWhy(false)}>Got it</button>
            </div>
          )}

          {estimate && step === "estimate" && (
            <div className="map-bottom">
              <div className="mb-col">
                <div className="mb-title">Nearest Connection</div>
                <div className="mb-illus">🗼</div>
                <div className="mb-strong">{connectionName(estimate)}</div>
                <div className="mb-sub">
                  {estimate.mode === "underground" ? "Underground Line" : "Overhead Line"}
                </div>
              </div>

              <div className="mb-col">
                <div className="mb-title">Connection Type</div>
                <div className="conn-toggle">
                  <button
                    className={mode === "overhead" ? "active" : ""}
                    onClick={() => changeMode("overhead")}
                  >
                    <div className="ct-icon">🗼</div>
                    <div className="ct-name">Overhead</div>
                    <div className="ct-rate">$20/ft</div>
                    {mode === "overhead" && <div className="ct-default">default</div>}
                  </button>
                  <button
                    className={mode === "underground" ? "active" : ""}
                    onClick={() => changeMode("underground")}
                  >
                    <div className="ct-icon">⬓</div>
                    <div className="ct-name">Underground</div>
                    <div className="ct-rate">$60/ft</div>
                  </button>
                </div>
              </div>

              <div className="mb-col grow">
                <div className="mb-title">Estimate Breakdown</div>
                <div className="bd-row">
                  <span>Base connection fee</span>
                  <span>{formatUsd(estimate.estimatedCost.breakdown.baseConnectionFee)}</span>
                </div>
                <div className="bd-row">
                  <span>
                    Extension ({estimate.distanceFeet} ft × ${mode === "underground" ? 60 : 20}/ft)
                  </span>
                  <span>{formatUsd(estimate.estimatedCost.breakdown.lineExtension)}</span>
                </div>
                <div className="bd-row">
                  <span>Meter service drop</span>
                  <span>{formatUsd(estimate.estimatedCost.breakdown.meterServiceDrop)}</span>
                </div>
                <div className="bd-row">
                  <span>Transformer {estimate.needsTransformer ? "" : "(not required)"}</span>
                  <span>
                    {estimate.needsTransformer
                      ? formatUsd(estimate.estimatedCost.breakdown.transformer)
                      : "—"}
                  </span>
                </div>
                <div className="bd-row total">
                  <span>Estimated Total</span>
                  <span>{formatUsd(estimate.estimatedCost.total)}</span>
                </div>
              </div>

              <div className="mb-callout">
                <div className="callout-art">🌅</div>
                <em>Clean energy starts with clear connections.</em>
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="footer">
        <div className="foot-left">
          🛡 Estimates are based on public data and simple assumptions. Actual costs and
          timelines vary by utility.
        </div>
        <div className="foot-mid">
          {selected ? `Estimating for ${place}` : "Works for any mapped U.S. address"}
        </div>
        <div className="foot-right">© 2026 GridPath</div>
      </footer>
    </div>
  );
}

function connectionName(e: ConnectionEstimate): string {
  switch (e.nearestGridPoint.type) {
    case "pole":
      return "Power Pole";
    case "transformer":
      return "Transformer";
    case "substation":
      return "Substation";
    default:
      return "Power Line";
  }
}

/** "Snowden, Lincoln County, West Virginia, 25573, United States" -> "Snowden, West Virginia". */
function shortPlace(label: string): string {
  const parts = label
    .split(",")
    .map((s) => s.trim())
    .filter((p) => p && p !== "United States" && p !== "USA" && !/^\d{4,}/.test(p));
  if (parts.length <= 2) return parts.join(", ");
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}
