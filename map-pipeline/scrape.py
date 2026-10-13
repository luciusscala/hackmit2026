"""Scrape Plume public project data for a viz + winner-prediction pipeline.

Two public endpoints, no auth:
  GET /api/v3/projects/gallery          — discovery list (paginated)
  GET /api/v3/projects/{project_id}     — full record: rank, score, team, schools,
                                          categories, writeup

Registration-only fields that happen to ride along on the detail payload
(finaid, travel, DocuSign, t-shirt, email) are dropped and never stored.

Examples:
  python scrape.py --dry-run
  python scrape.py --out data/projects.json
  python scrape.py --live
  python scrape.py --hackathons hack-2025 --out data/hack2025.json

`--live` re-fetches HackMIT 2026 gallery + details (cache busted) and merges
into the existing lake so 2025 ranks are not wiped. Prefer `refresh.py`,
which also rebuilds the map and forecast.
"""

from __future__ import annotations

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

BASE_URL = "https://plume.hackmit.org"
ITEMS_PER_PAGE = 24
USER_AGENT = "hackmit-gallery-map/1.0 (research; lscala@ucsd.edu)"
DELAY_BETWEEN_PAGES = 0.6
DELAY_BETWEEN_DETAILS = 0.25
DELAY_BETWEEN_HACKATHONS = 1.0
TIMEOUT = 20

DEFAULT_HACKATHONS = ("bp-2025", "hack-2025", "bp-2026", "hack-2026")

HACKATHON_META = {
    "bp-2025": {"name": "Blueprint", "year": 2025},
    "hack-2025": {"name": "HackMIT", "year": 2025},
    "bp-2026": {"name": "Blueprint", "year": 2026},
    "hack-2026": {"name": "HackMIT", "year": 2026},
}

# Ops/registration fields — not project-viz features. Do not persist.
HACKER_DROP = {
    "finaid",
    "liabilityDocusignCompleted",
    "mediaDocusignCompleted",
    "travelDenialReasons",
    "travelStatus",
    "travelSubmitted",
    "tshirtSize",
}


def _get(session: requests.Session, url: str, **kwargs) -> dict:
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            r = session.get(url, timeout=TIMEOUT, **kwargs)
            if r.status_code >= 500:
                raise requests.HTTPError(f"{r.status_code} from Plume")
            r.raise_for_status()
            return r.json()
        except (requests.RequestException, ValueError, json.JSONDecodeError) as e:
            last_err = e
            time.sleep(2 * (attempt + 1))
    raise SystemExit(f"giving up on {url}: {last_err}")


def fetch_page(session: requests.Session, hackathon_id: str, page: int) -> dict:
    data = _get(
        session,
        f"{BASE_URL}/api/v3/projects/gallery",
        params={
            "hackathon_id": hackathon_id,
            "page": page,
            "items_per_page": ITEMS_PER_PAGE,
        },
    )
    if "projects" not in data:
        raise SystemExit(f"unexpected gallery shape: {list(data)}")
    return data


def fetch_hackathon(session: requests.Session, hackathon_id: str) -> tuple[list[dict], list[str]]:
    projects: list[dict] = []
    challenge_names: list[str] = []
    page = 1
    while True:
        data = fetch_page(session, hackathon_id, page)
        batch = data["projects"]
        total = data.get("total_projects")
        if page == 1:
            challenge_names = list(data.get("preferences") or [])
        print(f"  gallery page {page}: {len(batch)} (total reported: {total})")
        if not batch:
            break
        projects.extend(batch)
        if total is not None and len(projects) >= total:
            break
        page += 1
        time.sleep(DELAY_BETWEEN_PAGES)
    return projects, challenge_names


def fetch_detail(session: requests.Session, project_id: str) -> dict:
    return _get(session, f"{BASE_URL}/api/v3/projects/{project_id}")


def _parse_meta(raw) -> dict:
    if not raw:
        return {}
    if isinstance(raw, dict):
        return raw
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {}


def _text(meta: dict, key: str) -> str | None:
    v = meta.get(key)
    if v is None:
        return None
    s = str(v).strip()
    return s or None


def _names(items) -> list[str]:
    out: list[str] = []
    for item in items or []:
        if isinstance(item, str):
            s = item.strip()
        elif isinstance(item, dict):
            s = str(item.get("name") or "").strip()
        else:
            s = ""
        if s:
            out.append(s)
    return out


def _named_ids(items) -> list[dict]:
    out: list[dict] = []
    for item in items or []:
        if isinstance(item, dict) and item.get("id"):
            out.append({"id": item["id"], "name": (item.get("name") or "").strip() or None})
        elif isinstance(item, str) and item.strip():
            out.append({"id": None, "name": item.strip()})
    return out


