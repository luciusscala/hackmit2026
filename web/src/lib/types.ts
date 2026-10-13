// Mirrors the columns we read from public.gallery (populated by stats-sync/sync.py).
export type GalleryRow = {
  project_id: string;
  hackathon_id: string;
  project_name: string;
  magic_link: string;
  track: string | null;
  rank: number | null; // 0-based, within track; null until judged
  score: number | null;
  last_updated: string;
  preferences: string[];
  prize_winners: string[];
  needs_power: boolean;
  code_link: string | null;
  video_demo: string | null;
  description: string | null;
  what_it_does: string | null;
  how_we_built_it: string | null;
};

// Mirrors public.hackers (see stats-sync/sql/001_hackers.sql). One row per hacker-project
// membership; Plume blanks names/emails, so no PII.
export type HackerRow = {
  hacker_id: string;
  project_id: string;
  hackathon_id: string;
  organization: string | null;
};

export type Year = "2026" | "2025";
export const YEARS: Record<Year, string> = { "2026": "hack-2026", "2025": "hack-2025" };
