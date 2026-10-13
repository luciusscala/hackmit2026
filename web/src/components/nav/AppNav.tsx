"use client";

import Link from "next/link";
import RefreshLive from "./RefreshLive";

export type NavId = "map" | "forecast" | "match";

// Chip nav for the dark map/forecast/match pages. "Stats" leads back to the
// light stats home at /, which has its own header.
const LINKS: { id: NavId | "stats"; href: string; label: string }[] = [
  { id: "stats", href: "/", label: "Stats" },
  { id: "map", href: "/map", label: "Map" },
  { id: "forecast", href: "/forecast", label: "2026 forecast" },
  { id: "match", href: "/match", label: "Try a writeup" },
];

export default function AppNav({ current }: { current: NavId }) {
  return (
    <nav className="flex shrink-0 items-center gap-1.5">
      {LINKS.map((l) => (
        <Link
          key={l.id}
          href={l.href}
          className={`rounded-full px-2.5 py-0.5 text-[11px] ${
            current === l.id
              ? "bg-neutral-100 text-neutral-900"
              : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {l.label}
        </Link>
      ))}
      <RefreshLive />
    </nav>
  );
}
