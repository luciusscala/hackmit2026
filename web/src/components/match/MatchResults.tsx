import { placeLine } from "@/lib/forecast";
import type { MatchResponse } from "@/lib/match";
import Metric from "@/components/ui/Metric";

// Analogue summary + the retrieved 2025 neighbours for one submitted writeup.
export default function MatchResults({ result }: { result: MatchResponse }) {
  return (
    <section className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Metric label="Inferred track" mono={false} value={result.predicted_track || "unclear"} />
        <Metric
          label="Analogue percentile"
          hint="100 ≈ first in a 2025 track"
          value={result.analogue_percentile == null ? "—" : Math.round(result.analogue_percentile * 100)}
        />
        <Metric
          label="Finalist-likeness"
          hint={`neighbors who were top-10${result.source === "elasticsearch" ? " · Elasticsearch" : ""}`}
          value={result.finalist_likeness == null ? "—" : `${Math.round(result.finalist_likeness * 100)}%`}
        />
      </div>

      <ul className="list-disc space-y-1 pl-4 text-[13px] text-neutral-400">
        {(result.reasons || []).map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>

      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="border-b border-white/10 px-3 py-2 text-[10px] uppercase tracking-wider text-neutral-500">
          Retrieved 2025 analogues
        </div>
        <ul>
          {(result.neighbors || []).map((n) => (
            <li key={n.project_id} className="border-b border-white/10 px-3 py-2 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium">{n.project_name}</p>
                <p className="shrink-0 text-[11px] text-neutral-500">{placeLine(n)}</p>
              </div>
              {n.snippet ? (
                <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">{n.snippet}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
