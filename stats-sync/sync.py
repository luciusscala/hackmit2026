"""Sync the HackMIT Plume gallery into the Supabase `gallery` table.

Plume's gallery page is a client-rendered SPA; the data actually comes from a
public JSON endpoint, so we call that directly (5 requests for the whole
gallery) instead of scraping the DOM.

Each project's detail endpoint also lists its hackers with their school
(`organization`) — names and emails are blanked server-side — so we fetch that
per project (one request each) and upsert into the `hackers` table.
"""

import argparse
import json
import os
import sys
import time
from collections import Counter
from datetime import datetime, timezone

import requests
from dotenv import load_dotenv
from supabase import create_client

BASE_URL = "https://plume.hackmit.org"
DEFAULT_HACKATHON_ID = "hack-2026"
ITEMS_PER_PAGE = 24  # what the Plume frontend uses
USER_AGENT = "hackmit-survey-sync/1.0 (lscala@ucsd.edu)"
DELAY_BETWEEN_PAGES = 1.0
DELAY_BETWEEN_DETAILS = 0.5
TIMEOUT = 15


def fetch_page(session: requests.Session, hackathon_id: str, page: int) -> dict:
    url = f"{BASE_URL}/api/v3/projects/gallery"
    params = {"hackathon_id": hackathon_id, "page": page, "items_per_page": ITEMS_PER_PAGE}
    last_err: Exception | None = None
    for attempt in range(2):
        try:
            r = session.get(url, params=params, timeout=TIMEOUT)
            if r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code} from Plume")
            r.raise_for_status()
            data = r.json()
            if "projects" not in data:
                raise ValueError(f"unexpected response shape: {list(data)}")
            return data
        except (requests.RequestException, ValueError) as e:
            last_err = e
            if attempt == 0:
                time.sleep(3)
    raise SystemExit(f"page {page}: giving up after retry: {last_err}")


def fetch_all(session: requests.Session, hackathon_id: str) -> list[dict]:
    projects: list[dict] = []
    page = 1
    while True:
        data = fetch_page(session, hackathon_id, page)
        batch = data["projects"]
        total = data.get("total_projects")
        print(f"  page {page}: {len(batch)} projects (total reported: {total})")
        if not batch:
            break
        projects.extend(batch)
        if total is not None and len(projects) >= total:
            break
        page += 1
        time.sleep(DELAY_BETWEEN_PAGES)
    return projects


def fetch_project_detail(session: requests.Session, project_id: str) -> dict | None:
    """Full record (camelCase) incl. hackers[]. None if Plume won't serve it."""
    url = f"{BASE_URL}/api/v3/projects/{project_id}"
    for attempt in range(2):
        try:
            r = session.get(url, timeout=TIMEOUT)
            if r.status_code == 404:
                return None
            if r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code} from Plume")
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError) as e:
            if attempt == 0:
                time.sleep(3)
                continue
            print(f"  {project_id}: skipping hackers after retry: {e}")
    return None


def fetch_details(session: requests.Session, project_ids: list[str]) -> dict[str, dict]:
    """Full record per project: hackers[] (schools), rank, score, prizeWinners."""
    details: dict[str, dict] = {}
    for i, pid in enumerate(project_ids, 1):
        detail = fetch_project_detail(session, pid)
        if detail:
            details[pid] = detail
        if i % 20 == 0 or i == len(project_ids):
            print(f"  {i}/{len(project_ids)} projects")
        time.sleep(DELAY_BETWEEN_DETAILS)
    return details


def hacker_rows(details: dict[str, dict], hackathon_id: str, now: str) -> list[dict]:
    rows: list[dict] = []
    for pid, d in details.items():
        for h in d.get("hackers") or []:
            if not h.get("id"):
                continue
            rows.append(
                {
                    "hacker_id": h["id"],
                    "project_id": pid,
                    "hackathon_id": hackathon_id,
                    "user_id": h.get("userId") or (h.get("user") or {}).get("id"),
                    "organization": (h.get("organization") or "").strip() or None,
                    "role": h.get("role") or None,
                    "status": h.get("status") or None,
                    "last_updated": now,
                }
            )
    # A hacker can only be on one project; keep the last seen.
    return list({r["hacker_id"]: r for r in rows}.values())


def apply_judging(rows: list[dict], details: dict[str, dict]) -> None:
    """Merge rank / score / prize winners from the detail record into gallery rows."""
    for r in rows:
        d = details.get(r["project_id"])
        if not d:
            continue
        r["rank"] = d.get("rank")
        r["score"] = d.get("score")
        # prizeWinners on the detail is the same list as the gallery's prize_winners,
        # but the detail is fetched later so prefer it.
        if d.get("prizeWinners") is not None:
            r["prize_winners"] = d["prizeWinners"]


