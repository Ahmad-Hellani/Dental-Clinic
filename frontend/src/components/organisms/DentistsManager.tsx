import { useState, type FormEvent } from "react";
import { availableDentistUsers, createDentist, listDentists, updateDentist, type DentistInput } from "../../services/dentists.service";
import { cn } from "../../lib/cn";
import { getErrorMessage } from "../../lib/errors";
import { DAY_CODES, DAY_LABELS, formatDays, formatTime } from "../../lib/format";
import type { DayCode, Dentist } from "../../lib/types";
import { useFetch } from "../../lib/useFetch";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input, Select, Textarea } from "../atoms/Input";
import { Spinner } from "../atoms/Spinner";
import { AlertBanner } from "../molecules/AlertBanner";
import { FormField } from "../molecules/FormField";
import { Modal } from "../molecules/Modal";

type Form = { userId: string; fullName: string; specialty: string; roomNumber: string; bio: string; days: DayCode[]; startTime: string; endTime: string };
const EMPTY: Form = { userId: "", fullName: "", specialty: "", roomNumber: "", bio: "", days: ["MON", "TUE", "WED", "THU", "FRI"], startTime: "09:00", endTime: "17:00" };

export function DentistsManager() {
  const list = useFetch(() => listDentists(true), []);
  const [editing, setEditing] = useState<Dentist | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const available = useFetch(() => availableDentistUsers(), []);

  const open = (d: Dentist | "new") => {
    setError(null);
    if (d === "new") available.reload();
    setForm(d === "new" ? EMPTY : { userId: d.userId, fullName: d.fullName, specialty: d.specialty, roomNumber: d.roomNumber, bio: d.bio, days: d.workingDays, startTime: d.startTime, endTime: d.endTime });
    setEditing(d);
  };

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const toggleDay = (d: DayCode) => setForm((f) => ({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.days.length === 0) return setError("Select at least one working day.");
    if (form.startTime >= form.endTime) return setError("Start time must be before end time.");
    if (editing === "new" && !form.userId) return setError("Choose the dentist account to link.");

    const input: DentistInput = {
      fullName: form.fullName.trim() || undefined,
      specialty: form.specialty.trim(),
      roomNumber: form.roomNumber.trim(),
      bio: form.bio.trim(),
      workingDays: form.days,
      startTime: form.startTime,
      endTime: form.endTime,
    };
    setSaving(true);
    setError(null);
    try {
      if (editing === "new") await createDentist({ ...input, userId: form.userId });
      else if (editing) await updateDentist(editing.id, input);
      setEditing(null);
      list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(d: Dentist) {
    try {
      await updateDentist(d.id, { isActive: !d.isActive });
      list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-muted">Dentist profiles hold specialty, room and working schedule. Accounts are created in the Users tab.</p>
        <Button onClick={() => open("new")}>Add dentist profile</Button>
      </div>
      {!editing && error && <AlertBanner tone="error" onClose={() => setError(null)}>{error}</AlertBanner>}
      {list.error && <AlertBanner tone="error">{list.error}</AlertBanner>}

      {list.loading && !list.data ? <Spinner /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {(list.data ?? []).map((d) => (
            <article key={d.id} className="card p-4">
              <div className="flex items-start gap-3">
                <Avatar name={d.fullName} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3>{d.fullName}</h3>
                    {d.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}
                  </div>
                  <p className="text-sm text-ink-soft">{d.specialty} · {d.roomNumber}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatDays(d.workingDays)} · {formatTime(d.startTime)} – {formatTime(d.endTime)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => open(d)}>Edit</Button>
                <Button size="sm" variant={d.isActive ? "danger" : "secondary"} onClick={() => toggleActive(d)}>{d.isActive ? "Deactivate" : "Activate"}</Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        wide
        open={!!editing}
        title={editing === "new" ? "Add dentist profile" : "Edit dentist profile"}
        onClose={() => setEditing(null)}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="dentist-form" loading={saving}>Save</Button></>}
      >
        <form id="dentist-form" onSubmit={submit} className="space-y-4">
          {error && <AlertBanner tone="error">{error}</AlertBanner>}
          {editing === "new" && (
            <FormField label="Dentist account" htmlFor="d-user" hint="Only DENTIST accounts without a profile are listed.">
              <Select id="d-user" value={form.userId} onChange={(e) => {
                const u = (available.data ?? []).find((x) => x.id === e.target.value);
                setForm((f) => ({ ...f, userId: e.target.value, fullName: u?.fullName ?? f.fullName }));
              }}>
                <option value="">{available.loading ? "Loading…" : "Select an account"}</option>
                {(available.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
              </Select>
              {!available.loading && (available.data ?? []).length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No free dentist accounts. Create one in the Users tab (role: Dentist) first.</p>
              )}
            </FormField>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Display name" htmlFor="d-name"><Input id="d-name" maxLength={120} value={form.fullName} onChange={set("fullName")} /></FormField>
            <FormField label="Room" htmlFor="d-room"><Input id="d-room" required maxLength={30} value={form.roomNumber} onChange={set("roomNumber")} placeholder="Room 101" /></FormField>
          </div>
          <FormField label="Specialty" htmlFor="d-spec"><Input id="d-spec" required minLength={2} maxLength={120} value={form.specialty} onChange={set("specialty")} /></FormField>
          <FormField label="Bio" htmlFor="d-bio"><Textarea id="d-bio" maxLength={2000} value={form.bio} onChange={set("bio")} /></FormField>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Working days</p>
            <div className="flex flex-wrap gap-2">
              {DAY_CODES.map((d) => (
                <button key={d} type="button" aria-pressed={form.days.includes(d)} onClick={() => toggleDay(d)}
                  className={cn("rounded-full border px-3 py-1 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                    form.days.includes(d) ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface text-ink-soft")}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start time" htmlFor="d-start"><Input id="d-start" type="time" required value={form.startTime} onChange={set("startTime")} /></FormField>
            <FormField label="End time" htmlFor="d-end"><Input id="d-end" type="time" required value={form.endTime} onChange={set("endTime")} /></FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
