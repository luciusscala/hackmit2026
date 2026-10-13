"use client";

import { useEffect, useState } from "react";
import type { MapPayload } from "@/lib/map/types";

// Loads GET /api/map once and again whenever "Pull live" finishes
// (RefreshLive dispatches the hackmit:refreshed window event).
export function useMapData() {
  const [data, setData] = useState<MapPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/map", { cache: "no-store" })
        .then((r) => {
          if (!r.ok) throw new Error(`map ${r.status}`);
          return r.json();
        })
        .then((j) => {
          if (j.error) throw new Error(j.error);
          setError(null);
          setData({
            points: j.points,
            edges: j.edges,
            clusters: j.clusters || [],
            source: j.source,
          });
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    };
    load();
    window.addEventListener("hackmit:refreshed", load);
    return () => window.removeEventListener("hackmit:refreshed", load);
  }, []);

  return { data, error };
}
