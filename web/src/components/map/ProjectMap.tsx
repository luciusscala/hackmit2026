"use client";

import { useEffect, useMemo, useState } from "react";
import { HACKATHONS, MAP_BG, SCALE } from "@/lib/map/constants";
import type { ClusterFilter, ColorMode, EdgeMode, Point } from "@/lib/map/types";
import MapLegend from "./MapLegend";
import MapScene from "./MapScene";
import MapToolbar from "./MapToolbar";
import ProjectDetail from "./ProjectDetail";
import { useMapData } from "./useMapData";

// Container for the 3D similarity map: owns every filter/selection state and
// the derived sets, and hands them to the scene, toolbar, legend and detail
// panel. Method notes live in docs/similarity.md — lines are
// evidenced edges; nearby dots without a line are not a match.
export default function ProjectMap() {
  const { data, error } = useMapData();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hideLow, setHideLow] = useState(true);
  const [colorMode, setColorMode] = useState<ColorMode>("theme");
  const [edgeMode, setEdgeMode] = useState<EdgeMode>("inspect");
  const [hackathons, setHackathons] = useState<string[]>(HACKATHONS.map((h) => h.id));
  const [query, setQuery] = useState("");
  const [clusterFilter, setClusterFilter] = useState<ClusterFilter>(null);
  const [trackFilter, setTrackFilter] = useState<string | null>(null);

  // A search that names exactly one project selects it. Ported as-is from the
  // prototype: it also re-runs when filters change, which is intended.
  useEffect(() => {
    if (!data) return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const named = data.points.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) &&
        !(hideLow && p.confidence === "low") &&
        hackathons.includes(p.hackathon_id)
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (named.length === 1) setSelected(named[0].project_id);
  }, [query, data, hideLow, hackathons]);

  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setSelected(null);
        setHovered(null);
        setQuery("");
        setClusterFilter(null);
        setTrackFilter(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Point>();
    for (const p of data?.points || []) m.set(p.project_id, p);
    return m;
  }, [data]);

  const visible = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const hset = new Set(hackathons);
    const base = data.points.filter((p) => {
      if (hideLow && p.confidence === "low") return false;
      if (!hset.has(p.hackathon_id)) return false;
      if (clusterFilter === "mixed" && p.cluster_id != null) return false;
      if (typeof clusterFilter === "number" && p.cluster_id !== clusterFilter) return false;
      if (trackFilter && (p.track || "NO TRACK") !== trackFilter) return false;
      if (!q) return true;
      return (
        p.project_name.toLowerCase().includes(q) ||
        (p.track || "").toLowerCase().includes(q) ||
        (p.cluster_label || "").toLowerCase().includes(q) ||
        p.signature_terms.some((t) => t.toLowerCase().includes(q))
      );
    });
    if (!q) return base;
    const nameHits = data.points.filter((p) => {
      if (hideLow && p.confidence === "low") return false;
      if (!hset.has(p.hackathon_id)) return false;
      return p.project_name.toLowerCase().includes(q);
    });
    const keep = new Set((nameHits.length ? nameHits : base).map((p) => p.project_id));
    if (nameHits.length) {
      const extra = new Set<string>();
      const seed = new Set(keep);
      for (const e of data.edges) {
        if (seed.has(e.source)) extra.add(e.target);
        if (seed.has(e.target)) extra.add(e.source);
      }
      for (const id of extra) keep.add(id);
    }
    return data.points.filter(
      (p) => keep.has(p.project_id) && !(hideLow && p.confidence === "low") && hset.has(p.hackathon_id)
    );
  }, [data, hideLow, query, hackathons, clusterFilter, trackFilter]);

  const visibleIds = useMemo(() => new Set(visible.map((p) => p.project_id)), [visible]);

  const focusId = selected || hovered;
  const neighborIds = useMemo(() => {
    const s = new Set<string>();
    if (!focusId || !data) return s;
    s.add(focusId);
    for (const e of data.edges) {
      if (e.source === focusId) s.add(e.target);
      if (e.target === focusId) s.add(e.source);
    }
    return s;
  }, [focusId, data]);

  const neighborhoodView = visible.length > 0 && visible.length <= 48;

  const framePoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visible;
    const named = visible.filter((p) => p.project_name.toLowerCase().includes(q));
    return named.length ? named : visible;
  }, [visible, query]);

  const drawnEdges = useMemo(() => {
    if (!data) return [];
    return data.edges.filter((e) => {
      if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) return false;
      if (neighborhoodView) return true;
      if (edgeMode === "all") return e.weight >= 0.4;
      if (!focusId) return false;
      return e.source === focusId || e.target === focusId;
    });
  }, [data, visibleIds, edgeMode, focusId, neighborhoodView]);

  const selectedPoint = selected ? byId.get(selected) : undefined;
  const hoveredPoint = hovered && hovered !== selected ? byId.get(hovered) : undefined;

  const selectedEdges = useMemo(() => {
    if (!selected || !data) return [];
    return data.edges
      .filter((e) => e.source === selected || e.target === selected)
      .sort((a, b) => b.weight - a.weight);
  }, [selected, data]);

  const visibleClusters = useMemo(() => {
    if (!data) return [];
    const counts = new Map<number, number>();
    for (const p of visible) {
      if (p.cluster_id == null) continue;
      counts.set(p.cluster_id, (counts.get(p.cluster_id) || 0) + 1);
    }
    return data.clusters
      .filter((c) => (counts.get(c.id) || 0) >= 4)
      .sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0));
  }, [data, visible]);

  const mixedCount = useMemo(() => visible.filter((p) => p.cluster_id == null).length, [visible]);

  const orbitTarget = useMemo((): [number, number, number] => {
    const pts = framePoints.length ? framePoints : visible;
    if (!neighborhoodView || pts.length === 0) return [0, 0, 0];
    const cx = (pts.reduce((s, p) => s + p.x, 0) / pts.length) * SCALE;
    const cy = (pts.reduce((s, p) => s + p.y, 0) / pts.length) * SCALE;
    const cz = (pts.reduce((s, p) => s + p.z, 0) / pts.length) * SCALE;
    if (![cx, cy, cz].every(Number.isFinite)) return [0, 0, 0];
    return [cx, cy, cz];
  }, [framePoints, visible, neighborhoodView]);

  function toggleHack(id: string) {
    setHackathons((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  // Switching color mode drops the filter that only makes sense in the other mode.
  function changeColorMode(m: ColorMode) {
    setColorMode(m);
    if (m === "theme") setTrackFilter(null);
    else setClusterFilter(null);
  }

  function resetView() {
    setQuery("");
    setSelected(null);
    setHovered(null);
    setClusterFilter(null);
    setTrackFilter(null);
    setHackathons(HACKATHONS.map((h) => h.id));
  }

  if (error) {
    return <p className="p-8 text-sm text-red-400">Could not load map data ({error}).</p>;
  }
  if (!data) {
    return <p className="p-8 text-sm text-neutral-400">Loading map…</p>;
  }

  const islanded = data.clusters.reduce((s, c) => s + c.size, 0);
  const eligible = data.points.filter((p) => p.confidence !== "low").length;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden text-neutral-100" style={{ background: MAP_BG }}>
      <MapScene
        visible={visible}
        drawnEdges={drawnEdges}
        byId={byId}
        labelledClusters={visibleClusters.slice(0, 5)}
        framePoints={framePoints}
        neighborhoodView={neighborhoodView}
        orbitTarget={orbitTarget}
        colorMode={colorMode}
        selected={selected}
        hovered={hovered}
        focusId={focusId}
        neighborIds={neighborIds}
        hoveredPoint={hoveredPoint}
        onSelect={setSelected}
        onHover={setHovered}
      />

      <MapToolbar
        source={data.source}
        query={query}
        onQuery={setQuery}
        hackathons={hackathons}
        onToggleHackathon={toggleHack}
        colorMode={colorMode}
        onColorMode={changeColorMode}
        edgeMode={edgeMode}
        onEdgeMode={setEdgeMode}
        hideLow={hideLow}
        onHideLow={setHideLow}
        visibleCount={visible.length}
        onReset={resetView}
      />

      {!selectedPoint && (
        <MapLegend
          colorMode={colorMode}
          clusters={data.clusters}
          islanded={islanded}
          eligible={eligible}
          mixedCount={mixedCount}
          clusterFilter={clusterFilter}
          onClusterFilter={setClusterFilter}
          trackFilter={trackFilter}
          onTrackFilter={setTrackFilter}
        />
      )}

      {selectedPoint && (
        <ProjectDetail
          point={selectedPoint}
          edges={selectedEdges}
          byId={byId}
          onClose={() => setSelected(null)}
          onPick={setSelected}
        />
      )}
    </div>
  );
}
