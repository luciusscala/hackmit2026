# Plume API reference

Notes on `https://plume.hackmit.org/api/v3`, the platform HackMIT uses for project
submission and judging. Plume publishes no API specification. The public endpoints
below were verified directly on 2026-09-19 (the first day of HackMIT 2026). The
route inventory was taken from the client bundle, which is generated from Plume's
OpenAPI definition and lists 128 routes.

**Platform:** Flask backend with JWT authentication; React frontend.

## Public endpoints

### `GET /projects/gallery`

Paginated project listing. This is the entry point for both pipelines.

| Parameter | Description |
|---|---|
| `hackathon_id` | Event ID, e.g. `hack-2026` |
| `page`, `items_per_page` | 1-based paging; the site uses 24 per page |
| `search`, `track`, `preference`, `winners_only` | Optional filters |

Response: `{ total_projects, preferences, projects }`. Page through the results
until `projects` is empty.

| Project field | Description |
|---|---|
| `id` | Stable project ID (`pr-…`); used as the primary key |
| `magic_link` | Public slug: `plume.hackmit.org/project/{magic_link}` |
| `name`, `hackathon_id` | |
| `track` | Judging track; `NO TRACK` until tracks are assigned |
| `preferences[]` | Sponsor challenges entered |
| `prize_winners[]` | Awards; empty until after judging |
| `table_location`, `judging_table_label`, `needs_power`, `join_link` | Logistics |
| `project_metadata` | JSON-encoded string containing the writeup |

`project_metadata` contains `description`, `what_it_does`, `inspiration`,
`how_we_built_it`, `individual_contributions`, `challenges_we_ran_into`,
`accomplishments`, `what_we_learned`, `whats_next`, `code_link`, `links`,
`video_demo` and `sponsorChallenges[]`.

Past events are also available: `hack-2025` contains 319 projects. `hack-2024`
predates Plume and is empty.

### `GET /projects/{id}`

Full project record, including `categories[]`, `rank`, `score` and `hackers[]`
(team members).

`rank` is 0-based within the project's track, and `score` is the judging score.
Both are `null` until judging takes place; 250 of 319 HackMIT 2025 projects are
ranked. These are the only judging results Plume exposes publicly:
`prize_winners[]` is empty for 2025.

Member names and emails are blank in the public response. Each member record
does include registration fields, such as travel and financial-aid status. These
pipelines read only `organization`, `role` and `status` and discard everything
else (see [data.md](./data.md)). This exposure should be reported to the HackMIT
organizers.

### Other public endpoints

| Endpoint | Returns |
|---|---|
| `GET /projects/get_id/{magic_link}` | `{ id }` for a public slug |
| `GET /hackathons` | Event IDs: `hack-2024`, `bp-2025`, `hack-2025`, `bp-2026`, `hack-2026` |
| `GET /hackathons/metadata` | Project and participant counts per event |
| `GET /hackathons/{id}/challenges` | Sponsor challenges (alias: `/categories`); 23 for 2026 |
| `GET /hackathons/{id}/challenges/{ca-id}/projects` | Projects entered in one challenge |
| `GET /hackathons/{id}/tracks` | Judging tracks; empty for 2026 before judging |

## Authenticated endpoints

The remaining routes require a session token and return `401` without one, or
`403` for a token without the required role. They cover administration, judging,
prize management, table assignment, user profiles and applications. None of them
are used by this project.

The route names show that Plume judging is **pairwise**: a judge is shown two
projects at a time and picks the stronger one. A ranking is then assembled per
track from these comparisons, which is why `rank` is only meaningful within a
track.

## Usage in this project

1. Both pipelines page through `/projects/gallery`, then request `/projects/{id}`
   once per project for team, affiliation and judging data.
2. During judging, `stats-sync/sync.py --every 600` and `map-pipeline/refresh.py`
   pick up new `rank`, `score`, `track` and `prize_winners` values.
3. HackMIT 2025 serves as the labelled reference set for the forecast.
