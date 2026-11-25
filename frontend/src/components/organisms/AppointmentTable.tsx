import type { ReactNode } from "react";
import { formatDate, formatDuration, formatPrice, formatTime } from "../../lib/format";
import type { Appointment } from "../../lib/types";
import { StatusBadge } from "../atoms/Badge";
import { EmptyState } from "../molecules/EmptyState";

type Perspective = "patient" | "dentist" | "admin";

export function AppointmentTable({
  items,
  perspective,
  renderActions,
  emptyText = "No appointments to show.",
}: {
  items: Appointment[];
  perspective: Perspective;
  renderActions?: (a: Appointment) => ReactNode;
  emptyText?: string;
}) {
  if (!items.length) return <EmptyState title={emptyText} />;

  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-card">
      <table className="min-w-full divide-y divide-line text-sm">
        <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Treatment</th>
            {perspective !== "patient" && <th className="px-4 py-3">Patient</th>}
            {perspective !== "dentist" && <th className="px-4 py-3">Dentist</th>}
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Notes</th>
            {renderActions && <th className="px-4 py-3 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((a) => (
            <tr key={a.id} className="align-top">
              <td className="whitespace-nowrap px-4 py-3">
                <p className="font-semibold">{formatDate(a.date)}</p>
                <p className="text-ink-muted">{formatTime(a.startTime)} – {formatTime(a.endTime)}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-semibold">{a.treatment.name}</p>
                <p className="text-ink-muted">{formatDuration(a.treatment.durationMinutes)} · {formatPrice(a.treatment.price)}</p>
              </td>
              {perspective !== "patient" && (
                <td className="px-4 py-3">
                  <p className="font-semibold">{a.patient.name}</p>
                  <p className="text-ink-muted">{a.patient.email}</p>
                </td>
              )}
              {perspective !== "dentist" && (
                <td className="px-4 py-3">
                  <p className="font-semibold">{a.dentist.name}</p>
                  <p className="text-ink-muted">{a.dentist.specialty} · {a.dentist.room}</p>
                </td>
              )}
              <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
              <td className="max-w-xs px-4 py-3 text-ink-soft">
                {a.patientNotes && <p><span className="font-semibold text-ink">Patient:</span> {a.patientNotes}</p>}
                {a.dentistNotes && <p className="mt-1 rounded bg-brand-50 p-2"><span className="font-semibold text-brand-900">Dentist:</span> {a.dentistNotes}</p>}
                {!a.patientNotes && !a.dentistNotes && <span className="text-ink-muted">—</span>}
              </td>
              {renderActions && <td className="whitespace-nowrap px-4 py-3 text-right">{renderActions(a)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
