import { cn } from "../../lib/cn";
import { formatTime } from "../../lib/format";
import type { Slot } from "../../lib/types";

export function TimeSlotPill({ slot, selected, onSelect }: { slot: Slot; selected: boolean; onSelect: (s: Slot) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(slot)}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
        selected ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface text-ink hover:border-brand-500",
      )}
    >
      {formatTime(slot.startTime)}
    </button>
  );
}
