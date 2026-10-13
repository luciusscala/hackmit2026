import Link from "next/link";

export type Option<T extends string> = { id: T; label: string };

// Segmented control made of links: state lives in the URL, so every view is
// server-rendered and shareable. `href` builds the link for each option.
export default function Segmented<T extends string>({
  label,
  options,
  active,
  href,
}: {
  label: string;
  options: Option<T>[];
  active: T;
  href: (id: T) => string;
}) {
  return (
    <nav
      aria-label={label}
      className="inline-flex rounded-lg border border-neutral-300 p-0.5 text-sm dark:border-neutral-700"
    >
      {options.map((o) => (
        <Link
          key={o.id}
          href={href(o.id)}
          aria-current={o.id === active ? "page" : undefined}
          className={`rounded-md px-3 py-1 transition ${
            o.id === active
              ? "bg-[var(--accent)] text-[var(--accent-fg)]"
              : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          }`}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  );
}
