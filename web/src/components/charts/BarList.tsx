import Legend from "./Legend";
import { fmtPct, type Series } from "./series";

export type BarRow = {
  label: string;
  values: number[]; // one per series
  muted?: boolean; // "Other"-style bucket: gray, excluded from ranking
};

/**
 * Horizontal bar list. One series → count + % at the tip. Two series → a thin
 * bar per series under a shared label, values as % so different-sized years
 * compare fairly (counts in the tooltip).
 */
export default function BarList({
  series,
  rows,
  totals, // denominator per series (for %)
  topN = 12,
  moreLabel = "more",
}: {
  series: Series[];
  rows: BarRow[];
  totals: number[];
  topN?: number;
  moreLabel?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-neutral-500">No data yet.</p>;

  const dual = series.length > 1;
  // Bars scale to % when comparing (different denominators) and to count otherwise.
  const scale = (v: number, i: number) => (dual ? (v / totals[i]) * 100 : v);
  const max = Math.max(...rows.flatMap((r) => r.values.map(scale)), 1e-9);

  const ranked = rows.filter((r) => !r.muted);
  const muted = rows.filter((r) => r.muted);
  const top = ranked.slice(0, topN);
  const rest = ranked.slice(topN);

  const Row = ({ row }: { row: BarRow }) => (
    <li
      title={`${row.label}: ${row.values
        .map((v, i) => `${series[i].name} ${v} (${fmtPct(v, totals[i])})`)
        .join(" · ")}`}
      className="group grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-3 py-1 sm:grid-cols-[minmax(0,15rem)_1fr]"
    >
      <span className={`truncate text-sm ${row.muted ? "text-neutral-500" : ""}`}>{row.label}</span>
      <span className="flex flex-col gap-0.5">
        {row.values.map((v, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="min-w-0 flex-1">
              <span
                className={`block rounded-r transition group-hover:brightness-110 ${dual ? "h-2.5" : "h-4"}`}
                style={{
                  width: `${(scale(v, i) / max) * 100}%`,
                  background: row.muted ? "var(--series-muted)" : series[i].color,
                }}
              />
            </span>
            <span className="w-[4.5rem] shrink-0 text-right text-sm tabular-nums">
              {dual ? (
                <span className="text-xs">{fmtPct(v, totals[i])}</span>
              ) : (
                <>
                  {v}
                  <span className="ml-1 text-xs text-neutral-500">{fmtPct(v, totals[i])}</span>
                </>
              )}
            </span>
          </span>
        ))}
      </span>
    </li>
  );

  return (
    <div>
      <Legend series={series} />
      <ol>
        {top.map((r) => (
          <Row key={r.label} row={r} />
        ))}
      </ol>
      {rest.length > 0 && (
        <details className="mt-1">
          <summary className="cursor-pointer py-1 text-sm text-neutral-500 underline-offset-4 hover:underline">
            {rest.length} {moreLabel}
          </summary>
          <ol className="mt-1">
            {rest.map((r) => (
              <Row key={r.label} row={r} />
            ))}
          </ol>
        </details>
      )}
      {muted.length > 0 && (
        <ol className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
          {muted.map((r) => (
            <Row key={r.label} row={r} />
          ))}
        </ol>
      )}
    </div>
  );
}
