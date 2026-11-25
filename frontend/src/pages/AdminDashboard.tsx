import { useState } from "react";
import { Button } from "../components/atoms/Button";
import { Spinner } from "../components/atoms/Spinner";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { StatCard } from "../components/molecules/StatCard";
import { AdminAppointmentsPanel } from "../components/organisms/AdminAppointmentsPanel";
import { AppointmentTable } from "../components/organisms/AppointmentTable";
import { DentistsManager } from "../components/organisms/DentistsManager";
import { TreatmentsManager } from "../components/organisms/TreatmentsManager";
import { UsersManager } from "../components/organisms/UsersManager";
import { DashboardLayout } from "../components/templates/DashboardLayout";
import { getStats } from "../services/admin.service";
import { adminAppointments, setAppointmentStatus } from "../services/appointments.service";
import { getErrorMessage } from "../lib/errors";
import { formatPrice } from "../lib/format";
import { useFetch } from "../lib/useFetch";
import { useTab } from "../lib/useTab";

const ITEMS = [
  { key: "overview", label: "Overview" },
  { key: "appointments", label: "All appointments" },
  { key: "treatments", label: "Treatments" },
  { key: "dentists", label: "Dentists" },
  { key: "users", label: "Users" },
];

function Overview({ goTo }: { goTo: (tab: string) => void }) {
  const stats = useFetch(() => getStats(), []);
  const pending = useFetch(() => adminAppointments({ status: "PENDING", limit: 5 }), []);
  const [error, setError] = useState<string | null>(null);

  async function decide(id: string, status: "CONFIRMED" | "CANCELLED") {
    setError(null);
    try {
      await setAppointmentStatus(id, { status });
      stats.reload();
      pending.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const s = stats.data;
  return (
    <div className="space-y-8">
      {stats.error && <AlertBanner tone="error">{stats.error}</AlertBanner>}
      {stats.loading && !s ? <Spinner /> : s && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total appointments" value={s.totalAppointments} hint={`${s.todaysAppointments} scheduled today`} />
          <StatCard label="Pending approvals" value={s.pendingApprovals} highlight={s.pendingApprovals > 0} hint="Waiting for confirmation" />
          <StatCard label="Completed visits" value={s.completedVisits} hint={`${s.cancelled} cancelled`} />
          <StatCard label="Estimated revenue" value={formatPrice(s.estimatedRevenue)} hint={`${formatPrice(s.revenueCompleted)} from completed visits`} />
          <StatCard label="Active dentists" value={s.activeDentists} />
          <StatCard label="Active treatments" value={s.activeTreatments} />
        </div>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2>Pending approvals</h2>
          <Button variant="ghost" size="sm" onClick={() => goTo("appointments")}>View all appointments →</Button>
        </div>
        {error && <div className="mb-3"><AlertBanner tone="error" onClose={() => setError(null)}>{error}</AlertBanner></div>}
        {pending.loading && !pending.data ? <Spinner /> : (
          <AppointmentTable
            items={pending.data?.items ?? []}
            perspective="admin"
            emptyText="Nothing waiting for approval."
            renderActions={(a) => (
              <div className="flex justify-end gap-2">
                <Button size="sm" onClick={() => decide(a.id, "CONFIRMED")}>Confirm</Button>
                <Button size="sm" variant="danger" onClick={() => decide(a.id, "CANCELLED")}>Decline</Button>
              </div>
            )}
          />
        )}
      </section>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useTab("overview");
  return (
    <DashboardLayout title="Clinic administration" subtitle="Overview, appointments, catalog and accounts" items={ITEMS} active={tab} onSelect={setTab}>
      {tab === "overview" && <Overview goTo={setTab} />}
      {tab === "appointments" && <AdminAppointmentsPanel />}
      {tab === "treatments" && <TreatmentsManager />}
      {tab === "dentists" && <DentistsManager />}
      {tab === "users" && <UsersManager />}
    </DashboardLayout>
  );
}
