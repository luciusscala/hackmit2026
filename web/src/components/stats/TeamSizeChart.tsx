import type { Scoped, YearStats } from "@/lib/stats/compute";
import Columns from "../charts/Columns";
import ScopedCard from "../charts/ScopedCard";
import { scopeViews } from "../charts/scoped";

// Team size = hackers listed on each project. Denominator is projects with at
// least one listed hacker (some projects list none).
function Body({ stats }: { stats: YearStats[] }) {
  return (
    <Columns
      series={stats.map((s) => ({ name: s.label, color: s.color }))}
      totals={stats.map((s) => s.teamSizes.reduce((n, b) => n + b.count, 0))}
      groups={stats[0].teamSizes.map((b, i) => ({
        label: b.label,
        values: stats.map((s) => s.teamSizes[i].count),
      }))}
    />
  );
}

export default function TeamSizeChart({ scoped }: { scoped: Scoped }) {
  return (
    <ScopedCard
      title="Team size"
      views={scopeViews(
        scoped,
        (stats) => <Body stats={stats} />,
        (stats) =>
          stats.length === 1
            ? `Average ${stats[0].avgTeamSize.toFixed(1)} hackers per project.`
            : stats.map((s) => `${s.label}: avg ${s.avgTeamSize.toFixed(1)}`).join(" · ")
      )}
    />
  );
}
