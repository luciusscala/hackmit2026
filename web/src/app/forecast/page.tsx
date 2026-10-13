"use client";

import { useMemo, useState } from "react";
import AppNav from "@/components/nav/AppNav";
import ForecastRow from "@/components/forecast/ForecastRow";
import Metric from "@/components/ui/Metric";
import { useForecast } from "@/components/forecast/useForecast";
import type { ForecastRow as Row } from "@/lib/forecast";
import { OURSELVES, SHOW_OURSELVES } from "@/lib/easterEgg";
import { TRACKS } from "@/lib/tracks";

// Pinned to the top of every cut with numbers no model would ever produce.
const OUR_ROW: Row = {
  project_id: "pr-ourselves",
  project_name: OURSELVES.name,
  hackathon_id: "hack-2026",
  listed_track: "All of them",
  predicted_track: "All of them",
  track_confidence: 1,
  team_size: 1,
  schools: [],
  sponsor_challenges: [],
  writeup_chars: 99999,
  n_writeup_fields: 6,
  has_code_link: true,
  has_video: true,
  description: OURSELVES.blurb,
  confidence: "high",
  analogue_percentile: 1,
  analogue_percentile_lo: 1,
  analogue_percentile_hi: 1,
  finalist_likeness: 1,
  finalist_likeness_lo: 1,
  finalist_likeness_hi: 1,
  top3_likeness: 1,
  model_percentile: 1,
  mean_neighbor_cosine: 1,
  neighbors: [],
  reasons: ["Built the forecast. Conflict of interest acknowledged and ignored."],
};

const chip = (on: boolean) =>
  `rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-neutral-100 text-neutral-900" : "bg-neutral-800 text-neutral-400"}`;

export default function ForecastPage() {
  const { data, error } = useForecast();
  const [track, setTrack] = useState<string>("all");
  const [onlyOk, setOnlyOk] = useState(true);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.hack2026.filter((r) => {
      if (onlyOk && (r.confidence === "none" || r.confidence === "low")) return false;
      if (track === "all") return true;
      if (track === "insufficient_writeup") return r.confidence === "none";
      return r.predicted_track === track;
    });
  }, [data, track, onlyOk]);

  const card = data?.model_card;
  const nOk = data
    ? data.hack2026.filter((r) => r.confidence === "high" || r.confidence === "medium").length
    : 0;

  return (
    <div className="min-h-[100dvh] bg-[#07080c] text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07080c]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold">HackMIT 2026 forecast</h1>
            <p className="text-[11px] text-neutral-500">
              {data
                ? `${nOk} of ${data.hack2026.length} gallery cards have enough writeup to score.`
                : error
                  ? error
                  : "Loading forecast…"}
            </p>
          </div>
          <AppNav current="forecast" />
        </div>
      </header>

      {!data || !card ? (
        <p className="mx-auto max-w-5xl px-4 py-6 text-sm text-neutral-500">{error || "Loading forecast…"}</p>
      ) : (
        <main className="mx-auto max-w-5xl space-y-8 px-4 py-6">
          <section className="rounded-2xl border border-amber-200/20 bg-amber-200/5 px-4 py-3 text-sm leading-relaxed text-neutral-300">
            Public writeups are a <span className="text-amber-100">weak</span> predictor of Plume
            pairwise rank. On held-out HackMIT 2025 folds, a 32-d LSA ridge lifts within-track
            NDCG@10 from {card.random.mean_track_ndcg10} (chance) to{" "}
            {card.cv_ridge_lsa.mean_track_ndcg10}, and top-10 overlap from{" "}
            {card.random.mean_track_top10_overlap} to {card.cv_ridge_lsa.mean_track_top10_overlap}.
            That is a real lift and a small one. This page ranks 2026 by that model, then explains
            each card with 2025 analogues — not as a results sheet.
          </section>

          <section className="grid gap-2 sm:grid-cols-4">
            <Metric label="Chance NDCG@10" value={String(card.random.mean_track_ndcg10)} hint="5-fold, by track" />
            <Metric
              label="Ridge-LSA NDCG@10"
              value={String(card.cv_ridge_lsa.mean_track_ndcg10)}
              hint="best public-text ranker"
            />
            <Metric
              label="Top-10 overlap"
              value={`${Math.round((card.cv_ridge_lsa.mean_track_top10_overlap || 0) * 100)}%`}
              hint={`chance ${Math.round((card.random.mean_track_top10_overlap || 0) * 100)}%`}
            />
            <Metric label="2026 scored" value={`${nOk}/${data.hack2026.length}`} hint="gallery cards with enough writeup" />
          </section>

          <section className="text-[12px] leading-relaxed text-neutral-500">
            <p className="mb-2 text-[10px] uppercase tracking-wider">What the labels actually are</p>
            <ul className="list-disc space-y-1 pl-4">
              {card.caveats.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="mt-2">{card.read}</p>
          </section>

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <button onClick={() => setTrack("all")} className={chip(track === "all")}>
                All scored
              </button>
              {TRACKS.map((t) => (
                <button key={t} onClick={() => setTrack(t)} className={chip(track === t)}>
                  {t}
                  <span className="text-neutral-500"> ({(data.by_track[t] || []).length})</span>
                </button>
              ))}
              <label className="ml-auto flex items-center gap-1.5 text-[11px] text-neutral-400">
                <input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} />
                Hide empty writeups
              </label>
            </div>
            <p className="mb-2 text-[11px] text-neutral-500">
              {typeof card.corpus?.hack2026_public_track === "string"
                ? "Official 2026 track is missing on the public gallery (all NO TRACK). Track here is inferred from nearest HackMIT 2025 writeups. "
                : "Official 2026 tracks from the gallery are shown when present; otherwise track is inferred from nearest HackMIT 2025 writeups. "}
              Model column is 2025 within-track percentile (100 ≈ first). Click a row for analogues.
            </p>
            <ol className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0d12]">
              {SHOW_OURSELVES && <ForecastRow r={OUR_ROW} i={0} highlight />}
              {rows.length === 0 ? (
                <li className="px-4 py-6 text-sm text-neutral-500">No projects in this cut.</li>
              ) : (
                rows.map((r, i) => <ForecastRow key={r.project_id} r={r} i={i + (SHOW_OURSELVES ? 1 : 0)} />)
              )}
            </ol>
          </section>
        </main>
      )}
    </div>
  );
}
