import type { Scoped, YearStats } from "@/lib/stats/compute";
import { OTHER } from "@/lib/stats/schools";
import BarList from "../charts/BarList";
import ScopedCard from "../charts/ScopedCard";
import { scopeViews } from "../charts/scoped";

// School names differ between years (2025 was free text), so multiple series
// show one ranked list each, side by side, rather than merged rows.
function Body({ stats }: { stats: YearStats[] }) {
  const one = stats.length === 1;
  return (
    <div className={one ? "" : "grid gap-6 md:grid-cols-2"}>
      {stats.map((s) => (
        <div key={s.label}>
          {!one && (
            <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label} · {s.hackers} hackers, {s.schools} schools
            </h3>
          )}
          <BarList
            series={[{ name: s.label, color: s.color }]}
            totals={[s.hackers]}
            topN={one ? 15 : 10}
            moreLabel="more schools"
            rows={s.schoolCounts.map((c) => ({ label: c.label, values: [c.count], muted: c.label === OTHER }))}
          />
        </div>
      ))}
    </div>
  );
}

export default function SchoolBreakdown({ scoped }: { scoped: Scoped }) {
  return (
    <ScopedCard
      title="Hackers by school"
      views={scopeViews(
        scoped,
        (stats) => <Body stats={stats} />,
        (stats) =>
          stats.length === 1
            ? `${stats[0].hackers} hackers from ${stats[0].schools} schools, as listed on their project pages.`
            : "Share of each group's hackers, as listed on their project pages."
      )}
    />
  );
}
