import type { Scoped, YearStats } from "@/lib/stats/compute";
import BarList from "../charts/BarList";
import Columns from "../charts/Columns";
import ScopedCard from "../charts/ScopedCard";
import { scopeViews } from "../charts/scoped";

// Sponsor challenges are different each year, so their popularity lists sit
// side by side; "challenges entered per project" shares an axis and is grouped.
function Body({ stats }: { stats: YearStats[] }) {
  const one = stats.length === 1;
  return (
    <>
      <div className={one ? "" : "grid gap-6 md:grid-cols-2"}>
        {stats.map((s) => (
          <div key={s.label}>
            {!one && (
              <h3 className="mb-2 flex items-center gap-2 text-sm font-medium">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                {s.label} · {s.challenges.length} challenges
              </h3>
            )}
            <BarList
              series={[{ name: s.label, color: s.color }]}
              totals={[s.projects]}
              topN={one ? 12 : 8}
              moreLabel="more challenges"
              rows={s.challenges.map((c) => ({ label: c.label, values: [c.count] }))}
            />
          </div>
        ))}
      </div>

      <h3 className="mt-6 mb-2 text-sm font-medium">Challenges entered per project</h3>
      <Columns
        series={stats.map((s) => ({ name: s.label, color: s.color }))}
        totals={stats.map((s) => s.projects)}
        height={120}
        groups={stats[0].challengesPerProject.map((b, i) => ({
          label: b.label,
          values: stats.map((s) => s.challengesPerProject[i].count),
        }))}
      />
    </>
  );
}

export default function ChallengeChart({ scoped }: { scoped: Scoped }) {
  return (
    <ScopedCard
      title="Sponsor challenges"
      views={scopeViews(
        scoped,
        (stats) => <Body stats={stats} />,
        () => "Which sponsor challenges projects entered, as a share of projects."
      )}
    />
  );
}
