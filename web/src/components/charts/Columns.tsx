import Legend from "./Legend";
import { fmtPct, pct, type Series } from "./series";

export type ColumnGroup = { label: string; values: number[] };

/**
 * Small ordinal distribution (team size, challenges per project) as columns.
 * Values are shown as % of each series' total so years compare fairly; counts
 * live in the tooltip. Every column is labeled — there are at most ~6.
 */
export default function Columns({
  series,
  groups,
  totals,
  height = 160,
}: {
  series: Series[];
  groups: ColumnGroup[];
  totals: number[];
  height?: number;
}) {
  if (totals.every((t) => t === 0)) return <p className="text-sm text-neutral-500">No data yet.</p>;

  const maxPct = Math.max(...groups.flatMap((g) => g.values.map((v, i) => pct(v, totals[i]))), 1e-9);

  return (
    <div>
      <Legend series={series} />
      <div className="flex items-end gap-2 border-b border-neutral-200 dark:border-neutral-800" style={{ height }}>
        {groups.map((g) => (
          <div
            key={g.label}
            className="group flex h-full flex-1 items-end justify-center gap-1"
            title={`${g.label}: ${g.values
              .map((v, i) => `${series[i].name} ${v} (${fmtPct(v, totals[i])})`)
              .join(" · ")}`}
          >
            {g.values.map((v, i) => {
              const h = (pct(v, totals[i]) / maxPct) * 100;
              return (
                <div key={i} className="flex h-full w-full max-w-6 flex-col items-center justify-end">
                  <span className="mb-1 text-[11px] leading-none tabular-nums text-neutral-500">
                    {v > 0 ? fmtPct(v, totals[i]) : ""}
                  </span>
                  <span
                    className="block w-full rounded-t transition group-hover:brightness-110"
                    style={{ height: `${h}%`, background: series[i].color, minHeight: v > 0 ? 2 : 0 }}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {groups.map((g) => (
          <div key={g.label} className="flex-1 text-center text-xs text-neutral-500">
            {g.label}
          </div>
        ))}
      </div>
    </div>
  );
}
