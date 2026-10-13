import { getYearData } from "@/lib/data";
import { computeYearStats, podiumSubset, PODIUM_N, type Scoped } from "@/lib/stats/compute";
import type { Year } from "@/lib/types";
import ChallengeChart from "@/components/stats/ChallengeChart";
import KpiRow from "@/components/stats/KpiRow";
import Rankings from "@/components/stats/Rankings";
import SchoolBreakdown from "@/components/stats/SchoolBreakdown";
import SiteLinks from "@/components/nav/SiteLinks";
import Segmented, { type Option } from "@/components/ui/Segmented";
import TeamSizeChart from "@/components/stats/TeamSizeChart";
import TechStackChart from "@/components/stats/TechStackChart";
import TrackChart from "@/components/stats/TrackChart";
import { CONTEXT_COLOR, YEAR_COLOR } from "@/components/charts/series";

export const dynamic = "force-dynamic";

type View = "2026" | "2025" | "compare";
const VIEWS: Option<View>[] = [
  { id: "2026", label: "2026" },
  { id: "2025", label: "2025" },
  { id: "compare", label: "Compare" },
];

function pick<T extends string>(options: Option<T>[], v: string | string[] | undefined): T {
  const s = Array.isArray(v) ? v[0] : v;
  return options.some((o) => o.id === s) ? (s as T) : options[0].id;
}


export default async function StatsPage(props: PageProps<"/">) {
  const view = pick(VIEWS, (await props.searchParams).view);
  const years: Year[] = view === "compare" ? ["2026", "2025"] : [view];

  // Rankings use the full field; every other card offers both lenses as tabs.
  const scoped: Scoped = { all: [], podium: [], noPodium: [] };
  let error: string | null = null;
  try {
    const data = await Promise.all(years.map(getYearData));
    scoped.all = years.map((y, i) =>
      computeYearStats(y, { label: y, color: YEAR_COLOR[y] }, data[i].gallery, data[i].hackers)
    );
    years.forEach((y, i) => {
      const sub = podiumSubset(data[i].gallery, data[i].hackers);
      if (sub.gallery.length === 0) {
        scoped.noPodium.push(y);
        return;
      }
      scoped.podium.push(
        computeYearStats(y, { label: `${y} top ${PODIUM_N}`, color: YEAR_COLOR[y] }, sub.gallery, sub.hackers)
      );
      // Single-year view: show the whole field behind the podium, in gray, for contrast.
      if (view !== "compare") scoped.podium.push({ ...scoped.all[i], label: `${y} all`, color: CONTEXT_COLOR });
    });
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const hasTracks = scoped.all.some((s) => s.tracks.length > 0);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 font-sans">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HackMIT {view === "compare" ? "2026 vs 2025" : view}</h1>
          <p className="mt-1 text-sm text-neutral-500">Stats from the public project gallery. Refreshed each sync.</p>
          <div className="mt-2">
            <SiteLinks />
          </div>
        </div>
        <Segmented label="Year" options={VIEWS} active={view} href={(v) => (v === "2026" ? "/" : `/?view=${v}`)} />
      </header>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          Could not load stats: {error}
        </p>
      ) : (
        <div className="space-y-6">
          <Rankings stats={scoped.all} />
          <KpiRow scoped={scoped} />
          <SchoolBreakdown scoped={scoped} />
          <div className={`grid gap-6 ${hasTracks ? "md:grid-cols-2" : ""}`}>
            <TeamSizeChart scoped={scoped} />
            {hasTracks && <TrackChart stats={scoped.all} />}
          </div>
          <ChallengeChart scoped={scoped} />
          <TechStackChart scoped={scoped} />
        </div>
      )}
    </main>
  );
}
