# Web application

Next.js application for the HackMIT 2026 Project Explorer.

## Pages

| Route | Description | Data source |
|---|---|---|
| `/` | Statistics for 2026, 2025, or both side by side (`?view=2025`, `?view=compare`) | Supabase, populated by `../stats-sync` |
| `/map` | Interactive 3D similarity map (react-three-fiber) | `GET /api/map`: Elasticsearch, or `public/map/coords.json` as fallback |
| `/forecast` | 2026 projects ranked against judged 2025 analogues | `GET /api/forecast`: `public/forecast/forecast.json` |
| `/match` | Retrieves the closest judged 2025 projects for a submitted writeup | `POST /api/match`: Elasticsearch, or keyword overlap on the forecast file as fallback |

The statistics page and the map pages use separate data stores, each maintained
by its own pipeline (`../stats-sync` and `../map-pipeline` respectively).

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev                      # http://localhost:3000
```

| Variable | Required for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Statistics page |
| `ELASTIC_URL`, `ELASTIC_API_KEY`, `ELASTIC_INDEX` | Optional. When unset, `/map` and `/match` use the committed JSON snapshots |
| `BACKEND_DIR`, `BACKEND_PYTHON` | Optional. Location of `map-pipeline` and its interpreter for the **Pull live** button |
| `REFRESH_SECRET` | Required to enable **Pull live** in production |

**Pull live** starts `../map-pipeline/refresh.py` in the background and polls its
status until the map and forecast have been rebuilt.

## Source layout

```
src/app/
  page.tsx                    statistics page (server-rendered)
  map/  forecast/  match/     one directory per page
  api/                        route handlers: map, forecast, match, refresh
src/lib/
  data.ts, stats/             Supabase queries and statistics computation
  map/                        map payload types, colors and layout constants
  elastic.ts                  Elasticsearch client
  forecast.ts, match.ts       forecast and match response types
  backend.ts                  locates map-pipeline for the refresh route
  tracks.ts                   judging track list
src/components/
  stats/                      statistics page sections
  charts/                     shared chart primitives
  map/                        ProjectMap (state), MapScene (WebGL), toolbar, legend, detail panel
  forecast/, match/           page-specific components and data hooks
  nav/                        navigation and the Pull live control
  ui/                         Segmented (URL-backed tabs), Metric (stat tile)
```
