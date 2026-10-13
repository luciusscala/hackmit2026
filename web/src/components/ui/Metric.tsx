// Dark stat tile used on the forecast and match pages.
export default function Metric({
  label,
  value,
  hint,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#10131a] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</p>
      <p className={mono ? "mt-1 font-mono text-lg text-neutral-100" : "mt-1 text-sm"}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-neutral-500">{hint}</p> : null}
    </div>
  );
}
