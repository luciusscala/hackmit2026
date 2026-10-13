import Link from "next/link";

// Text links from the stats home to the map/forecast/match pages (which use
// their own dark chip nav, AppNav, to come back).
const LINKS = [
  { href: "/map", label: "3D map" },
  { href: "/forecast", label: "2026 forecast" },
  { href: "/match", label: "Try a writeup" },
];

export default function SiteLinks() {
  return (
    <nav aria-label="Sections" className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="underline-offset-4 hover:underline">
          {l.label} →
        </Link>
      ))}
    </nav>
  );
}
