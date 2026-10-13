import type { Scoped, YearStats } from "@/lib/stats/compute";
import BarList from "../charts/BarList";
import ScopedCard from "../charts/ScopedCard";
import { scopeViews } from "../charts/scoped";

// Keyword mentions in project write-ups. The tech list is shared across
// series, so they merge into one list (ordered by the first series) with a bar
// each. Denominator is projects that have written anything yet.
function Body({ stats }: { stats: YearStats[] }) {
  const labels = [...new Set(stats.flatMap((s) => s.tech.map((t) => t.label)))];
  const lookup = stats.map((s) => new Map(s.tech.map((t) => [t.label, t.count])));
  const rows = labels
    .map((label) => ({ label, values: lookup.map((m) => m.get(label) ?? 0) }))
    .sort((a, b) => b.values[0] - a.values[0] || (b.values[1] ?? 0) - (a.values[1] ?? 0) || a.label.localeCompare(b.label));

  return (
    <BarList
      series={stats.map((s) => ({ name: s.label, color: s.color }))}
      totals={stats.map((s) => s.withWriteup)}
      rows={rows}
      topN={15}
      moreLabel="more technologies"
    />
  );
}

export default function TechStackChart({ scoped }: { scoped: Scoped }) {
  return (
    <ScopedCard
      title="Tech stack mentions"
      views={scopeViews(
        scoped,
        (stats) => <Body stats={stats} />,
        (stats) => (
          <>
            Share of projects whose write-up mentions each technology
            {" — "}
            {stats.map((s) => `${s.withWriteup} of ${s.projects} ${s.label} projects have one`).join("; ")}.
          </>
        )
      )}
    />
  );
}
