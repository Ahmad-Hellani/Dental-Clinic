import { cn } from "../../lib/cn";
import { formatDuration, formatPrice } from "../../lib/format";
import type { Treatment } from "../../lib/types";
import { Badge } from "../atoms/Badge";

export function TreatmentCard({ treatment, selected = false, onSelect }: { treatment: Treatment; selected?: boolean; onSelect?: (t: Treatment) => void }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3>{treatment.name}</h3>
        <Badge tone="brand">{treatment.category}</Badge>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{treatment.description}</p>
      <p className="mt-3 text-sm font-semibold text-ink">
        {formatPrice(treatment.price)} <span className="font-normal text-ink-muted">· {formatDuration(treatment.durationMinutes)}</span>
      </p>
    </>
  );
  if (!onSelect) return <div className="card p-4">{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onSelect(treatment)}
      aria-pressed={selected}
      className={cn(
        "card w-full p-4 text-left transition-colors hover:border-brand-500",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
        selected && "border-brand-600 bg-brand-50 ring-1 ring-brand-600",
      )}
    >
      {body}
    </button>
  );
}
