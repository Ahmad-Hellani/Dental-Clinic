import { useState, type FormEvent } from "react";
import { createTreatment, listTreatments, updateTreatment, type TreatmentInput } from "../../services/treatments.service";
import { getErrorMessage } from "../../lib/errors";
import { formatDuration, formatPrice } from "../../lib/format";
import type { Treatment } from "../../lib/types";
import { useFetch } from "../../lib/useFetch";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input, Textarea } from "../atoms/Input";
import { Spinner } from "../atoms/Spinner";
import { AlertBanner } from "../molecules/AlertBanner";
import { FormField } from "../molecules/FormField";
import { Modal } from "../molecules/Modal";

type Form = { name: string; category: string; description: string; duration: string; price: string };
const EMPTY: Form = { name: "", category: "", description: "", duration: "30", price: "" };

export function TreatmentsManager() {
  const list = useFetch(() => listTreatments(true), []);
  const [editing, setEditing] = useState<Treatment | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = (t: Treatment | "new") => {
    setError(null);
    setForm(t === "new" ? EMPTY : { name: t.name, category: t.category, description: t.description, duration: String(t.durationMinutes), price: String(t.price) });
    setEditing(t);
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    const duration = Number(form.duration);
    const price = Number(form.price);
    if (!Number.isInteger(duration) || duration < 15 || duration % 15 !== 0) return setError("Duration must be a multiple of 15 minutes.");
    if (form.price === "" || Number.isNaN(price) || price < 0) return setError("Enter a valid price.");

    const input: TreatmentInput = { name: form.name.trim(), category: form.category.trim(), description: form.description.trim(), durationMinutes: duration, price };
    setSaving(true);
    setError(null);
    try {
      if (editing === "new") await createTreatment(input);
      else if (editing) await updateTreatment(editing.id, input);
      setEditing(null);
      list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(t: Treatment) {
    try {
      await updateTreatment(t.id, { isActive: !t.isActive });
      list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">Create, edit and deactivate treatments. Inactive treatments are hidden from patients.</p>
        <Button onClick={() => open("new")}>Add treatment</Button>
      </div>
      {!editing && error && <AlertBanner tone="error" onClose={() => setError(null)}>{error}</AlertBanner>}
      {list.error && <AlertBanner tone="error">{list.error}</AlertBanner>}

      {list.loading && !list.data ? <Spinner /> : (
        <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-card">
          <table className="min-w-full divide-y divide-line text-sm">
            <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
              <tr><th className="px-4 py-3">Treatment</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Duration</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {(list.data ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3"><p className="font-semibold">{t.name}</p><p className="line-clamp-1 max-w-xs text-ink-muted">{t.description}</p></td>
                  <td className="px-4 py-3">{t.category}</td>
                  <td className="px-4 py-3">{formatDuration(t.durationMinutes)}</td>
                  <td className="px-4 py-3">{formatPrice(t.price)}</td>
                  <td className="px-4 py-3">{t.isActive ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <Button size="sm" variant="secondary" onClick={() => open(t)}>Edit</Button>
                    <Button size="sm" variant={t.isActive ? "danger" : "secondary"} onClick={() => toggleActive(t)}>{t.isActive ? "Deactivate" : "Activate"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        title={editing === "new" ? "Add treatment" : "Edit treatment"}
        onClose={() => setEditing(null)}
        footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button type="submit" form="treatment-form" loading={saving}>Save</Button></>}
      >
        <form id="treatment-form" onSubmit={submit} className="space-y-4">
          {error && <AlertBanner tone="error">{error}</AlertBanner>}
          <FormField label="Name" htmlFor="t-name"><Input id="t-name" required minLength={2} maxLength={120} value={form.name} onChange={set("name")} /></FormField>
          <FormField label="Category" htmlFor="t-cat"><Input id="t-cat" required minLength={2} maxLength={60} value={form.category} onChange={set("category")} placeholder="e.g. Restorative" /></FormField>
          <FormField label="Description" htmlFor="t-desc"><Textarea id="t-desc" maxLength={1000} value={form.description} onChange={set("description")} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (minutes)" htmlFor="t-dur" hint="Multiple of 15"><Input id="t-dur" type="number" min={15} max={240} step={15} required value={form.duration} onChange={set("duration")} /></FormField>
            <FormField label="Price (USD)" htmlFor="t-price"><Input id="t-price" type="number" min={0} step="0.01" required value={form.price} onChange={set("price")} /></FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
