import { useMemo, useState } from "react";
import { setAppointmentStatus } from "../../services/appointments.service";
import { getErrorMessage } from "../../lib/errors";
import { formatDate, formatDuration, formatTime, todayISO } from "../../lib/format";
import type { Appointment, AppointmentStatus } from "../../lib/types";
import { Badge, StatusBadge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Textarea } from "../atoms/Input";
import { AlertBanner } from "../molecules/AlertBanner";
import { EmptyState } from "../molecules/EmptyState";
import { Modal } from "../molecules/Modal";

type NoteTarget = { appointment: Appointment; status?: AppointmentStatus };

export function DentistScheduleGrid({ appointments, onChanged }: { appointments: Appointment[]; onChanged: () => void }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noteTarget, setNoteTarget] = useState<NoteTarget | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const today = todayISO();

  const days = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) map.set(a.date, [...(map.get(a.date) ?? []), a]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [appointments]);

  async function change(a: Appointment, status: AppointmentStatus) {
    setBusyId(a.id);
    setError(null);
    try {
      await setAppointmentStatus(a.id, { status });
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  function openNotes(target: NoteTarget) {
    setNoteText(target.appointment.dentistNotes ?? "");
    setNoteTarget(target);
  }

  async function saveNotes() {
    if (!noteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await setAppointmentStatus(noteTarget.appointment.id, { status: noteTarget.status, dentistNotes: noteText.trim() || undefined });
      setNoteTarget(null);
      onChanged();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!appointments.length) return <EmptyState title="Nothing scheduled" text="New bookings will appear here." />;

  return (
    <div className="space-y-6">
      {error && <AlertBanner tone="error" onClose={() => setError(null)}>{error}</AlertBanner>}

      {days.map(([date, items]) => (
        <section key={date}>
          <div className="mb-2 flex items-center gap-2">
            <h3>{formatDate(date)}</h3>
            {date === today && <Badge tone="brand">Today</Badge>}
            <span className="text-xs text-ink-muted">{items.length} appointment{items.length === 1 ? "" : "s"}</span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((a) => (
              <article key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-serif text-lg font-bold">{formatTime(a.startTime)} – {formatTime(a.endTime)}</p>
                    <p className="text-sm font-semibold">{a.treatment.name}</p>
                    <p className="text-xs text-ink-muted">{formatDuration(a.treatment.durationMinutes)} · {a.dentist.room}</p>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
                <p className="mt-3 text-sm"><span className="font-semibold">{a.patient.name}</span> <span className="text-ink-muted">· {a.patient.email}</span></p>
                {a.patientNotes && <p className="mt-2 rounded bg-canvas p-2 text-sm text-ink-soft"><span className="font-semibold">Patient notes:</span> {a.patientNotes}</p>}
                {a.dentistNotes && <p className="mt-2 rounded bg-brand-50 p-2 text-sm text-brand-900"><span className="font-semibold">Your notes:</span> {a.dentistNotes}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {a.status === "PENDING" && (
                    <>
                      <Button size="sm" loading={busyId === a.id} onClick={() => change(a, "CONFIRMED")}>Confirm</Button>
                      <Button size="sm" variant="danger" disabled={busyId === a.id} onClick={() => window.confirm("Decline this appointment?") && change(a, "CANCELLED")}>Decline</Button>
                    </>
                  )}
                  {a.status === "CONFIRMED" && (
                    <>
                      <Button size="sm" onClick={() => openNotes({ appointment: a, status: "COMPLETED" })}>Mark completed…</Button>
                      <Button size="sm" variant="danger" disabled={busyId === a.id} onClick={() => window.confirm("Cancel this appointment?") && change(a, "CANCELLED")}>Cancel</Button>
                    </>
                  )}
                  {a.status === "COMPLETED" && <Button size="sm" variant="secondary" onClick={() => openNotes({ appointment: a })}>Edit notes</Button>}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}

      <Modal
        open={!!noteTarget}
        title={noteTarget?.status === "COMPLETED" ? "Complete visit & add notes" : "Clinical notes"}
        onClose={() => setNoteTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setNoteTarget(null)}>Cancel</Button>
            <Button loading={saving} onClick={saveNotes}>{noteTarget?.status === "COMPLETED" ? "Mark completed" : "Save notes"}</Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-ink-muted">
          {noteTarget?.appointment.patient.name} · {noteTarget?.appointment.treatment.name}. The patient will see these notes once the visit is completed.
        </p>
        <Textarea value={noteText} maxLength={2000} onChange={(e) => setNoteText(e.target.value)} placeholder="Post-treatment summary, advice, follow-up…" className="min-h-[140px]" />
      </Modal>
    </div>
  );
}
