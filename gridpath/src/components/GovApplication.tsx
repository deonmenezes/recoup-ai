"use client";

import { useMemo, useState } from "react";
import { formatUsd } from "@/lib/cost";
import { computeGrantOffer } from "@/lib/grants";
import { buildApplicationPdf, type GovFormData } from "@/lib/pdf";
import type { ConnectionEstimate, PropertyType } from "@/lib/types";
import Icon from "@/components/Icon";
import GrantsOffer from "./GrantsOffer";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "new_build", label: "New construction" },
  { value: "land", label: "Raw land" },
  { value: "adu", label: "ADU" },
  { value: "load_upgrade", label: "Major load upgrade (EV, heat pump, shop)" },
];

const propertyLabel = (v: PropertyType) =>
  PROPERTY_TYPES.find((p) => p.value === v)?.label ?? v;

/** Stable, deterministic parcel id derived from coordinates (demo only). */
function parcelId(lat: number, lon: number): string {
  const a = Math.abs(Math.round(lat * 1000));
  const b = Math.abs(Math.round(lon * 1000));
  return `APN-${a}-${b}`;
}

/**
 * Automated government application: auto-fills the service address and connection
 * details, collects the applicant, then generates a downloadable Form GP-100 PDF.
 */
export default function GovApplication({
  estimate,
  onBack,
}: {
  estimate: ConnectionEstimate;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [propertyType, setPropertyType] = useState<PropertyType>("new_build");
  const [submitting, setSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const offer = useMemo(
    () => computeGrantOffer(estimate.estimatedCost.total, propertyType, estimate.wireScenario),
    [estimate, propertyType]
  );

  const scenarioLabel = estimate.wireScenario === "house" ? "House connection" : "Standard service";
  const modeLabel = estimate.mode === "underground" ? "Underground" : "Overhead";
  const nearestPoint = nearestLabel(estimate);

  function generatePdf(ref: string) {
    const data: GovFormData = {
      reference: ref,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      address: estimate.address,
      lat: estimate.coordinates.lat,
      lon: estimate.coordinates.lon,
      parcelId: parcelId(estimate.coordinates.lat, estimate.coordinates.lon),
      applicantName: name,
      applicantEmail: email,
      applicantPhone: phone,
      propertyType: propertyLabel(propertyType),
      scenarioLabel,
      modeLabel,
      distanceFeet: estimate.distanceFeet,
      needsTransformer: estimate.wireScenario === "house" ? false : estimate.needsTransformer,
      nearestPoint,
      timeline: estimate.estimatedTimeline.label,
      gross: offer.gross,
      grants: offer.grants.map((g) => ({ name: g.name, amount: g.amount })),
      totalApplied: offer.totalApplied,
      net: offer.net,
      percentOff: offer.percentOff,
    };
    const blob = buildApplicationPdf(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GridPath-Application-${ref}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      let ref = `GP-100-${parcelId(estimate.coordinates.lat, estimate.coordinates.lon).slice(4)}`;
      try {
        const res = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estimateId: estimate.id, name, email, phone, propertyType }),
        });
        const data = await res.json();
        if (res.ok && data.confirmation) ref = `GP-100-${data.confirmation.replace(/^GP-/, "")}`;
      } catch {
        /* lead capture is best-effort; the PDF still generates */
      }
      generatePdf(ref);
      setReference(ref);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate the application");
    } finally {
      setSubmitting(false);
    }
  }

  if (reference) {
    return (
      <div className="confirm">
        <div className="check"><Icon name="check" size={32} /></div>
        <h3>Application Form GP-100 generated</h3>
        <p>
          Your reference is <span className="code">{reference}</span>.<br />
          The auto-filled PDF for{" "}
          <strong>{estimate.address.split(",")[0]}</strong> just downloaded — net cost after
          grants <span className="code">{formatUsd(offer.net)}</span>.
        </p>
        <p style={{ marginTop: 12 }}>
          Next step: submit the PDF to your serving utility. They&apos;ll verify grant eligibility
          and confirm your connection.
        </p>
        <button className="btn" style={{ marginTop: 18 }} onClick={() => generatePdf(reference)}>
          <Icon name="download" size={16} /> Download PDF again
        </button>
        <button className="btn secondary" style={{ marginTop: 10 }} onClick={onBack}>
          Back to estimate
        </button>
      </div>
    );
  }

  return (
    <form className="form gov-form" onSubmit={submit}>
      <div className="section-title">Government connection application</div>
      <div className="gov-auto">
        <span className="gov-auto-badge">Auto-filled</span>
        <div className="gov-auto-row">
          <span>Service address</span>
          <strong>{estimate.address}</strong>
        </div>
        <div className="gov-auto-grid">
          <div>
            <span>Scenario</span>
            <strong>{scenarioLabel}</strong>
          </div>
          <div>
            <span>Service type</span>
            <strong>{modeLabel}</strong>
          </div>
          <div>
            <span>Distance to grid</span>
            <strong>{estimate.distanceFeet} ft</strong>
          </div>
          <div>
            <span>Net cost after grants</span>
            <strong className="green">{formatUsd(offer.net)}</strong>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="gname">Full name</label>
        <input id="gname" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="gemail">Email</label>
        <input id="gemail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="gphone">Phone</label>
        <input id="gphone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label htmlFor="gptype">Property type</label>
        <select id="gptype" value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <GrantsOffer estimate={estimate} propertyType={propertyType} offer={offer} />

      {error && <div className="error">{error}</div>}
      <button className="btn gold" type="submit" disabled={submitting}>
        {submitting ? (
          "Generating…"
        ) : (
          <>
            <Icon name="download" size={16} /> Generate &amp; download application PDF
          </>
        )}
      </button>
      <button className="btn secondary" type="button" onClick={onBack} disabled={submitting}>
        Back to estimate
      </button>
    </form>
  );
}

function nearestLabel(e: ConnectionEstimate): string {
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
