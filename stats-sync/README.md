# stats-sync

Loads projects, team members and judging results from the Plume gallery into
Supabase. The resulting `gallery` and `hackers` tables back the statistics page
in `../web`.

The sync is idempotent: rows are upserted by Plume ID and never deleted, so it
can be re-run at any time.

## Setup

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env             # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

Apply the scripts in `sql/` in numerical order using the Supabase SQL editor.

## Usage

```bash
python sync.py                       # sync HackMIT 2026
python sync.py --hackathon hack-2025 # sync another event
python sync.py --dry-run             # fetch and print without writing
python sync.py --skip-details        # gallery only; skip per-project team and ranking data
python sync.py --every 600           # re-sync every 10 minutes (useful during judging)
```

See [`../docs/plume-api.md`](../docs/plume-api.md) for the endpoints used.