def _members(hackers: list) -> list[dict]:
    members: list[dict] = []
    for h in hackers or []:
        user = h.get("user") or {}
        email = (user.get("email") or "").strip()
        members.append(
            {
                "hacker_id": h.get("id"),
                "user_id": h.get("userId") or user.get("id"),
                "first_name": (user.get("firstName") or "").strip() or None,
                "last_name": (user.get("lastName") or "").strip() or None,
                "organization": (h.get("organization") or "").strip() or None,
                "role": h.get("role"),
                "status": h.get("status"),
                # email is almost always blanked; only keep if the API sent one
                **({"email": email} if email else {}),
            }
        )
    return members


def to_row(gallery: dict, detail: dict | None, now: str) -> dict:
    d = detail or {}
    meta = _parse_meta(d.get("projectMetadata") or gallery.get("project_metadata"))

    hackathon_id = (
        d.get("hackathonId")
        or gallery.get("hackathon_id")
        or ""
    )
    info = HACKATHON_META.get(hackathon_id, {})

    categories = _named_ids(d.get("categories"))
    sponsor_objs = _named_ids(d.get("sponsorChallenges"))
    if not sponsor_objs:
        sponsor_objs = _named_ids(meta.get("sponsorChallenges"))

    category_names = [c["name"] for c in categories if c.get("name")]
    sponsor_names = [c["name"] for c in sponsor_objs if c.get("name")]
    track = (gallery.get("track") or "").strip() or None
    # Prefer a category that matches the gallery track; else first non-sponsor category.
    if (not track or track == "NO TRACK") and categories:
        sponsor_set = set(sponsor_names)
        for c in categories:
            if c.get("name") and c["name"] not in sponsor_set:
                track = c["name"]
                break

    gallery_prefs = _names(gallery.get("preferences"))
    prize_winners = d.get("prizeWinners") or gallery.get("prize_winners") or []

    members = _members(d.get("hackers") or [])
    schools = []
    seen = set()
    for m in members:
        org = m.get("organization")
        if org and org not in seen:
            seen.add(org)
            schools.append(org)

    description = _text(meta, "description") or _text(meta, "what_it_does")

    rank = d.get("rank")
    score = d.get("score")
    links = meta.get("links") or []
    if isinstance(links, str):
        links = [s.strip() for s in links.split(",") if s.strip()]

    return {
        "project_id": gallery["id"],
        "magic_link": d.get("magicLink") or gallery.get("magic_link"),
        "project_name": (d.get("name") or gallery.get("name") or "").strip() or "(untitled)",
        "hackathon_id": hackathon_id,
        "hackathon_name": info.get("name"),
        "year": info.get("year"),
        "track": track,
        "categories": categories,
        "category_names": category_names,
        "preferences": gallery_prefs,
        "sponsor_challenges": sponsor_objs,
        "sponsor_challenge_names": sponsor_names,
        "prize_winners": prize_winners,
        "is_winner": bool(prize_winners),
        "rank": rank,
        "score": score,
        "team_size": len(members),
        "schools": schools,
        "n_schools": len(schools),
        "members": members,
        "description": description,
        "what_it_does": _text(meta, "what_it_does"),
        "inspiration": _text(meta, "inspiration"),
        "how_we_built_it": _text(meta, "how_we_built_it"),
        "challenges_we_ran_into": _text(meta, "challenges_we_ran_into"),
        "accomplishments": _text(meta, "accomplishments"),
        "what_we_learned": _text(meta, "what_we_learned"),
        "whats_next": _text(meta, "whats_next"),
        "individual_contributions": _text(meta, "individual_contributions"),
        "code_link": _text(meta, "code_link"),
        "video_demo": _text(meta, "video_demo"),
        "links": links,
        "table_location": d.get("tableLocation") or gallery.get("table_location"),
        "needs_power": bool(d.get("needsPower") if "needsPower" in d else gallery.get("needs_power")),
        "metadata": meta,
        "last_updated": now,
    }


def summary(rows: list[dict]) -> str:
    def n(pred) -> int:
        return sum(1 for r in rows if pred(r))
    return (
        f"{len(rows)} rows | desc={n(lambda r: r['description'])} "
        f"rank={n(lambda r: r['rank'] is not None)} score={n(lambda r: r['score'] is not None)} "
        f"team={n(lambda r: r['team_size'])} winners={n(lambda r: r['is_winner'])}"
    )


def load_cache(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return {}


def save_cache(path: Path, cache: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cache))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {payload.get('count', len(payload.get('projects', [])))} → {path}")


def merge_rows(
    existing_path: Path,
    rows: list[dict],
    challenge_index: dict[str, list[str]],
    scraped_ids: set[str],
) -> tuple[list[dict], dict[str, list[str]]]:
    """Keep projects from hackathons we did not just scrape."""
    if not existing_path.exists():
        return rows, challenge_index
    try:
        prev = json.loads(existing_path.read_text())
    except json.JSONDecodeError:
        return rows, challenge_index
    prev_projects = prev.get("projects") or []
    keep = [p for p in prev_projects if p.get("hackathon_id") not in scraped_ids]
    if not keep:
        return rows, challenge_index
    print(f"Merging {len(keep)} projects from {existing_path.name} (other hackathons).")
    prev_challenges = prev.get("challenge_names_by_hackathon") or {}
    merged_challenges = dict(prev_challenges)
    merged_challenges.update(challenge_index)
    return keep + rows, merged_challenges


