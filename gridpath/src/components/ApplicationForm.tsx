"use client";

import { useState } from "react";
import type { ConnectionEstimate, PropertyType } from "@/lib/types";
import { formatUsd } from "@/lib/cost";

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "new_build", label: "New construction" },
  { value: "land", label: "Raw land" },
  { value: "adu", label: "ADU" },
  { value: "load_upgrade", label: "Major load upgrade (EV, heat pump, shop)" },
];

export default function ApplicationForm({
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
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimateId: estimate.id, name, email, phone, propertyType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setConfirmation(data.confirmation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="confirm">
        <div className="check">✓</div>
        <h3>Application started</h3>
        <p>
          Your reference is <span className="code">{confirmation}</span>.<br />
          We&apos;ve captured your estimate of{" "}
          <span className="code">{formatUsd(estimate.estimatedCost.total)}</span> (
          {estimate.estimatedTimeline.label}) for{" "}
          {estimate.address.split(",")[0]}.
        </p>
        <p style={{ marginTop: 12 }}>
          Next step: your local utility will review the service request. A copy of this
          estimate has been attached.
        </p>
        <button className="btn secondary" style={{ marginTop: 18 }} onClick={onBack}>
          Start over
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <div className="section-title">Start your connection application</div>
      <div>
        <label htmlFor="name">Full name</label>
        <input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label htmlFor="phone">Phone</label>
        <input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <label htmlFor="ptype">Property type</label>
        <select id="ptype" value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}>
          {PROPERTY_TYPES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <button className="btn" type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit application"}
      </button>
      <button className="btn secondary" type="button" onClick={onBack} disabled={submitting}>
        Back to estimate
      </button>
    </form>
  );
}
