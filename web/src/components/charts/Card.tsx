export default function Card({
  title,
  subtitle,
  aside,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  aside?: React.ReactNode; // right side of the header (tabs, badges)
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6 dark:border-neutral-800 dark:bg-neutral-950">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}
