# Data model

This document describes the project data collected by `map-pipeline/scrape.py`
and stored in `data/projects.json`. `stats-sync` stores a subset of the same
fields in Supabase.

## Sources

Two public, unauthenticated Plume endpoints are used (see [plume-api.md](./plume-api.md)):

1. `GET /api/v3/projects/gallery`: paginated project listing
2. `GET /api/v3/projects/{id}`: full project record

Events covered: HackMIT 2025 (`hack-2025`), HackMIT 2026 (`hack-2026`),
Blueprint 2025 (`bp-2025`) and Blueprint 2026 (`bp-2026`).

## Fields stored per project

| Field | Source | Notes |
|---|---|---|
| Writeup sections (`description`, `what_it_does`, `inspiration`, `how_we_built_it`, …) | Project metadata | Free text entered by the team |
| `track`, `categories[]` | Gallery and detail | Judging track and prize categories |
| `sponsor_challenges[]` | Detail | Sponsor prizes the team entered |
| `prize_winners`, `is_winner` | Gallery and detail | Populated after the closing ceremony |
| `rank`, `score` | Detail | Result of pairwise judging, 0-based within track. Available for HackMIT 2025; empty for 2026 until judging concludes |
| `team_size` | Detail | Number of listed team members |
| `schools[]`, `n_schools` | Detail | Distinct member affiliations |
| `members[]` | Detail | Affiliation, role and status per member. Names are blank in public responses |

## Excluded fields

The public detail response also includes registration and logistics fields.
These are unrelated to the projects and are discarded on ingest, never written
to disk:

`finaid`, `travelStatus`, `travelSubmitted`, `travelDenialReasons`,
`liabilityDocusignCompleted`, `mediaDocusignCompleted`, `tshirtSize`, `email`.

## Downstream use

| Stage | File | Role |
|---|---|---|
| Collection | `data/projects.json` | One record per project with team, affiliations and challenges |
| Similarity | `data/graph.json`, `data/coords.json` | Similarity graph and 3D layout (`similarity.py`) |
| Training labels | `rank`, `score` on HackMIT 2025 | Ground truth for forecast validation |
| Forecast | `data/forecast.json` | Scores for HackMIT 2026 projects (`forecast.py`) |
