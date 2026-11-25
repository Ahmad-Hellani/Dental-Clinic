import { cn } from "../../lib/cn";

export function StatCard({ label, value, hint, highlight = false }: { label: string; value: string | number; hint?: string; highlight?: boolean }) {
  return (
    <div className={cn("card p-4", highlight && "border-brand-200 bg-brand-50")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
