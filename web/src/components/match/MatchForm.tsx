"use client";

import { TRACKS } from "@/lib/tracks";

export type MatchFormProps = {
  description: string;
  onDescription: (v: string) => void;
  track: string;
  onTrack: (v: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
};

export default function MatchForm({ description, onDescription, track, onTrack, loading, onSubmit }: MatchFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={description}
        onChange={(e) => onDescription(e.target.value)}
        rows={8}
        placeholder="What it does, who it’s for, how you’re building it, what is actually hard…"
        className="w-full rounded-xl border border-white/10 bg-[#10131a] px-3 py-2 text-sm outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={track}
          onChange={(e) => onTrack(e.target.value)}
          className="rounded-md border border-white/10 bg-[#10131a] px-2 py-1 text-[12px]"
        >
          <option value="">Infer track from neighbours</option>
          {TRACKS.map((t) => (
            <option key={t} value={t}>
              Competing in {t}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading || description.trim().length < 40}
          className="rounded-full bg-neutral-100 px-3 py-1 text-[12px] font-medium text-neutral-900 disabled:opacity-40"
        >
          {loading ? "Matching…" : "Match 2025 judged projects"}
        </button>
      </div>
    </form>
  );
}