def to_row(p: dict, now: str) -> dict:
    # project_metadata is a JSON string inside the JSON response.
    try:
        meta = json.loads(p.get("project_metadata") or "{}")
    except json.JSONDecodeError:
        meta = {}
    text = lambda k: (meta.get(k) or "").strip() or None  # noqa: E731

    return {
        "project_id": p["id"],
        "hackathon_id": p.get("hackathon_id") or DEFAULT_HACKATHON_ID,
        "magic_link": p["magic_link"],
        "project_name": (p.get("name") or "").strip() or "(untitled)",
        "description": text("description") or text("what_it_does"),
        "what_it_does": text("what_it_does"),
        "inspiration": text("inspiration"),
        "how_we_built_it": text("how_we_built_it"),
        "code_link": text("code_link"),
        "video_demo": text("video_demo"),
        "track": p.get("track") or None,
        "preferences": p.get("preferences") or [],
        "prize_winners": p.get("prize_winners") or [],
        "table_location": p.get("table_location") or None,
        "needs_power": bool(p.get("needs_power")),
        "metadata": meta,
        "last_updated": now,
    }


def parse_args() -> argparse.Namespace:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="fetch and print, don't write")
    ap.add_argument(
        "--hackathon",
        default=DEFAULT_HACKATHON_ID,
        help="Plume hackathon id to sync (hack-2026, hack-2025, …)",
    )
    ap.add_argument(
        "--skip-details",
        action="store_true",
        help="only sync the gallery list; skip the per-project fetch (hackers, rank, score)",
    )
    ap.add_argument(
        "--every",
        type=int,
        metavar="SECONDS",
        help="keep running, re-syncing every N seconds (e.g. 600 during judging)",
    )
    return ap.parse_args()


def sync_once(args: argparse.Namespace) -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    for name in (".env", ".env.local"):
        load_dotenv(os.path.join(here, name))
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not args.dry_run and not (url and key):
        sys.exit("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — see .env.example")

    now = datetime.now(timezone.utc).isoformat()
    print(f"Fetching {args.hackathon} gallery…")
    with requests.Session() as s:
        s.headers["User-Agent"] = USER_AGENT
        projects = fetch_all(s, args.hackathon)
        rows = [to_row(p, now) for p in projects]
        # De-dupe in case a project shifts pages mid-fetch.
        rows = list({r["project_id"]: r for r in rows}.values())
        with_desc = sum(1 for r in rows if r["description"])
        print(f"Fetched {len(rows)} projects, {with_desc} with a description.")

        hackers: list[dict] = []
        if not args.skip_details:
            print("Fetching project details…")
            details = fetch_details(s, [r["project_id"] for r in rows])
            apply_judging(rows, details)
            hackers = hacker_rows(details, args.hackathon, now)
            schools = {h["organization"] for h in hackers if h["organization"]}
            ranked = sum(1 for r in rows if r.get("rank") is not None)
            print(f"Fetched {len(hackers)} hackers across {len(schools)} distinct schools; {ranked} projects ranked.")

    if args.dry_run:
        for r in rows:
            print(f"  {r['project_id']}  {r['project_name']!r}  desc={'yes' if r['description'] else 'no'}")
        if hackers:
            print("Schools:")
            for org, n in Counter(h["organization"] or "(blank)" for h in hackers).most_common():
                print(f"  {n:4d}  {org}")
        return

    sb = create_client(url, key)

    # Show renames since last run — a cheap sanity check that upserts hit the right rows.
    existing = {
        e["project_id"]: e["project_name"]
        for e in sb.table("gallery")
        .select("project_id, project_name")
        .eq("hackathon_id", args.hackathon)
        .execute()
        .data
    }
    for r in rows:
        old = existing.get(r["project_id"])
        if old is not None and old != r["project_name"]:
            print(f"  renamed: {old!r} -> {r['project_name']!r}")
    new = [r["project_name"] for r in rows if r["project_id"] not in existing]

    sb.table("gallery").upsert(rows, on_conflict="project_id").execute()
    print(f"Upserted {len(rows)} rows ({len(new)} new).")
    if new:
        print("  new:", ", ".join(new[:15]) + (" …" if len(new) > 15 else ""))

    if hackers:
        # gallery rows are written first so the project_id FK is satisfied.
        sb.table("hackers").upsert(hackers, on_conflict="hacker_id").execute()
        print(f"Upserted {len(hackers)} hacker rows.")


def main() -> None:
    args = parse_args()
    if not args.every:
        sync_once(args)
        return
    while True:
        started = time.monotonic()
        try:
            sync_once(args)
        except SystemExit as e:  # a failed page shouldn't kill the loop
            print(f"sync failed: {e}")
        wait = max(0, args.every - (time.monotonic() - started))
        print(f"--- next sync in {wait:.0f}s ({datetime.now().strftime('%H:%M:%S')}) ---", flush=True)
        time.sleep(wait)


if __name__ == "__main__":
    main()
