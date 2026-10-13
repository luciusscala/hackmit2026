import type { Series } from "./series";

export default function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-3 flex gap-4 text-xs text-neutral-500">
      {series.map((s) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}
