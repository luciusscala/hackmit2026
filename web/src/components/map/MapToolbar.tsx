"use client";

import AppNav from "@/components/nav/AppNav";
import { HACKATHONS } from "@/lib/map/constants";
import type { ColorMode, EdgeMode } from "@/lib/map/types";

const chip = (on: boolean) =>
  `shrink-0 rounded-full px-2 py-0.5 text-[11px] ${
    on ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800 text-neutral-500"
  }`;

export type MapToolbarProps = {
  source?: "elasticsearch" | "file";
  query: string;
  onQuery: (q: string) => void;
  hackathons: string[];
  onToggleHackathon: (id: string) => void;
  colorMode: ColorMode;
  onColorMode: (m: ColorMode) => void;
  edgeMode: EdgeMode;
  onEdgeMode: (m: EdgeMode) => void;
  hideLow: boolean;
  onHideLow: (v: boolean) => void;
  visibleCount: number;
  onReset: () => void;
};

// Floating header over the canvas: nav, search, and every filter control.
export default function MapToolbar({
  source,
  query,
  onQuery,
  hackathons,
  onToggleHackathon,
  colorMode,
  onColorMode,
  edgeMode,
  onEdgeMode,
  hideLow,
  onHideLow,
  visibleCount,
  onReset,
}: MapToolbarProps) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2">
      <div className="pointer-events-auto flex h-11 items-center gap-2 overflow-x-auto rounded-xl border border-white/10 bg-[#0b0d12]/95 px-3">
        <h1 className="shrink-0 text-sm font-semibold tracking-tight">Project space</h1>
        <AppNav current="map" />
        {source === "elasticsearch" ? (
          <span className="shrink-0 rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
            ES
          </span>
        ) : null}
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search a project…"
          className="h-7 min-w-[9rem] flex-1 rounded-md border border-neutral-700 bg-neutral-900/80 px-2 text-xs outline-none"
        />
        <div className="flex shrink-0 gap-1">
          {HACKATHONS.map((h) => (
            <button
              key={h.id}
              title={h.label}
              onClick={() => onToggleHackathon(h.id)}
              className={chip(hackathons.includes(h.id))}
            >
              {h.short}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-1">
          {(["theme", "track"] as const).map((m) => (
            <button key={m} onClick={() => onColorMode(m)} className={chip(colorMode === m)}>
              {m === "theme" ? "Theme" : "Track"}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 gap-1">
          {(["inspect", "all"] as const).map((m) => (
            <button key={m} onClick={() => onEdgeMode(m)} className={chip(edgeMode === m)}>
              {m === "inspect" ? "Inspect" : "All lines"}
            </button>
          ))}
        </div>
        <label className="flex shrink-0 items-center gap-1 text-[11px] text-neutral-400">
          <input type="checkbox" checked={hideLow} onChange={(e) => onHideLow(e.target.checked)} />
          Hide thin
        </label>
        <p className="shrink-0 text-[11px] text-neutral-500">{visibleCount}</p>
        <button
          onClick={onReset}
          className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300"
        >
          Reset
        </button>
      </div>
    </header>
  );
}
