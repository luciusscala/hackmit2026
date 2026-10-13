"use client";

import { useEffect, useState } from "react";
import type { ForecastFile } from "@/lib/forecast";

// Loads GET /api/forecast and refetches after a "Pull live" run.
export function useForecast() {
  const [data, setData] = useState<ForecastFile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/forecast", { cache: "no-store" })
        .then((r) => {
          if (!r.ok) throw new Error(`forecast ${r.status}`);
          return r.json();
        })
        .then((j) => {
          if (j.error) throw new Error(j.error);
          setError(null);
          setData(j);
        })
        .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    };
    load();
    window.addEventListener("hackmit:refreshed", load);
    return () => window.removeEventListener("hackmit:refreshed", load);
  }, []);

  return { data, error };
}
