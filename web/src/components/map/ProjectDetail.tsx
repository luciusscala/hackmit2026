"use client";

import { HACKATHONS, rankLine } from "@/lib/map/constants";
import type { Edge, Point } from "@/lib/map/types";

export type ProjectDetailProps = {
  point: Point;
  edges: Edge[]; // this project's evidenced edges, strongest first
  byId: Map<string, Point>;
  onClose: () => void;
  onPick: (id: string) => void;
};

// Side panel for the selected project: metadata, description, distinctive
// terms, and the evidenced matches with the shared terms that justify them.
export default function ProjectDetail({ point, edges, byId, onClose, onPick }: ProjectDetailProps) {
  const schools = (point.schools || []).filter(Boolean).slice(0, 6);
  return (
    <aside className="absolute inset-x-3 bottom-3 z-20 max-h-[46vh] overflow-hidden rounded-xl border border-white/10 bg-[#0b0d12]/95 md:inset-x-auto md:right-3 md:top-16 md:w-[22rem] md:max-h-none">
      <div className="flex h-full flex-col">
        <div className="border-b border-neutral-800 px-4 py-3">
          <button className="text-[11px] text-neutral-500" onClick={onClose}>
            Close
          </button>
          <h2 className="mt-1 text-base font-semibold leading-snug">{point.project_name}</h2>
          <p className="mt-1 text-[11px] text-neutral-400">
            {HACKATHONS.find((h) => h.id === point.hackathon_id)?.label || point.hackathon_id}
            {point.track && point.track !== "NO TRACK" ? ` · ${point.track}` : ""}
            {rankLine(point) ? ` · ${rankLine(point)}` : ""}
            {point.team_size ? ` · team of ${point.team_size}` : ""}
          </p>
          {point.cluster_label ? (
            <p className="mt-1 text-[11px] text-sky-300/90">Island: {point.cluster_label}</p>
          ) : (
            <p className="mt-1 text-[11px] text-neutral-500">
              No tight writeup island — nearby dots may only share a vague topic.
            </p>
          )}
          {schools.length > 0 && (
            <p className="mt-1 text-[11px] text-neutral-500">{schools.join(" · ")}</p>
          )}
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 text-xs">
          <p className="leading-relaxed text-neutral-300">
            {point.description || "No description submitted."}
          </p>
          {point.signature_terms.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                Distinctive language
              </p>
              <p className="mt-1 text-neutral-300">{point.signature_terms.slice(0, 8).join(" · ")}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Evidenced matches ({edges.length})
            </p>
            {edges.length === 0 ? (
              <p className="mt-1 leading-relaxed text-neutral-500">
                Nothing else passed the evidence rule. Neighbors in space may share a vague
                topic, but not enough distinctive language to count as a real connection.
              </p>
            ) : (
              <ul className="mt-2 space-y-3">
                {edges.map((e) => {
                  const otherId = e.source === point.project_id ? e.target : e.source;
                  const other = byId.get(otherId);
                  return (
                    <li key={`${e.source}-${e.target}`}>
                      <button
                        className="text-left text-sky-300 hover:underline"
                        onClick={() => onPick(otherId)}
                      >
                        {other?.project_name || otherId}
                      </button>
                      <p className="text-[11px] text-neutral-500">
                        because of {e.shared_terms.slice(0, 5).join(", ")}
                        {e.same_track ? "" : " · different tracks"}
                        {typeof e.cosine === "number" ? ` · cosine ${e.cosine.toFixed(2)}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
