# map-pipeline

Builds the data behind the `/map`, `/forecast` and `/match` pages in `../web`
from HackMIT and Blueprint projects for 2025–2026.

## Components

| Script | Purpose | Output |
|---|---|---|
| `scrape.py` | Collects gallery listings and per-project detail from Plume, with a local cache | `data/projects.json` |
| `similarity.py` | Builds the writeup similarity graph, 3D layout and theme clusters | `data/graph.json`, `data/coords.json` |
| `forecast.py` | Scores 2026 projects against judged 2025 projects and reports cross-validated accuracy | `data/forecast.json` |
| `elastic_map.py` | Publishes the map snapshot to Elasticsearch | `hackmit-map` index |
| `refresh.py` | Runs the full pipeline and records progress for the web application | `data/refresh_status.json` |

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # ELASTIC_URL, ELASTIC_API_KEY (optional)
```

## Usage

```bash
python refresh.py                # refresh HackMIT 2026 and rebuild all outputs
python refresh.py --all          # re-collect every event
```

To run the stages individually:

```bash
python scrape.py
python similarity.py --copy-public ../web/public/map
python forecast.py   --copy-public ../web/public/forecast
python elastic_map.py
```

`--copy-public` updates the snapshots that the web application serves when
Elasticsearch is not configured. The `data/` directory is excluded from version
control and can be regenerated at any time.

## Documentation

- [`../docs/data.md`](../docs/data.md): fields collected and how they are used
- [`../docs/similarity.md`](../docs/similarity.md): similarity, layout and clustering methodology
- [`../docs/plume-api.md`](../docs/plume-api.md): Plume API reference
