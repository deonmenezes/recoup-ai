// Optional Google Maps integration. Everything here is key-gated: with
// GOOGLE_MAPS_API_KEY set we use Google for geocoding + real rooftop solar data
// (the Solar API), and without it the app falls back to OSM/estimates.

import type { GeocodeResult } from "./types";
import type { SolarApiData } from "./cleanenergy";

const KEY = process.env.GOOGLE_MAPS_API_KEY;

export function hasGoogle(): boolean {
  return Boolean(KEY);
}

interface GoogleGeocodeResponse {
  status: string;
  results: {
    formatted_address: string;
    geometry: { location: { lat: number; lng: number } };
  }[];
}

/** Geocode via Google when a key is set; returns null so callers can fall back. */
export async function googleGeocode(q: string): Promise<GeocodeResult[] | null> {
  if (!KEY) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as GoogleGeocodeResponse;
    if (data.status !== "OK") return null;
    return data.results.slice(0, 5).map((r) => ({
      label: r.formatted_address,
      lat: r.geometry.location.lat,
      lon: r.geometry.location.lng,
    }));
  } catch {
    return null;
  }
}

interface SolarInsights {
  solarPotential?: {
    maxArrayPanelsCount?: number;
    maxArrayAreaMeters2?: number;
    maxSunshineHoursPerYear?: number;
    panelCapacityWatts?: number;
    solarPanelConfigs?: { panelsCount: number; yearlyEnergyDcKwh: number }[];
  };
}

/**
 * Real rooftop solar potential for a point via the Google Solar API.
 * Returns null when the key is absent, the API isn't enabled, or coverage is missing.
 */
export async function fetchSolar(lat: number, lon: number): Promise<SolarApiData | null> {
  if (!KEY) return null;
  try {
    const url =
      `https://solar.googleapis.com/v1/buildingInsights:findClosest` +
      `?location.latitude=${lat}&location.longitude=${lon}&requiredQuality=LOW&key=${KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
    if (!res.ok) return null;
    const data = (await res.json()) as SolarInsights;
    const sp = data.solarPotential;
    if (!sp || !sp.maxArrayPanelsCount) return null;

    // Pick the largest config for "max potential" production.
    const best = (sp.solarPanelConfigs ?? []).reduce(
      (a, b) => (b.yearlyEnergyDcKwh > (a?.yearlyEnergyDcKwh ?? 0) ? b : a),
      undefined as { panelsCount: number; yearlyEnergyDcKwh: number } | undefined
    );

    const METERS2_TO_SQFT = 10.7639;
    return {
      maxPanels: sp.maxArrayPanelsCount,
      yearlyKwh: Math.round(best?.yearlyEnergyDcKwh ?? 0),
      sunHoursPerYear: Math.round(sp.maxSunshineHoursPerYear ?? 0) || 1850,
      roofAreaSqFt: Math.round((sp.maxArrayAreaMeters2 ?? 0) * METERS2_TO_SQFT),
    };
  } catch {
    return null;
  }
}
