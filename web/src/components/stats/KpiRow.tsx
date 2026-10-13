import type { Scoped, YearStats } from "@/lib/stats/compute";
import ScopedCard from "../charts/ScopedCard";
import { scopeViews } from "../charts/scoped";
import { fmtPct } from "../charts/series";

type Kpi = { label: string; value: (s: YearStats) => string };

const KPIS: Kpi[] = [
  { label: "Projects", value: (s) => String(s.projects) },
  { label: "Hackers", value: (s) => String(s.hackers) },
  { label: "Schools", value: (s) => String(s.schools) },
  { label: "Avg team size", value: (s) => s.avgTeamSize.toFixed(1) },
  { label: "With code link", value: (s) => fmtPct(s.withCodeLink, s.projects) },
  { label: "With demo video", value: (s) => fmtPct(s.withVideo, s.projects) },
];

// Headline numbers. With several series each tile lists them, first on top.
function Tiles({ stats }: { stats: YearStats[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-4">
      {KPIS.map((k) => (
        <div key={k.label} className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-900">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{k.label}</p>
          {stats.map((s) => (
            <p key={s.label} className="mt-1 flex items-baseline gap-1.5">
              <span className={stats.length > 1 ? "text-xl font-semibold" : "text-2xl font-semibold"}>
                {k.value(s)}
              </span>
              {stats.length > 1 && <span className="text-xs text-neutral-500">{s.label}</span>}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function KpiRow({ scoped }: { scoped: Scoped }) {
  return <ScopedCard title="At a glance" views={scopeViews(scoped, (stats) => <Tiles stats={stats} />)} />;
}