def main() -> None:
    ap = argparse.ArgumentParser(description="Scrape Plume gallery + project details")
    ap.add_argument(
        "--hackathons",
        default=None,
        help="Comma-separated ids. Default: all four events, or hack-2026 with --live",
    )
    ap.add_argument("--out", type=Path, default=Path("data/projects.json"))
    ap.add_argument("--cache", type=Path, default=Path("data/.details_cache.json"))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-details", action="store_true", help="Gallery list only (no rank/score/team)")
    ap.add_argument(
        "--refresh-details",
        action="store_true",
        help="Re-download project details even if they are in the cache (needed for live 2026 writeups)",
    )
    ap.add_argument(
        "--no-merge",
        action="store_true",
        help="Replace the whole lake with this scrape (default is to keep other hackathons)",
    )
    ap.add_argument(
        "--live",
        action="store_true",
        help="Re-fetch HackMIT 2026 details and merge into the existing lake",
    )
    args = ap.parse_args()

    here = Path(__file__).resolve().parent
    for name in (".env", ".env.local"):
        load_dotenv(here / name)

    def resolve(p: Path) -> Path:
        return p if p.is_absolute() else here / p

    if args.live:
        args.refresh_details = True

    if args.hackathons:
        hackathons = [h.strip() for h in args.hackathons.split(",") if h.strip()]
    elif args.live:
        hackathons = ["hack-2026"]
    else:
        hackathons = list(DEFAULT_HACKATHONS)
    unknown = [h for h in hackathons if h not in HACKATHON_META]
    if unknown:
        print(f"Warning: unknown hackathon ids: {unknown}")

    now = datetime.now(timezone.utc).isoformat()
    gallery_by_id: dict[str, dict] = {}
    challenge_index: dict[str, list[str]] = {}

    with requests.Session() as s:
        s.headers["User-Agent"] = USER_AGENT
        for i, hid in enumerate(hackathons):
            print(f"Listing {hid}…")
            projects, challenge_names = fetch_hackathon(s, hid)
            challenge_index[hid] = challenge_names
            for p in projects:
                gallery_by_id[p["id"]] = p
            print(f"  → {len(projects)} projects, {len(challenge_names)} gallery challenge filters")
            if i < len(hackathons) - 1:
                time.sleep(DELAY_BETWEEN_HACKATHONS)

        ids = list(gallery_by_id)
        print(f"\nListed {len(ids)} unique projects.")

        details: dict[str, dict] = {}
        if not args.no_details:
            cache_path = resolve(args.cache)
            cache = load_cache(cache_path)
            if args.refresh_details:
                dropped = sum(1 for pid in ids if pid in cache)
                for pid in ids:
                    cache.pop(pid, None)
                print(f"Refresh: dropped {dropped} cached details for this scrape.")
            missing = [pid for pid in ids if pid not in cache]
            print(f"Detail fetch: {len(ids) - len(missing)} cached, {len(missing)} to download.")
            for n, pid in enumerate(missing, 1):
                details_one = fetch_detail(s, pid)
                cache[pid] = details_one
                if n % 25 == 0 or n == len(missing):
                    save_cache(cache_path, cache)
                    print(f"  details {n}/{len(missing)}")
                time.sleep(DELAY_BETWEEN_DETAILS)
            details = {pid: cache[pid] for pid in ids if pid in cache}

    rows = [to_row(gallery_by_id[pid], details.get(pid), now) for pid in ids]
    print(f"\nBuilt {summary(rows)}")

    out_path = resolve(args.out)
    if not args.no_merge:
        rows, challenge_index = merge_rows(out_path, rows, challenge_index, set(hackathons))
        print(f"Lake after merge: {summary(rows)}")

    if args.dry_run:
        by: dict[str, list] = {}
        for r in rows:
            by.setdefault(r["hackathon_id"], []).append(r)
        for hid, rs in sorted(by.items()):
            ranked = sum(1 for x in rs if x["rank"] is not None)
            print(
                f"  {hid}: {len(rs)}  ranked={ranked}  "
                f"e.g. {rs[0]['project_name']!r} rank={rs[0]['rank']} team={rs[0]['team_size']}"
            )
        return

    write_json(
        out_path,
        {
            "scraped_at": now,
            "sources": [
                f"{BASE_URL}/api/v3/projects/gallery",
                f"{BASE_URL}/api/v3/projects/{{id}}",
            ],
            "hackathons": sorted({r["hackathon_id"] for r in rows}),
            "challenge_names_by_hackathon": challenge_index,
            "dropped_hacker_fields": sorted(HACKER_DROP),
            "count": len(rows),
            "projects": rows,
        },
    )


if __name__ == "__main__":
    main()
