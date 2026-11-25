import { useState, type FormEvent } from "react";
import { useAuth } from "../../context/AuthContext";
import { createUser, listUsers, updateUser } from "../../services/admin.service";
import { getErrorMessage } from "../../lib/errors";
import type { Role } from "../../lib/types";
import { useFetch } from "../../lib/useFetch";
import { Avatar } from "../atoms/Avatar";
import { Badge } from "../atoms/Badge";
import { Button } from "../atoms/Button";
import { Input, Select } from "../atoms/Input";
import { Spinner } from "../atoms/Spinner";
import { AlertBanner } from "../molecules/AlertBanner";
import { FormField } from "../molecules/FormField";
import { Modal } from "../molecules/Modal";

const ROLES: Role[] = ["PATIENT", "DENTIST", "ADMIN"];
const label = (r: string) => r.charAt(0) + r.slice(1).toLowerCase();
type Form = { fullName: string; email: string; password: string; phone: string; role: Role };
const EMPTY: Form = { fullName: "", email: "", password: "", phone: "", role: "DENTIST" };

/** Accounts live in the authentication service; this talks to /api/auth/users (ADMIN only). */
export function UsersManager() {
  const { user: me } = useAuth();
  const [role, setRole] = useState<Role | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useFetch(() => listUsers({ role, search, page, limit: 10 }), [role, search, page]);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createUser({ ...form, phone: form.phone.trim() || undefined });
      setCreating(false);
      setForm(EMPTY);
      list.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, p: { role?: Role; isActive?: boolean }) {
    setRowError(null);
    try {
      await updateUser(id, p);
      list.reload();
    } catch (err) {
      setRowError(getErrorMessage(err));
    }
  }

  const data = list.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select aria-label="Role" value={role} onChange={(e) => { setRole(e.target.value as Role | ""); setPage(1); }} className="!w-auto">
            <option value="">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
          </Select>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}>
            <Input aria-label="Search users" placeholder="Name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <Button type="submit" variant="secondary">Search</Button>
          </form>
        </div>
        <Button onClick={() => { setError(null); setCreating(true); }}>Add user</Button>
      </div>

      {rowError && <AlertBanner tone="error" onClose={() => setRowError(null)}>{rowError}</AlertBanner>}
      {list.error && <AlertBanner tone="error">{list.error}</AlertBanner>}

      {list.loading && !data ? <Spinner /> : data && (
        <>
          <div className="overflow-x-auto rounded-md border border-line bg-surface shadow-card">
            <table className="min-w-full divide-y divide-line text-sm">
              <thead className="bg-canvas text-left text-xs font-semibold uppercase tracking-wide text-ink-muted">
                <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.items.map((u) => {
                  const isMe = u.id === me?.id;
                  return (
                    <tr key={u.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} size="sm" />
                          <div><p className="font-semibold">{u.fullName} {isMe && <Badge tone="brand">You</Badge>}</p><p className="text-ink-muted">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Select aria-label={`Role of ${u.fullName}`} value={u.role} disabled={isMe} onChange={(e) => patch(u.id, { role: e.target.value as Role })} className="!w-auto !py-1 text-xs">
                          {ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}
                        </Select>
                      </td>
                      <td className="px-4 py-3">{u.isActive ? <Badge tone="success">Active</Badge> : <Badge>Deactivated</Badge>}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant={u.isActive ? "danger" : "secondary"} disabled={isMe} onClick={() => patch(u.id, { isActive: !u.isActive })}>
                          {u.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>{data.total} user{data.total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <span>Page {data.page} of {data.totalPages}</span>
              <Button size="sm" variant="secondary" disabled={data.page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      <Modal open={creating} title="Add user" onClose={() => setCreating(false)}
        footer={<><Button variant="secondary" onClick={() => setCreating(false)}>Cancel</Button><Button type="submit" form="user-form" loading={saving}>Create</Button></>}>
        <form id="user-form" onSubmit={submit} className="space-y-4">
          {error && <AlertBanner tone="error">{error}</AlertBanner>}
          <FormField label="Full name" htmlFor="u-name"><Input id="u-name" required minLength={2} value={form.fullName} onChange={set("fullName")} /></FormField>
          <FormField label="Email" htmlFor="u-email"><Input id="u-email" type="email" required value={form.email} onChange={set("email")} /></FormField>
          <FormField label="Temporary password" htmlFor="u-pw" hint="At least 8 characters, with a letter and a number."><Input id="u-pw" type="text" required minLength={8} value={form.password} onChange={set("password")} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Phone (optional)" htmlFor="u-phone"><Input id="u-phone" value={form.phone} onChange={set("phone")} /></FormField>
            <FormField label="Role" htmlFor="u-role"><Select id="u-role" value={form.role} onChange={set("role")}>{ROLES.map((r) => <option key={r} value={r}>{label(r)}</option>)}</Select></FormField>
          </div>
        </form>
      </Modal>
    </div>
  );
}
