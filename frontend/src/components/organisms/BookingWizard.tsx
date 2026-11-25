import { useCallback, useEffect, useMemo, useState } from "react";
import { bookAppointment } from "../../services/appointments.service";
import { listDentists, getSlots } from "../../services/dentists.service";
import { listTreatments } from "../../services/treatments.service";
import { cn } from "../../lib/cn";
import { getErrorMessage } from "../../lib/errors";
import { dayCodeOf, DAY_LABELS, formatDate, formatDuration, formatPrice, formatTime, todayISO } from "../../lib/format";
import type { Appointment, Dentist, Slot, Treatment } from "../../lib/types";
import { useFetch } from "../../lib/useFetch";
import { Button } from "../atoms/Button";
import { Input, Select, Textarea } from "../atoms/Input";
import { Spinner } from "../atoms/Spinner";
import { AlertBanner } from "../molecules/AlertBanner";
import { DentistCard } from "../molecules/DentistCard";
import { EmptyState } from "../molecules/EmptyState";
import { FormField } from "../molecules/FormField";
import { TimeSlotPill } from "../molecules/TimeSlotPill";
import { TreatmentCard } from "../molecules/TreatmentCard";

const STEPS = ["Treatment", "Dentist", "Date & time", "Confirm"];

export function BookingWizard({ onBooked }: { onBooked: (a: Appointment) => void }) {
  const treatments = useFetch(() => listTreatments(), []);
  const dentists = useFetch(() => listDentists(), []);

  const [step, setStep] = useState(0);
  const [treatment, setTreatment] = useState<Treatment | null>(null);
  const [dentist, setDentist] = useState<Dentist | null>(null);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    if (!treatment || !dentist || !date) return;
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await getSlots(dentist.id, date, treatment.id);
      setSlots(res.slots);
    } catch (err) {
      setSlots([]);
      setSlotsError(getErrorMessage(err));
    } finally {
      setSlotsLoading(false);
    }
  }, [treatment, dentist, date]);

  useEffect(() => {
    setSlot(null);
    void loadSlots();
  }, [loadSlots]);

  const categories = useMemo(() => ["ALL", ...Array.from(new Set((treatments.data ?? []).map((t) => t.category)))], [treatments.data]);
  const filteredTreatments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (treatments.data ?? []).filter(
      (t) => (category === "ALL" || t.category === category) && (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    );
  }, [treatments.data, search, category]);

  const canNext = [!!treatment, !!dentist, !!slot, true][step];
  const worksOnDate = dentist && date ? dentist.workingDays.includes(dayCodeOf(date)) : true;

  async function confirm() {
    if (!treatment || !dentist || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await bookAppointment({
        treatmentId: treatment.id,
        dentistId: dentist.id,
        date,
        startTime: slot.startTime,
        patientNotes: notes.trim() || undefined,
      });
      onBooked(appointment);
    } catch (err) {
      setError(getErrorMessage(err));
      setStep(2); // the slot may have just been taken: pick another one
      void loadSlots();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* stepper */}
      <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Booking steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold",
                i < step && "border-brand-600 bg-brand-600 text-white",
                i === step && "border-ink bg-ink text-white",
                i > step && "border-line-strong bg-surface text-ink-muted",
              )}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={cn("font-semibold", i === step ? "text-ink" : "text-ink-muted")}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-1 hidden h-px w-6 bg-line-strong sm:block" />}
          </li>
        ))}
      </ol>

      {error && <AlertBanner tone="error" onClose={() => setError(null)}>{error}</AlertBanner>}

      {/* step 1: treatment */}
      {step === 0 && (
        <section className="space-y-4">
          <h2>Choose a treatment</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input placeholder="Search treatments…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search treatments" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="sm:max-w-[220px]">
              {categories.map((c) => <option key={c} value={c}>{c === "ALL" ? "All categories" : c}</option>)}
            </Select>
          </div>
          {treatments.loading ? <Spinner /> : treatments.error ? (
            <AlertBanner tone="error">{treatments.error}</AlertBanner>
          ) : filteredTreatments.length === 0 ? (
            <EmptyState title="No treatments match your search" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filteredTreatments.map((t) => (
                <TreatmentCard key={t.id} treatment={t} selected={treatment?.id === t.id} onSelect={setTreatment} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* step 2: dentist */}
      {step === 1 && (
        <section className="space-y-4">
          <h2>Choose your dentist</h2>
          {dentists.loading ? <Spinner /> : dentists.error ? (
            <AlertBanner tone="error">{dentists.error}</AlertBanner>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(dentists.data ?? []).map((d) => (
                <DentistCard key={d.id} dentist={d} selected={dentist?.id === d.id} onSelect={(x) => { setDentist(x); setSlot(null); }} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* step 3: date + slot */}
      {step === 2 && dentist && treatment && (
        <section className="space-y-4">
          <h2>Pick a date and time</h2>
          <div className="max-w-xs">
            <FormField label="Date" htmlFor="booking-date">
              <Input id="booking-date" type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </FormField>
          </div>
          {!date ? (
            <p className="text-sm text-ink-muted">Select a date to see {dentist.fullName}'s available times.</p>
          ) : !worksOnDate ? (
            <AlertBanner tone="warning">
              {dentist.fullName} does not work on {DAY_LABELS[dayCodeOf(date)]}s. Please choose another day.
            </AlertBanner>
          ) : slotsLoading ? <Spinner /> : slotsError ? (
            <AlertBanner tone="error">{slotsError}</AlertBanner>
          ) : slots.length === 0 ? (
            <EmptyState title="No free times on this date" text="Try another day, or choose a different dentist." />
          ) : (
            <div>
              <p className="mb-2 text-sm text-ink-muted">{slots.length} available · {formatDuration(treatment.durationMinutes)} appointment</p>
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => <TimeSlotPill key={s.startTime} slot={s} selected={slot?.startTime === s.startTime} onSelect={setSlot} />)}
              </div>
            </div>
          )}
        </section>
      )}

      {/* step 4: confirm */}
      {step === 3 && treatment && dentist && slot && (
        <section className="space-y-4">
          <h2>Review and confirm</h2>
          <dl className="card divide-y divide-line text-sm">
            {[
              ["Treatment", `${treatment.name} (${formatDuration(treatment.durationMinutes)})`],
              ["Dentist", `${dentist.fullName} · ${dentist.roomNumber}`],
              ["Date", formatDate(date)],
              ["Time", `${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}`],
              ["Price", formatPrice(treatment.price)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-4 py-3">
                <dt className="font-semibold text-ink-muted">{k}</dt>
                <dd className="text-right font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <FormField label="Symptoms or notes (optional)" htmlFor="booking-notes" hint="Anything the dentist should know before your visit.">
            <Textarea id="booking-notes" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </section>
      )}

      <div className="flex justify-between border-t border-line pt-4">
        <Button variant="secondary" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
        {step < STEPS.length - 1 ? (
          <Button disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : (
          <Button loading={submitting} onClick={confirm}>Confirm booking</Button>
        )}
      </div>
    </div>
  );
}
