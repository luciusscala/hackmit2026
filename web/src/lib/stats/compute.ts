import type { GalleryRow, HackerRow, Year } from "@/lib/types";
import { normalizeSchool } from "./schools";
import { TECH_PATTERNS } from "./tech";

export type Count = { label: string; count: number };

export type RankedProject = {
  name: string;
  url: string;
  rank: number; // 1-based for display
};
export type TrackRanking = {
  track: string; // "Overall" when ranks aren't per track
  total: number; // projects ranked in this track
  top: RankedProject[]; // best TOP_N, ascending rank
};
export type PrizeWinner = { name: string; url: string; prizes: string[] };

export const TOP_N = 10; // out of respect for the teams, never list beyond this
export const PODIUM_N = 3; // "winners" = top 3 in each track

export type Series = { label: string; color: string };

export type YearStats = Series & {
  year: Year;
  projects: number;
  hackers: number;
  schools: number; // distinct, excluding "Other"
  avgTeamSize: number;
  withWriteup: number; // projects with any build/description text
  withCodeLink: number;
  withVideo: number;
  schoolCounts: Count[]; // desc, "Other" included
  teamSizes: Count[]; // "1".."5", "6+"
  challenges: Count[]; // sponsor challenge → projects entered, desc
  challengesPerProject: Count[]; // "0".."3", "4+"
  tech: Count[]; // tech → projects mentioning it, desc
  tracks: Count[]; // excluding NO TRACK, desc
  rankedCount: number; // projects with a rank so far
  rankings: TrackRanking[]; // one entry per track, largest first
  prizeWinners: PrizeWinner[];
  lastUpdated: string | null; // most recent sync timestamp
};

export const TEAM_SIZE_BUCKETS = ["1", "2", "3", "4", "5", "6+"];
export const CHALLENGE_BUCKETS = ["0", "1", "2", "3", "4+"];

function tally(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function sorted(map: Map<string, number>): Count[] {
  return [...map]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function bucketed(map: Map<string, number>, buckets: string[]): Count[] {
  return buckets.map((label) => ({ label, count: map.get(label) ?? 0 }));
}

// Projects on the podium (rank is 0-based within a track) and their hackers.
export function podiumSubset(gallery: GalleryRow[], hackers: HackerRow[]) {
  const g = gallery.filter((p) => p.rank !== null && p.rank < PODIUM_N);
  const ids = new Set(g.map((p) => p.project_id));
  return { gallery: g, hackers: hackers.filter((h) => ids.has(h.project_id)) };
}

export function computeYearStats(
  year: Year,
  series: Series,
  gallery: GalleryRow[],
  hackers: HackerRow[]
): YearStats {
  const schools = new Map<string, number>();
  const perProject = new Map<string, number>();
  for (const h of hackers) {
    tally(schools, normalizeSchool(h.organization));
    tally(perProject, h.project_id);
  }

  const teamSizes = new Map<string, number>();
  for (const n of perProject.values()) tally(teamSizes, n >= 6 ? "6+" : String(n));

  const challenges = new Map<string, number>();
  const challengesPerProject = new Map<string, number>();
  const tech = new Map<string, number>();
  const tracks = new Map<string, number>();
  let withWriteup = 0;
  let withCodeLink = 0;
  let withVideo = 0;

  // In 2025, preferences[] also carried the project's track ("Education",
  // "Beginner"…); those aren't sponsor challenges, so drop any track name.
  const trackNames = new Set(gallery.map((p) => p.track).filter((t) => t && t !== "NO TRACK"));

  for (const p of gallery) {
    const prefs = (p.preferences ?? []).filter((c) => !trackNames.has(c));
    for (const c of prefs) tally(challenges, c);
    tally(challengesPerProject, prefs.length >= 4 ? "4+" : String(prefs.length));

    if (p.track && p.track !== "NO TRACK") tally(tracks, p.track);
    if (p.code_link) withCodeLink++;
    if (p.video_demo) withVideo++;

    const text = [p.how_we_built_it, p.description, p.what_it_does].filter(Boolean).join("\n");
    if (text.trim()) {
      withWriteup++;
      for (const { name, re } of TECH_PATTERNS) if (re.test(text)) tally(tech, name);
    }
  }

  const projectUrl = (p: GalleryRow) => `https://plume.hackmit.org/project/${p.magic_link}`;
  const ranked = gallery.filter((p) => p.rank !== null);
  // Ranks are 0-based within a track, so rankings are grouped per track.
  const byTrack = new Map<string, GalleryRow[]>();
  for (const p of ranked) {
    const t = p.track && p.track !== "NO TRACK" ? p.track : "Overall";
    byTrack.set(t, [...(byTrack.get(t) ?? []), p]);
  }
  const rankings: TrackRanking[] = [...byTrack]
    .map(([track, ps]) => ({
      track,
      total: ps.length,
      top: ps
        .sort((a, b) => a.rank! - b.rank! || (b.score ?? 0) - (a.score ?? 0) || a.project_name.localeCompare(b.project_name))
        .slice(0, TOP_N)
        .map((p) => ({ name: p.project_name, url: projectUrl(p), rank: p.rank! + 1 })),
    }))
    .sort((a, b) => b.total - a.total || a.track.localeCompare(b.track));
  const prizeWinners = gallery
    .filter((p) => p.prize_winners?.length)
    .map((p) => ({ name: p.project_name, url: projectUrl(p), prizes: p.prize_winners }));
  const lastUpdated = gallery.reduce<string | null>(
    (m, p) => (p.last_updated && (!m || p.last_updated > m) ? p.last_updated : m),
    null
  );

  const schoolCounts = sorted(schools);
  return {
    ...series,
    year,
    projects: gallery.length,
    hackers: hackers.length,
    schools: schoolCounts.filter((s) => s.label !== normalizeSchool(null)).length,
    avgTeamSize: perProject.size ? hackers.length / perProject.size : 0,
    withWriteup,
    withCodeLink,
    withVideo,
    schoolCounts,
    teamSizes: bucketed(teamSizes, TEAM_SIZE_BUCKETS),
    challenges: sorted(challenges),
    challengesPerProject: bucketed(challengesPerProject, CHALLENGE_BUCKETS),
    tech: sorted(tech),
    tracks: sorted(tracks),
    rankedCount: ranked.length,
    rankings,
    prizeWinners,
    lastUpdated,
  };
}

// Every chart gets both lenses and shows a tab to switch between them.
export type Scoped = {
  all: YearStats[];
  podium: YearStats[]; // empty when no year has ranks yet
  noPodium: Year[]; // years whose ranks haven't come in
};
