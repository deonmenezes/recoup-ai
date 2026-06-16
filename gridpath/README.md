# GridPath

**The fastest way to get clean energy.** Type a property address and instantly see
where the grid is, what it costs to connect, how long it takes, and start the
application.

GridPath turns grid connection — one of the most opaque processes in property
ownership — into a 30-second address lookup. Every number derives transparently
from **one** measured input: distance to the nearest grid infrastructure.

## The 30-second demo

1. Open the app (or visit `/?demo=1` to auto-load the locked demo address).
2. Type an address → autocomplete → select.
3. Watch the connector line draw on the watercolor map from the property to the
   nearest power pole.
4. Read three honest numbers: **distance · cost · timeline**.
5. Toggle **overhead ↔ underground** and watch the cost swing.
6. Click **Start Application** → short form → confirmation.

Locked demo region: **Healdsburg, California** (well-mapped distribution grid).

## How it works

| Step | Source |
|------|--------|
| Geocoding + autocomplete | Nominatim (OSM), proxied server-side |
| Nearest grid infrastructure | OpenStreetMap `power=*` via the Overpass API |
| Distance | Turf.js — `nearestPointOnLine` for lines, point distance for poles |
| Cost | Transparent formula: `base + (ft × rate) + transformer? + meter drop` |
| Timeline | Distance buckets (4–6 wk / 6–12 wk / 3–6 mo) + 2 wk review |
| Map | Leaflet + Stamen Watercolor tiles + animated connector line |

The connection point prefers an existing **pole/transformer** when one is within
~50 ft of the nearest line — utilities connect new service at the pole, not by
tapping a line mid-span.

### Transparent cost model

```
estimated_cost = base_connection_fee            # $1,500 flat
               + (distance_ft × extension_rate) # $20/ft overhead, $60/ft underground
               + transformer_cost               # $1,000, only if tapping a raw line
               + meter_service_drop             # $500 flat
```

All rates live in `src/lib/cost.ts` — illustrative placeholders; tune for your
utility before judging.

## Resilience (demo insurance)

- **Overpass** is wrapped with a required User-Agent, a widening-radius retry, two
  mirror endpoints, in-memory caching, and a **bundled fixture fallback**
  (`src/lib/fixtures.ts`) so a live pitch never dies on a flaky/rate-limited API.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000  (or /?demo=1)
npm run build    # production build
```

No API keys required — Nominatim, Overpass, and Stamen Watercolor (via Stadia)
all work on localhost out of the box.

## Project structure

```
src/
  app/
    page.tsx              # orchestration + layout
    api/geocode/route.ts  # Nominatim proxy (autocomplete)
    api/grid/route.ts     # Overpass + nearest point + cost/timeline
    api/lead/route.ts     # in-memory lead capture
  lib/
    grid.ts               # Overpass parsing + nearest-point math (Turf)
    overpass.ts           # Overpass client: cache, retry, fixture fallback
    cost.ts / timeline.ts # transparent estimate models
    estimate.ts           # assembles a ConnectionEstimate
    fixtures.ts           # locked demo address + fallback power data
  components/
    MapView.tsx           # watercolor Leaflet map + animated connector
    AddressSearch.tsx     # debounced autocomplete
    ApplicationForm.tsx   # lead form + confirmation
```

## Scope (per PRD)

**In:** new/upgraded service connections — new build, raw land, ADU, major new load.
**Out (v1):** solar interconnection, real utility integrations, engineering-grade
cost accuracy, multi-utility support.
