"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Html, Line, OrbitControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { clusterColor, colorFor, DEFAULT_CAM, MAP_BG, SCALE } from "@/lib/map/constants";
import type { Cluster, ColorMode, Edge, Point } from "@/lib/map/types";

// Frames the camera on a small set of points (search hits / a tight filter),
// and restores the default view when that set goes away. Uses lookAt rather
// than a second OrbitControls so there is only ever one controls instance.
function Recenter({ points, enabled }: { points: Point[]; enabled: boolean }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const wasEnabled = useRef(false);
  const key = points
    .map((p) => p.project_id)
    .sort()
    .join("|");

  useEffect(() => {
    if (enabled && points.length > 0) {
      wasEnabled.current = true;
      const cx = (points.reduce((s, p) => s + p.x, 0) / points.length) * SCALE;
      const cy = (points.reduce((s, p) => s + p.y, 0) / points.length) * SCALE;
      const cz = (points.reduce((s, p) => s + p.z, 0) / points.length) * SCALE;
      if (![cx, cy, cz].every(Number.isFinite)) return;
      let span = points.length === 1 ? 1.15 : 0.7;
      for (const p of points) {
        const d = Math.hypot(p.x * SCALE - cx, p.y * SCALE - cy, p.z * SCALE - cz);
        if (d > span) span = d;
      }
      span = Math.min(span, 2.4);
      camera.position.set(cx, cy + span * 0.32, cz + Math.max(3.6, span * 2.8));
      camera.lookAt(cx, cy, cz);
      camera.updateProjectionMatrix();
      invalidate();
      return;
    }
    if (wasEnabled.current) {
      wasEnabled.current = false;
      camera.position.set(...DEFAULT_CAM);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [key, enabled, camera, invalidate, points]);
  return null;
}

export type MapSceneProps = {
  visible: Point[];
  drawnEdges: Edge[];
  byId: Map<string, Point>;
  labelledClusters: Cluster[];
  framePoints: Point[];
  neighborhoodView: boolean;
  orbitTarget: [number, number, number];
  colorMode: ColorMode;
  selected: string | null;
  hovered: string | null;
  focusId: string | null;
  neighborIds: Set<string>;
  hoveredPoint?: Point;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
};

// The WebGL layer only: points, evidenced edges, island labels, hover card.
// All filtering/selection state lives in ProjectMap and comes in as props.
export default function MapScene({
  visible,
  drawnEdges,
  byId,
  labelledClusters,
  framePoints,
  neighborhoodView,
  orbitTarget,
  colorMode,
  selected,
  hovered,
  focusId,
  neighborIds,
  hoveredPoint,
  onSelect,
  onHover,
}: MapSceneProps) {
  return (
    <Canvas
      camera={{ position: DEFAULT_CAM, fov: 46 }}
      style={{ width: "100%", height: "100%", display: "block" }}
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      onPointerMissed={() => {
        onSelect(null);
        onHover(null);
      }}
    >
      <Recenter points={framePoints} enabled={neighborhoodView} />
      <color attach="background" args={[MAP_BG]} />
      <ambientLight intensity={1.1} />
      <pointLight position={[6, 8, 10]} intensity={0.6} />

      {!neighborhoodView &&
        labelledClusters.map((c) => (
          <Html
            key={`c-${c.id}`}
            position={[c.x * SCALE, c.y * SCALE + 0.32, c.z * SCALE]}
            center
            sprite
            zIndexRange={[2, 1]}
            style={{ pointerEvents: "none", whiteSpace: "nowrap" }}
          >
            <div
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white/90 shadow-none"
              style={{
                background: `${clusterColor(c.id)}33`,
                border: `1px solid ${clusterColor(c.id)}66`,
              }}
            >
              {c.label}
            </div>
          </Html>
        ))}

      {drawnEdges.map((e) => {
        const a = byId.get(e.source);
        const b = byId.get(e.target);
        if (!a || !b) return null;
        const hot = !!(focusId && (e.source === focusId || e.target === focusId));
        return (
          <Line
            key={`${e.source}-${e.target}`}
            points={[
              [a.x * SCALE, a.y * SCALE, a.z * SCALE],
              [b.x * SCALE, b.y * SCALE, b.z * SCALE],
            ]}
            color={hot ? "#f8fafc" : "#94a3b8"}
            lineWidth={hot ? 2.2 : neighborhoodView ? 1.4 : 1}
            transparent
            opacity={hot ? 0.95 : neighborhoodView ? 0.45 : 0.2}
          />
        );
      })}

      {visible.map((p) => {
        const active = p.project_id === selected;
        const inFocus = !focusId || neighborIds.has(p.project_id);
        const base = visible.length <= 24 ? 0.092 : visible.length <= 80 ? 0.086 : 0.078;
        const r =
          base *
          (active ? 1.4 : hovered === p.project_id ? 1.18 : 1) *
          (0.92 + 0.08 * Math.min(p.n_connections, 5) / 5);
        const col = colorFor(p, colorMode);
        return (
          <group key={p.project_id} position={[p.x * SCALE, p.y * SCALE, p.z * SCALE]}>
            <mesh
              onClick={(ev) => {
                ev.stopPropagation();
                onSelect(p.project_id);
              }}
              onPointerOver={(ev) => {
                ev.stopPropagation();
                onHover(p.project_id);
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                onHover(null);
                document.body.style.cursor = "auto";
              }}
            >
              <sphereGeometry args={[r, 16, 16]} />
              <meshBasicMaterial
                color={col}
                transparent
                opacity={
                  inFocus
                    ? colorMode === "theme" && p.cluster_id == null
                      ? 0.5
                      : 0.96
                    : 0.1
                }
                toneMapped={false}
              />
            </mesh>
            {p.is_winner ? (
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[r * 1.45, r * 0.14, 8, 20]} />
                <meshBasicMaterial color="#fbbf24" toneMapped={false} />
              </mesh>
            ) : null}
          </group>
        );
      })}

      {hoveredPoint && (
        <Html
          position={[
            hoveredPoint.x * SCALE,
            hoveredPoint.y * SCALE + 0.16,
            hoveredPoint.z * SCALE,
          ]}
          center
          sprite
          zIndexRange={[2, 1]}
          style={{ pointerEvents: "none" }}
        >
          <div className="rounded-md border border-white/20 bg-black/85 px-2 py-1 text-[11px] text-white">
            <div className="font-medium">{hoveredPoint.project_name}</div>
            <div className="text-[10px] text-neutral-400">
              {hoveredPoint.cluster_label ||
                (hoveredPoint.track && hoveredPoint.track !== "NO TRACK"
                  ? hoveredPoint.track
                  : "No tight theme")}
            </div>
          </div>
        </Html>
      )}

      <OrbitControls
        enableDamping
        makeDefault
        minDistance={2.2}
        maxDistance={18}
        target={orbitTarget}
      />
    </Canvas>
  );
}
