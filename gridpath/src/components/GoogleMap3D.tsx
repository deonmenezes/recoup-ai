"use client";

// Google Photorealistic 3D map (Map3DElement). Activates only when a public
// Google Maps key is set. Calls onFail() on any error so the caller can fall
// back to the 2D Leaflet map — the user is never stuck on a blank map.

import { useEffect, useRef } from "react";
import { DEMO_REGION } from "@/lib/fixtures";
import type { ConnectionEstimate } from "@/lib/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: any;
    __gridpathGoogleLoader?: Promise<void>;
  }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (window.__gridpathGoogleLoader) return window.__gridpathGoogleLoader;

  window.__gridpathGoogleLoader = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    // v=alpha exposes the maps3d (Photorealistic 3D) library.
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&v=alpha&libraries=maps3d`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google Maps JS"));
    document.head.appendChild(s);
  });
  return window.__gridpathGoogleLoader;
}

export default function GoogleMap3D({
  apiKey,
  estimate,
  onFail,
}: {
  apiKey: string;
  estimate: ConnectionEstimate | null;
  onFail?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const libRef = useRef<any>(null);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleMaps(apiKey);
        if (cancelled || !containerRef.current) return;
        const maps3d = await window.google.maps.importLibrary("maps3d");
        libRef.current = maps3d;
        if (mapRef.current) return;

        const c = estimate?.coordinates ?? { lat: DEMO_REGION.lat, lon: DEMO_REGION.lon };
        const map = new maps3d.Map3DElement({
          center: { lat: c.lat, lng: c.lon, altitude: 0 },
          range: 2200,
          tilt: 55,
          heading: 30,
        });
        map.style.width = "100%";
        map.style.height = "100%";
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(map);
        mapRef.current = map;
        if (estimate) await draw(map, maps3d, estimate);
      } catch (err) {
        console.error("Google 3D map failed; falling back.", err);
        onFail?.();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // Redraw markers + fly camera when the estimate changes.
  useEffect(() => {
    const map = mapRef.current;
    const maps3d = libRef.current;
    if (!map || !maps3d || !estimate) return;
    draw(map, maps3d, estimate).catch((err) => {
      console.error("Google 3D draw failed; falling back.", err);
      onFail?.();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimate]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}

async function draw(map: any, maps3d: any, estimate: ConnectionEstimate) {
  const { Marker3DElement, Polyline3DElement, AltitudeMode } = maps3d;
  // Clear prior overlays.
  Array.from(map.querySelectorAll("gmp-marker-3d, gmp-polyline-3d")).forEach((n) =>
    (n as Element).remove()
  );

  const prop = estimate.coordinates;
  const grid = estimate.nearestGridPoint;
  const connLabel =
    grid.type === "pole"
      ? "Power Pole"
      : grid.type === "transformer"
      ? "Transformer"
      : grid.type === "substation"
      ? "Substation"
      : "Power Line";

  // Fly the camera over the property.
  map.center = { lat: prop.lat, lng: prop.lon, altitude: 0 };
  map.range = 700;
  map.tilt = 67;

  const propMarker = new Marker3DElement({
    position: { lat: prop.lat, lng: prop.lon, altitude: 30 },
    altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
    label: "Your Property",
    extruded: true,
  });
  const gridMarker = new Marker3DElement({
    position: { lat: grid.lat, lng: grid.lon, altitude: 30 },
    altitudeMode: AltitudeMode.RELATIVE_TO_GROUND,
    label: `${connLabel} · ${estimate.distanceFeet} ft`,
    extruded: true,
  });
  const line = new Polyline3DElement({
    coordinates: [
      { lat: prop.lat, lng: prop.lon },
      { lat: grid.lat, lng: grid.lon },
    ],
    strokeColor: "#e0a82e",
    strokeWidth: 12,
    altitudeMode: AltitudeMode.CLAMP_TO_GROUND,
  });

  map.append(propMarker, gridMarker, line);
}
