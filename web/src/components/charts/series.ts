import type { Year } from "@/lib/types";

// Fixed slot per year — color follows the entity, never its position.
export const YEAR_COLOR: Record<Year, string> = {
  "2026": "var(--series-1)",
  "2025": "var(--series-2)",
};
// De-emphasis gray for a context series ("all projects" behind the podium).
export const CONTEXT_COLOR = "var(--series-muted)";

export type Series = { name: string; color: string };

export const pct = (n: number, d: number) => (d ? (n / d) * 100 : 0);
export const fmtPct = (n: number, d: number) => `${pct(n, d).toFixed(pct(n, d) < 10 && pct(n, d) > 0 ? 1 : 0)}%`;
