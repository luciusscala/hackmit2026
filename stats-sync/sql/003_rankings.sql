-- Judging results from GET /api/v3/projects/{id}: rank + score are null until
-- judging starts, then fill in live. Run once in the Supabase SQL Editor.

alter table public.gallery
  add column if not exists rank  integer,
  add column if not exists score double precision;

create index if not exists gallery_rank_idx on public.gallery (hackathon_id, rank);
