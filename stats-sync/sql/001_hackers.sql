-- One row per hacker-project membership, from GET /api/v3/projects/{id} → hackers[].
-- Plume blanks names/emails on this endpoint, so nothing here is PII.
-- Run in the Supabase SQL Editor once; sync.py upserts into it.

create table if not exists public.hackers (
  hacker_id     text primary key,               -- "ha-…"
  project_id    text not null references public.gallery (project_id),
  user_id       text,                           -- "us-…"
  organization  text,                           -- school as entered ("MIT", "Other", …)
  role          text,                           -- Hacker / Mentor / …
  status        text,                           -- CHECKED_IN / …
  last_updated  timestamptz not null default now()
);

create index if not exists hackers_project_id_idx on public.hackers (project_id);
create index if not exists hackers_organization_idx on public.hackers (organization);

alter table public.hackers enable row level security;

drop policy if exists "anon read hackers" on public.hackers;
create policy "anon read hackers" on public.hackers
  for select to anon using (true);
