-- Adds a hackathon_id column so several years can live in the same tables.
-- Plume project/hacker ids are globally unique, so no PK change is needed.
-- Existing rows are all hack-2026. Run once in the Supabase SQL Editor, then:
--   python sync.py --hackathon hack-2025

alter table public.gallery
  add column if not exists hackathon_id text not null default 'hack-2026';
alter table public.hackers
  add column if not exists hackathon_id text not null default 'hack-2026';

create index if not exists gallery_hackathon_id_idx on public.gallery (hackathon_id);
create index if not exists hackers_hackathon_id_idx on public.hackers (hackathon_id);
