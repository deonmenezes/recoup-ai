"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { ConnectionEstimate, LatLon } from "@/lib/types";
import { DEMO_REGION } from "@/lib/fixtures";

function divIcon(className: string, inner: string, size = 34) {
  return L.divIcon({
    className: "gp-icon",
    html: `<div class="${className}" style="width:${size}px;height:${size}px"><span>${inner}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    tooltipAnchor: [0, -size],
  });
}

/** Re-fit the viewport whenever the two endpoints change. */
function FitView({ a, b }: { a: LatLon | null; b: LatLon | null }) {
  const map = useMap();
  useEffect(() => {
    if (a && b) {
      const bounds = L.latLngBounds([a.lat, a.lon], [b.lat, b.lon]);
      // Pull back a touch so the surrounding watercolor (hills, river, vineyards)
      // frames the connection, closer to the reference vista — markers stay visible.
      map.fitBounds(bounds, { padding: [180, 180], maxZoom: 15, animate: true });
    } else if (a) {
      map.setView([a.lat, a.lon], 14, { animate: true });
    }
  }, [a, b, map]);
  return null;
}

/** Draw the connector line in, left → right, as a glowing reveal. */
function AnimatedConnector({ a, b }: { a: LatLon; b: LatLon }) {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setProgress(0);
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out
      setProgress(1 - Math.pow(1 - t, 3));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [a, b]);

  const head: LatLon = {
    lat: a.lat + (b.lat - a.lat) * progress,
    lon: a.lon + (b.lon - a.lon) * progress,
  };
  const positions: [number, number][] = [
    [a.lat, a.lon],
    [head.lat, head.lon],
  ];

  return (
    <>
      {/* soft glow underlay */}
      <Polyline positions={positions} pathOptions={{ color: "#fbbf24", weight: 9, opacity: 0.35 }} />
      {/* bright core */}
      <Polyline positions={positions} pathOptions={{ color: "#f59e0b", weight: 3.5, opacity: 0.95 }} />
    </>
  );
}

export default function MapView({ estimate }: { estimate: ConnectionEstimate | null }) {
  const center: [number, number] = estimate
    ? [estimate.coordinates.lat, estimate.coordinates.lon]
    : [DEMO_REGION.lat, DEMO_REGION.lon];

  const propertyIcon = useMemo(() => divIcon("map-pin property", "⌂"), []);
  const gridIcon = useMemo(() => divIcon("map-pin grid", "⚡"), []);

  const property = estimate?.coordinates ?? null;
  const grid = estimate
    ? { lat: estimate.nearestGridPoint.lat, lon: estimate.nearestGridPoint.lon }
    : null;

  const mid: [number, number] | null =
    property && grid
      ? [(property.lat + grid.lat) / 2, (property.lon + grid.lon) / 2]
      : null;

  const connectionLabel =
    estimate?.nearestGridPoint.type === "pole"
      ? "Power Pole"
      : estimate?.nearestGridPoint.type === "transformer"
      ? "Transformer"
      : estimate?.nearestGridPoint.type === "substation"
      ? "Substation"
      : "Power Line";

  return (
    <MapContainer
      center={center}
      zoom={13}
      zoomControl={false}
      attributionControl={true}
      style={{ height: "100%", width: "100%" }}
    >
      {/* Clean, reliable base map (no key required). */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={20}
      />

      <FitView a={property} b={grid} />

      {/* Faint overlay of nearby power lines (PRD stretch). */}
      {estimate?.features
        .filter((f) => f.geometry.length >= 2 && (f.type === "line" || f.type === "minor_line"))
        .map((f) => (
          <Polyline
            key={f.id}
            positions={f.geometry.map((g) => [g.lat, g.lon] as [number, number])}
            pathOptions={{ color: "#7c3aed", weight: 1.5, opacity: 0.35, dashArray: "4 6" }}
          />
        ))}

      {property && grid && <AnimatedConnector a={property} b={grid} />}

      {property && (
        <Marker position={[property.lat, property.lon]} icon={propertyIcon}>
          <Tooltip permanent direction="top" className="gp-tip property-tip" offset={[0, -6]}>
            <strong>Your Property</strong>
            <br />
            <span>{estimate?.address.split(",")[0]}</span>
          </Tooltip>
        </Marker>
      )}

      {grid && (
        <Marker position={[grid.lat, grid.lon]} icon={gridIcon}>
          <Tooltip permanent direction="right" className="gp-tip grid-tip" offset={[8, 0]}>
            <strong>Connection Point</strong>
            <br />
            <span className="hl">{connectionLabel}</span>
            <br />
            <span>{estimate?.mode === "underground" ? "Underground Line" : "Overhead Line"}</span>
          </Tooltip>
        </Marker>
      )}

      {mid && estimate && (
        <Marker
          position={mid}
          icon={L.divIcon({
            className: "gp-icon",
            html: `<div class="dist-label">${estimate.distanceFeet} ft</div>`,
            iconSize: [70, 28],
            iconAnchor: [35, 14],
          })}
          interactive={false}
        />
      )}
    </MapContainer>
  );
}
