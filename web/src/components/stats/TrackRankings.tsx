"use client";

import { useState } from "react";
import { TOP_N, type TrackRanking } from "@/lib/stats/compute";

// Podium places get a medal color; everything below is plain ink.
const MEDALS: Record<number, { bg: string; fg: string; label: string }> = {
  1: { bg: "var(--highlight)", fg: "var(--highlight-fg)", label: "gold" },
  2: { bg: "#a8a9ad", fg: "#000", label: "silver" },
  3: { bg: "#b87333", fg: "#000", label: "bronze" },
};

// Tab strip over the per-track top lists. All tracks come down with the page
// (a few hundred bytes each), so switching is instant and needs no request.
export default function TrackRankings({ rankings, color }: { rankings: TrackRanking[]; color: string }) {
  const [active, setActive] = useState(0);
  const current = rankings[Math.min(active, rankings.length - 1)];

  return (
    <div>
      {rankings.length > 1 && (
        <div role="tablist" aria-label="Track" className="mb-3 flex flex-wrap gap-1.5">
          {rankings.map((r, i) => {
            const selected = i === active;
            return (
              <button
                key={r.track}
                role="tab"
                aria-selected={selected}
                onClick={() => setActive(i)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selected
                    ? "border-transparent text-white"
                    : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
                style={selected ? { background: color } : undefined}
              >
                {r.track}
              </button>
            );
          })}
        </div>
      )}

      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {current.track} · top {Math.min(TOP_N, current.top.length)} of {current.total}
      </h4>
      <ol role="tabpanel" className="divide-y divide-neutral-200 dark:divide-neutral-800">
        {current.top.map((p) => {
          const medal = MEDALS[p.rank];
          return (
            <li key={p.url} className="flex items-center gap-3 py-1.5 text-sm">
              {medal ? (
                <span
                  className="w-9 shrink-0 rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums"
                  style={{ background: medal.bg, color: medal.fg }}
                  title={medal.label}
                >
                  #{p.rank}
                </span>
              ) : (
                <span className="w-9 shrink-0 text-center text-xs tabular-nums text-neutral-500">#{p.rank}</span>
              )}
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className={`underline-offset-4 hover:underline ${medal ? "font-medium" : ""}`}
              >
                {p.name}
              </a>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-neutral-500">Only the top {TOP_N} per track are shown.</p>
    </div>
  );
}
