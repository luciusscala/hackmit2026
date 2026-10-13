import type { YearStats } from "@/lib/stats/compute";
import BarList from "../charts/BarList";
import Card from "../charts/Card";

// Tracks are assigned during judging; 2026 is all "NO TRACK" until then, so
// only years with tracks render. Names are consistent enough to merge rows.
export default function TrackChart({ stats }: { stats: YearStats[] }) {
  const withTracks = stats.filter((s) => s.tracks.length > 0);
  if (withTracks.length === 0) return null;

  const labels = [...new Set(withTracks.flatMap((s) => s.tracks.map((t) => t.label)))];
  const lookup = withTracks.map((s) => new Map(s.tracks.map((t) => [t.label, t.count])));
  const rows = labels
    .map((label) => ({ label, values: lookup.map((m) => m.get(label) ?? 0) }))
    .sort((a, b) => b.values[0] - a.values[0]);
  const missing = stats.filter((s) => s.tracks.length === 0).map((s) => s.label);

  return (
    <Card
      title="Tracks"
      subtitle={
        missing.length
          ? `Track assignments for ${missing.join(", ")} appear after judging.`
          : "Projects per judging track."
      }
    >
      <BarList
        series={withTracks.map((s) => ({ name: s.label, color: s.color }))}
        totals={withTracks.map((s) => s.projects)}
        rows={rows}
      />
    </Card>
  );
}
