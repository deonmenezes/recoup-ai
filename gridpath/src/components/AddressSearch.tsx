"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import type { GeocodeResult } from "@/lib/types";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSelect: (r: GeocodeResult) => void;
  onClear: () => void;
}

export default function AddressSearch({ value, onChange, onSelect, onClear }: Props) {
  const [suggestions, setSuggestions] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const justSelected = useRef(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as GeocodeResult[];
        setSuggestions(data);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(id);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(r: GeocodeResult) {
    justSelected.current = true;
    onSelect(r);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="search" ref={boxRef}>
      <div style={{ position: "relative" }}>
        <span
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink)",
            display: "grid",
            placeItems: "center",
            pointerEvents: "none",
          }}
        >
          <Icon name="pin" size={16} />
        </span>
        <input
          type="text"
          value={value}
          placeholder="Enter a property address…"
          style={{ paddingLeft: 38, paddingRight: 38 }}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        {value && (
          <button
            onClick={() => {
              onClear();
              setSuggestions([]);
              setOpen(false);
            }}
            aria-label="Clear address"
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              fontSize: 18,
              color: "var(--ink-muted)",
            }}
          >
            ×
          </button>
        )}
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <ul className="suggestions">
          {loading && suggestions.length === 0 && (
            <li style={{ color: "var(--ink-muted)", cursor: "default" }}>Looking up…</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.lat}-${s.lon}-${i}`} onClick={() => pick(s)}>
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
