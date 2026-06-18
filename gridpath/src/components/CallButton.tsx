"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import type { ConnectionEstimate } from "@/lib/types";

type Status = "idle" | "calling" | "placed" | "error";

/**
 * "Call me about this location" — places an outbound Twilio voice call that
 * speaks a contextual AI briefing about the selected location's grid estimate
 * and clean-energy plan.
 */
export default function CallButton({ estimate }: { estimate: ConnectionEstimate }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function placeCall(e: React.FormEvent) {
    e.preventDefault();
    setStatus("calling");
    setMessage(null);
    try {
      const res = await fetch("/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, estimate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the call");
      setStatus("placed");
      setMessage(`Calling ${data.to} now — Riley will brief you on this location.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="call-cta">
      <div className="step-label"><Icon name="phone" size={16} /> Get an AI call about this location</div>
      <p className="call-blurb">
        We&apos;ll call your phone and walk you through this site&apos;s grid distance,
        cost, timeline, and best clean-energy move.
      </p>
      <form className="call-form" onSubmit={placeCall}>
        <input
          type="tel"
          inputMode="tel"
          placeholder="(628) 555-0142"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          disabled={status === "calling"}
          aria-label="Your phone number"
        />
        <button className="btn" type="submit" disabled={status === "calling" || !phone}>
          {status === "calling" ? "Placing call…" : "Call me now"}
        </button>
      </form>
      {message && (
        <div className={status === "error" ? "error" : "call-ok"}>{message}</div>
      )}
    </div>
  );
}
