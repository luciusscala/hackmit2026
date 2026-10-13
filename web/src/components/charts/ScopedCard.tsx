"use client";

import { useState } from "react";
import Card from "./Card";

export type ScopeView = {
  id: string;
  label: string;
  subtitle?: React.ReactNode;
  content: React.ReactNode;
};

// A Card whose body switches between pre-rendered views (all projects vs the
// podium). The views are rendered on the server and passed in as nodes, so
// this only holds the selected tab.
export default function ScopedCard({ title, views }: { title: string; views: ScopeView[] }) {
  const [active, setActive] = useState(views[0].id);
  const current = views.find((v) => v.id === active) ?? views[0];

  return (
    <Card
      title={title}
      subtitle={current.subtitle}
      aside={
        views.length > 1 && (
          <div role="tablist" className="inline-flex rounded-lg border border-neutral-300 p-0.5 text-xs dark:border-neutral-700">
            {views.map((v) => (
              <button
                key={v.id}
                role="tab"
                aria-selected={v.id === current.id}
                onClick={() => setActive(v.id)}
                className={`rounded-md px-2.5 py-1 transition ${
                  v.id === current.id
                    ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                    : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )
      }
    >
      <div role="tabpanel">{current.content}</div>
    </Card>
  );
}
