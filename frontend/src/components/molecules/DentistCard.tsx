import { cn } from "../../lib/cn";
import { formatDays, formatTime } from "../../lib/format";
import type { Dentist } from "../../lib/types";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";

export function DentistCard({ dentist, selected = false, onSelect }: { dentist: Dentist; selected?: boolean; onSelect?: (d: Dentist) => void }) {
  const body = (
    <div className="flex gap-3">
      <Avatar name={dentist.fullName} size="lg" />
      <div className="min-w-0">
        <h3>{dentist.fullName}</h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{dentist.specialty}</Badge>
          <span className="text-xs text-ink-muted">{dentist.roomNumber}</span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-ink-soft">{dentist.bio}</p>
        <p className="mt-2 text-xs text-ink-muted">
          {formatDays(dentist.workingDays)} · {formatTime(dentist.startTime)} – {formatTime(dentist.endTime)}
        </p>
      </div>
    </div>
  );
  if (!onSelect) return <div className="card p-4">{body}</div>;
  return (
    <button
      type="button"
      onClick={() => onSelect(dentist)}
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
