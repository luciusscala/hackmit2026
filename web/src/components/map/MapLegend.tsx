"use client";

import { clusterColor, MIXED_COLOR, TRACK_COLOR } from "@/lib/map/constants";
import type { Cluster, ClusterFilter, ColorMode } from "@/lib/map/types";

export type MapLegendProps = {
  colorMode: ColorMode;
  clusters: Cluster[];
  islanded: number;
  eligible: number;
  mixedCount: number;
  clusterFilter: ClusterFilter;
  onClusterFilter: (f: ClusterFilter) => void;
  trackFilter: string | null;
  onTrackFilter: (t: string | null) => void;
};

// Bottom-left key. In theme mode each island doubles as a filter; in track
// mode each track does. Shown only while nothing is selected.
export default function MapLegend({
  colorMode,
  clusters,
  islanded,
  eligible,
  mixedCount,
  clusterFilter,
  onClusterFilter,
  trackFilter,
  onTrackFilter,
}: MapLegendProps) {
  return (
    <aside className="pointer-events-none absolute bottom-3 left-3 z-20 w-[15.5rem] max-h-[38vh]">
      <div className="pointer-events-auto max-h-[38vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0b0d12]/90 px-3 py-2.5 text-[11px]">
        {colorMode === "theme" ? (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
              Tight writeup islands
            </p>
            <p className="mb-2 leading-snug text-neutral-500">
              {islanded} of {eligible} projects share a distinctive neighborhood. Gray is not a
              category.
            </p>
            <button
              onClick={() => onClusterFilter(clusterFilter === "mixed" ? null : "mixed")}
              className={`mb-1.5 flex w-full items-start gap-1.5 rounded-md px-1 py-0.5 text-left ${
                clusterFilter === "mixed" ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              <span
                className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: MIXED_COLOR }}
              />
              <span className="text-neutral-400">
                No tight theme <span className="text-neutral-600">({mixedCount})</span>
              </span>
            </button>
            {clusters
              .slice()
              .sort((a, b) => b.size - a.size)
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => onClusterFilter(clusterFilter === c.id ? null : c.id)}
                  className={`flex w-full items-start gap-1.5 rounded-md px-1 py-0.5 text-left ${
                    clusterFilter === c.id ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span
                    className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: clusterColor(c.id) }}
                  />
                  <span>
                    {c.label} <span className="text-neutral-600">({c.size})</span>
                  </span>
                </button>
              ))}
          </>
        ) : (
          <>
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-neutral-500">
              Official track
            </p>
            <p className="mb-2 leading-snug text-neutral-500">
              Track is a color only — it does not create matches.
            </p>
            {Object.entries(TRACK_COLOR).map(([name, c]) => (
              <button
                key={name}
                onClick={() => onTrackFilter(trackFilter === name ? null : name)}
                className={`flex w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left ${
                  trackFilter === name ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: c }} />
                {name}
              </button>
            ))}
          </>
        )}
      </div>
    </aside>
  );
}
