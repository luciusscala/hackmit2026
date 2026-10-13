import type { Neighbor } from "@/lib/forecast";

// Shape of POST /api/match (see src/app/api/match/route.ts).
export type MatchNeighbor = Neighbor & { snippet?: string };

export type MatchResponse = {
  error?: string;
  source?: string;
  predicted_track?: string | null;
  analogue_percentile?: number | null;
  finalist_likeness?: number | null;
  n_neighbors?: number;
  neighbors?: MatchNeighbor[];
  reasons?: string[];
};
