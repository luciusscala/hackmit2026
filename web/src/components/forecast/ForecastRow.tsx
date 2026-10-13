"use client";

import { useState } from "react";
import type { ForecastRow as Row } from "@/lib/forecast";
import { pct, placeLine } from "@/lib/forecast";

// One 2026 project in the ranked list; expands to its reasons and 2025 analogues.
export default function ForecastRow({ r, i, highlight = false }: { r: Row; i: number; highlight?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`border-b border-white/10 ${highlight ? "bg-amber-200/15" : ""}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-white/5"
      >
        <span className={`w-6 shrink-0 pt-0.5 font-mono text-[11px] ${highlight ? "font-semibold text-amber-200" : "text-neutral-500"}`}>{i + 1}</span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-medium ${highlight ? "text-amber-100" : "text-neutral-100"}`}>{r.project_name}</span>
          <span className="mt-0.5 block text-[11px] text-neutral-500">
            {r.predicted_track || "track unclear"}
            {r.team_size ? ` · team of ${r.team_size}` : ""}
            {` · ${r.writeup_chars} chars`}
            {r.has_code_link ? " · has code" : ""}
          </span>
        </span>
        <span className="shrink-0 text-right text-[11px] text-neutral-400">
          <span className="block font-mono text-neutral-200">model {pct(r.model_percentile)}</span>
          <span className="block">finalist {pct(r.finalist_likeness)}%</span>
        </span>
      </button>
      {open ? (
        <div className="space-y-3 px-11 pb-4 text-xs text-neutral-300">
          <p className="leading-relaxed text-neutral-400">{r.description || "No description."}</p>
          <ul className="list-disc space-y-1 pl-4 text-neutral-400">
            {r.reasons.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {r.neighbors.length > 0 ? (
            <div>
              <p className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">
                2025 analogues (judged)
              </p>
              <ul className="space-y-1">
                {r.neighbors.map((n) => (
                  <li key={n.project_id} className="flex justify-between gap-3">
                    <span>{n.project_name}</span>
                    <span className="shrink-0 text-neutral-500">
                      {placeLine(n)}
                      {n.cosine != null ? ` · cos ${n.cosine.toFixed(2)}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
