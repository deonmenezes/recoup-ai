// Demo insurance (PRD §10). Real OSM power features captured near the locked
// demo region, so a live pitch never dies on a slow or rate-limited Overpass.
//
// Region: Healdsburg, Sonoma County, California (well-mapped distribution grid).

interface FixtureElement {
  type: "node" | "way";
  id: number;
  tags: { power: string };
  lat?: number;
  lon?: number;
  geometry?: { lat: number; lon: number }[];
}

/**
 * Pre-validated demo address. Coordinates sit ~289 ft from an existing power
 * pole, which reproduces the reference design (Power Pole · ~6–12 weeks).
 */
export const DEMO_ADDRESS = {
  label: "123 Vine Creek Rd, Healdsburg, CA 95448",
  lat: 38.6109,
  lon: -122.843,
};

/** Center the map here when nothing is selected yet. */
export const DEMO_REGION = {
  name: "Healdsburg, California",
  lat: 38.6107,
  lon: -122.8694,
};

export const DEMO_FIXTURE_ELEMENTS: FixtureElement[] = [
  { type: "node", id: 55951629, tags: { power: "pole" }, lat: 38.617079, lon: -122.843511 },
  { type: "node", id: 55951630, tags: { power: "pole" }, lat: 38.6148661, lon: -122.8436035 },
  { type: "node", id: 55951631, tags: { power: "pole" }, lat: 38.6134159, lon: -122.8437257 },
  { type: "node", id: 55951632, tags: { power: "pole" }, lat: 38.6119192, lon: -122.8440573 },
  { type: "node", id: 55951633, tags: { power: "pole" }, lat: 38.6108726, lon: -122.8440111 },
  { type: "node", id: 55951636, tags: { power: "pole" }, lat: 38.608579, lon: -122.8434738 },
  { type: "node", id: 55951643, tags: { power: "pole" }, lat: 38.6074157, lon: -122.8426926 },
  { type: "node", id: 55974337, tags: { power: "pole" }, lat: 38.6240184, lon: -122.8494543 },
  { type: "node", id: 55974338, tags: { power: "pole" }, lat: 38.6237184, lon: -122.8489113 },
  { type: "node", id: 55974339, tags: { power: "pole" }, lat: 38.6236313, lon: -122.848758 },
  {
    type: "way",
    id: 7699234,
    tags: { power: "line" },
    geometry: [
      { lat: 38.8015297, lon: -122.9880565 },
      { lat: 38.7671939, lon: -122.9687288 },
      { lat: 38.7406765, lon: -122.9063607 },
      { lat: 38.7011037, lon: -122.8594962 },
      { lat: 38.64441, lon: -122.856312 },
      { lat: 38.6158403, lon: -122.8435472 },
      { lat: 38.5954816, lon: -122.8181818 },
      { lat: 38.553067, lon: -122.7757683 },
    ],
  },
  {
    type: "way",
    id: 184864655,
    tags: { power: "substation" },
    geometry: [
      { lat: 38.6101866, lon: -122.8566529 },
      { lat: 38.6101812, lon: -122.8558809 },
      { lat: 38.6094595, lon: -122.8558891 },
      { lat: 38.6094649, lon: -122.8566611 },
      { lat: 38.6101866, lon: -122.8566529 },
    ],
  },
];
