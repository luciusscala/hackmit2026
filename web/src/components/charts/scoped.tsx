import { PODIUM_N, type Scoped, type YearStats } from "@/lib/stats/compute";
import type { ScopeView } from "./ScopedCard";

// Build the two tab views for a chart from a render function. When no year
// has ranks yet there's nothing to switch to, so only the "all" view exists.
export function scopeViews(
  scoped: Scoped,
  render: (stats: YearStats[]) => React.ReactNode,
  subtitle?: (stats: YearStats[]) => React.ReactNode
): ScopeView[] {
  const views: ScopeView[] = [
    { id: "all", label: "All projects", subtitle: subtitle?.(scoped.all), content: render(scoped.all) },
  ];
  if (scoped.podium.length > 0) {
    views.push({
      id: "podium",
      label: `Top ${PODIUM_N} per track`,
      subtitle: subtitle?.(scoped.podium),
      content: (
        <>
          {scoped.noPodium.length > 0 && (
            <p className="mb-3 text-xs text-neutral-500">
              No {scoped.noPodium.join(" / ")} rankings yet — shown once judging starts.
            </p>
          )}
          {render(scoped.podium)}
        </>
      ),
    });
  }
  return views;
}
