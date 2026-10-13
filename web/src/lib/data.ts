import { supabase } from "@/lib/supabase";
import { YEARS, type GalleryRow, type HackerRow, type Year } from "@/lib/types";

const GALLERY_COLS =
  "project_id, hackathon_id, project_name, magic_link, track, rank, score, last_updated, preferences, prize_winners, needs_power, code_link, video_demo, description, what_it_does, how_we_built_it";
const HACKER_COLS = "hacker_id, project_id, hackathon_id, organization";

// PostgREST caps a single select at 1000 rows; 2025 alone has ~1000 hackers.
const PAGE = 1000;

async function fetchAll<T>(table: string, cols: string, hackathonId: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .eq("hackathon_id", hackathonId)
      .order(table === "gallery" ? "project_id" : "hacker_id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as T[]));
    if (data.length < PAGE) return out;
  }
}

export type YearData = { gallery: GalleryRow[]; hackers: HackerRow[] };

export async function getYearData(year: Year): Promise<YearData> {
  const id = YEARS[year];
  const [gallery, hackers] = await Promise.all([
    fetchAll<GalleryRow>("gallery", GALLERY_COLS, id),
    fetchAll<HackerRow>("hackers", HACKER_COLS, id),
  ]);
  // Plume lets anyone create a project; drop obvious test entries.
  const real = gallery.filter((p) => !/^sec-probe/i.test(p.project_name));
  const ids = new Set(real.map((p) => p.project_id));
  return { gallery: real, hackers: hackers.filter((h) => ids.has(h.project_id)) };
}
