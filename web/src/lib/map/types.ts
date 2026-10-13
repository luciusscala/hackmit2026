// Shape of GET /api/map — the similarity-map snapshot built by
// ../map-pipeline/similarity.py and served from Elasticsearch (or the
// public/map/coords.json fallback).

export type Point = {
  project_id: string;
  project_name: string;
  hackathon_id: string;
  track: string | null;
  confidence: "high" | "medium" | "low";
  rank: number | null;
  score?: number | null;
  team_size: number | null;
  schools?: string[];
  is_winner: boolean;
  description: string;
  signature_terms: string[];
  sponsor_challenges: string[];
  cluster_id: number | null;
  cluster_label: string | null;
  n_connections: number;
  x: number;
  y: number;
  z: number;
};

export type Edge = {
  source: string;
  target: string;
  weight: number;
  cosine: number;
  shared_terms: string[];
  evidence: string;
  same_track: boolean;
};

export type Cluster = {
  id: number;
  label: string;
  size: number;
  x: number;
  y: number;
  z: number;
};

export type MapPayload = {
  points: Point[];
  edges: Edge[];
  clusters: Cluster[];
  source?: "elasticsearch" | "file";
};

export type ColorMode = "theme" | "track";
export type EdgeMode = "inspect" | "all";
export type ClusterFilter = number | "mixed" | null;
