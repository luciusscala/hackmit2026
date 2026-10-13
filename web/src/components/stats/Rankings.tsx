import type { YearStats } from "@/lib/stats/compute";
import { TOP_N } from "@/lib/stats/compute";
import Card from "../charts/Card";
import TrackRankings from "./TrackRankings";
import { OURSELVES, SHOW_OURSELVES } from "@/lib/easterEgg";

const LIVE_YEAR = "2026";

function ago(iso: string | null): string {
  if (!iso) return "never";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ${mins % 60}m ago` : `${Math.floor(h / 24)}d ago`;
}

function LiveBadge({ judging, lastUpdated }: { judging: boolean; lastUpdated: string | null }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-2.5 py-1 text-xs dark:border-neutral-800">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--highlight)] opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--highlight)]" />
      </span>
      <span className="font-medium">Live</span>
      <span className="text-neutral-500" title={lastUpdated ?? undefined}>
        {judging ? "judging in progress" : "waiting for judging"} · synced {ago(lastUpdated)}
      </span>
    </span>
  );
}

function ProjectLink({ name, url }: { name: string; url?: string }) {
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
      {name}
    </a>
  ) : (
    <span className="font-medium">{name}</span>
  );
}

function YearRankings({ s, showHeading }: { s: YearStats; showHeading: boolean }) {
  const color = s.color;
  const live = s.year === LIVE_YEAR;

  return (
    <div>
      {showHeading && (
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
          {s.label}
        </h3>
      )}

      {s.prizeWinners.length > 0 && (
        <section className="mb-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Prize winners</h4>
          <ul className="space-y-1.5">
            {s.prizeWinners.map((w) => (
              <li key={w.url} className="text-sm">
                <ProjectLink name={w.name} url={w.url} />
                <span className="ml-2 text-neutral-500">{w.prizes.join(" · ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {live && SHOW_OURSELVES && (
        <a
          href={OURSELVES.url}
          target="_blank"
          rel="noreferrer"
          title="Definitely a real ranking"
          className="mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm"
          style={{ background: "var(--highlight)", color: "var(--highlight-fg)" }}
        >
          <span className="w-9 shrink-0 rounded bg-black/15 px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums">
            #1
          </span>
          <span className="font-semibold">{OURSELVES.name}</span>
          <span className="ml-auto shrink-0 text-xs opacity-80">every track · 100th percentile</span>
        </a>
      )}
      {s.rankings.length > 0 ? (
        <section>
          <TrackRankings rankings={s.rankings} color={color} />
          <p className="mt-1 text-xs text-neutral-500">{s.rankedCount} of {s.projects} projects ranked so far.</p>
        </section>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 p-4 text-sm text-neutral-500 dark:border-neutral-700">
          {live
            ? `No rankings yet — judging hasn't started. Placements appear here as judges submit comparisons; the top ${TOP_N} refreshes every sync.`
            : "No rankings available."}
        </p>
      )}
    </div>
  );
}

export default function Rankings({ stats }: { stats: YearStats[] }) {
  const liveYear = stats.find((s) => s.year === LIVE_YEAR);
  const one = stats.length === 1;
  return (
    <Card
      title="Rankings"
      subtitle={
        liveYear ? (
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Judging placements from Plume.</span>
            <LiveBadge judging={liveYear.rankedCount > 0} lastUpdated={liveYear.lastUpdated} />
          </span>
        ) : (
          "Judging placements from Plume."
        )
      }
    >
      <div className={one ? "" : "grid gap-6 md:grid-cols-2"}>
        {stats.map((s) => (
          <YearRankings key={s.label} s={s} showHeading={!one} />
        ))}
      </div>
    </Card>
  );
}
