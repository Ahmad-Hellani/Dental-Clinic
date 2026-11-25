import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import type { AppointmentStatus } from "../../lib/types";

const tones = {
  neutral: "bg-canvas text-ink-soft border-line-strong",
  brand: "bg-brand-50 text-brand-800 border-brand-200",
  success: "bg-status-completed-bg text-status-completed-fg border-transparent",
  danger: "bg-red-50 text-red-700 border-red-200",
} as const;

export function Badge({ tone = "neutral", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}

const statusStyles: Record<AppointmentStatus, string> = {
  PENDING: "bg-status-pending-bg text-status-pending-fg",
  CONFIRMED: "bg-status-confirmed-bg text-status-confirmed-fg",
  COMPLETED: "bg-status-completed-bg text-status-completed-fg",
  CANCELLED: "bg-status-cancelled-bg text-status-cancelled-fg",
};
const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", statusStyles[status])}>
      {statusLabels[status]}
    </span>
  );
}
