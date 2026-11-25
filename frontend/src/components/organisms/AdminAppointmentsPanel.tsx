import { useState, type FormEvent } from "react";
import { adminAppointments, setAppointmentStatus } from "../../services/appointments.service";
import { listDentists } from "../../services/dentists.service";
import { getErrorMessage } from "../../lib/errors";
import type { AppointmentStatus } from "../../lib/types";
import { useFetch } from "../../lib/useFetch";
import { Button } from "../atoms/Button";
import { Input, Select } from "../atoms/Input";
import { Spinner } from "../atoms/Spinner";
import { AlertBanner } from "../molecules/AlertBanner";
import { AppointmentTable } from "./AppointmentTable";

const STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

type Filters = { status: AppointmentStatus | ""; date: string; dentistId: string; search: string; page: number };
const EMPTY: Filters = { status: "", date: "", dentistId: "", search: "", page: 1 };

/** "All appointments" master table: filter by status/date/dentist and update any status. */
export function AdminAppointmentsPanel() {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [searchInput, setSearchInput] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const dentists = useFetch(() => listDentists(true), []);
  const result = useFetch(() => adminAppointments({ ...filters, limit: 10 }), [filters]);

  const update = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, page: 1, ...patch }));

  async function changeStatus(id: string, status: AppointmentStatus) {
    setActionError(null);
    try {
      await setAppointmentStatus(id, { status });
      result.reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    update({ search: searchInput.trim() });
  };

  const data = result.data;

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select aria-label="Status" value={filters.status} onChange={(e) => update({ status: e.target.value as AppointmentStatus | "" })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </Select>
        <Select aria-label="Dentist" value={filters.dentistId} onChange={(e) => update({ dentistId: e.target.value })}>
          <option value="">All dentists</option>
          {(dentists.data ?? []).map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
        </Select>
        <Input aria-label="Date" type="date" value={filters.date} onChange={(e) => update({ date: e.target.value })} />
        <form onSubmit={onSearch} className="flex gap-2 lg:col-span-2">
          <Input aria-label="Search patient" placeholder="Patient name or email" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          <Button type="submit" variant="secondary">Search</Button>
          <Button variant="ghost" onClick={() => { setSearchInput(""); setFilters(EMPTY); }}>Reset</Button>
        </form>
      </div>

      {actionError && <AlertBanner tone="error" onClose={() => setActionError(null)}>{actionError}</AlertBanner>}
      {result.error && <AlertBanner tone="error">{result.error}</AlertBanner>}

      {result.loading && !data ? <Spinner /> : data && (
        <>
          <AppointmentTable
            items={data.items}
            perspective="admin"
            emptyText="No appointments match these filters."
            renderActions={(a) => (
              <Select aria-label={`Change status for ${a.patient.name}`} value={a.status} onChange={(e) => changeStatus(a.id, e.target.value as AppointmentStatus)} className="!w-auto !py-1 text-xs">
                {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </Select>
            )}
          />
          <div className="flex items-center justify-between text-sm text-ink-muted">
            <span>{data.total} appointment{data.total === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={data.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Previous</Button>
              <span>Page {data.page} of {data.totalPages}</span>
              <Button size="sm" variant="secondary" disabled={data.page >= data.totalPages} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
