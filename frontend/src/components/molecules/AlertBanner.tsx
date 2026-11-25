import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

const tones = {
  info: "border-brand-200 bg-brand-50 text-brand-900",
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
} as const;

export function AlertBanner({ tone = "info", children, onClose }: { tone?: keyof typeof tones; children: ReactNode; onClose?: () => void }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start justify-between gap-3 rounded-md border px-4 py-3 text-sm", tones[tone])}>
      <div>{children}</div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-lg leading-none opacity-60 hover:opacity-100">
          ×
        </button>
      )}
    </div>
  );
}
