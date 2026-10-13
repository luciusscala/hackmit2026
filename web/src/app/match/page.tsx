"use client";

import { useState } from "react";
import AppNav from "@/components/nav/AppNav";
import MatchForm from "@/components/match/MatchForm";
import MatchResults from "@/components/match/MatchResults";
import type { MatchResponse } from "@/lib/match";

export default function MatchPage() {
  const [description, setDescription] = useState("");
  const [track, setTrack] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, track: track || undefined }),
      });
      const j = (await r.json()) as MatchResponse;
      if (!r.ok) setResult({ error: j.error || `HTTP ${r.status}` });
      else setResult(j);
    } catch (err) {
      setResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#07080c] text-neutral-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07080c]/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <h1 className="text-sm font-semibold">Try a writeup</h1>
            <p className="text-[11px] text-neutral-500">
              Match against judged HackMIT 2025 — retrieval in Elasticsearch.
            </p>
          </div>
          <AppNav current="match" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <p className="text-sm leading-relaxed text-neutral-400">
          Paste what you are building. We retrieve the nearest <em>judged</em> 2025 writeups and
          report how those analogues actually placed in their tracks. That is the honest signal. A
          global “you will win” score from a weekend description is not identified in this data.
        </p>

        <MatchForm
          description={description}
          onDescription={setDescription}
          track={track}
          onTrack={setTrack}
          loading={loading}
          onSubmit={onSubmit}
        />

        {result?.error ? <p className="text-sm text-red-400">{result.error}</p> : null}
        {result && !result.error ? <MatchResults result={result} /> : null}
      </main>
    </div>
  );
}
