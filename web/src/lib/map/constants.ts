import type { ColorMode, Point } from "./types";

export const TRACK_COLOR: Record<string, string> = {
  Beginner: "#7aa2ff",
  General: "#c4b5fd",
  Education: "#86efac",
  Entertainment: "#f9a8d4",
  Healthcare: "#fb7185",
  Sustainability: "#5eead4",
  "NO TRACK": "#737373",
};

export const CLUSTER_COLOR = [
  "#7aa2ff",
  "#f9a8d4",
  "#86efac",
  "#fbbf24",
  "#67e8f9",
  "#c4b5fd",
  "#fb7185",
  "#a3e635",
  "#fda4af",
  "#5eead4",
  "#fcd34d",
  "#93c5fd",
  "#f0abfc",
  "#6ee7b7",
  "#fdba74",
  "#a5b4fc",
  "#fca5a5",
  "#7dd3fc",
];

export const MIXED_COLOR = "#64748b";

export const HACKATHONS: { id: string; label: string; short: string }[] = [
  { id: "hack-2025", label: "HackMIT 2025", short: "H '25" },
  { id: "hack-2026", label: "HackMIT 2026", short: "H '26" },
  { id: "bp-2025", label: "Blueprint 2025", short: "BP '25" },
  { id: "bp-2026", label: "Blueprint 2026", short: "BP '26" },
];

// UMAP coords are roughly unit-scale; SCALE spreads them for the camera.
export const SCALE = 5.6;
export const DEFAULT_CAM: [number, number, number] = [0, 1.35, 8.4];
export const MAP_BG = "#07080c";

export function clusterColor(id: number) {
  return CLUSTER_COLOR[id % CLUSTER_COLOR.length];
}

export function colorFor(p: Point, mode: ColorMode) {
  if (mode === "track") return TRACK_COLOR[p.track || "NO TRACK"] || MIXED_COLOR;
  if (p.cluster_id == null) return MIXED_COLOR;
  return clusterColor(p.cluster_id);
}

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

export function rankLine(p: Point) {
  if (p.rank == null || !p.track || p.track === "NO TRACK") return null;
  return `${ordinal(p.rank + 1)} in ${p.track}`;
}
