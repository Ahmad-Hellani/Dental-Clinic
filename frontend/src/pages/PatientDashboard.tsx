import { useMemo, useState } from "react";
import { Button } from "../components/atoms/Button";
import { Spinner } from "../components/atoms/Spinner";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { EmptyState } from "../components/molecules/EmptyState";
import { AppointmentTable } from "../components/organisms/AppointmentTable";
import { BookingWizard } from "../components/organisms/BookingWizard";
import { DashboardLayout } from "../components/templates/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { cancelAppointment, myAppointments } from "../services/appointments.service";
import { getErrorMessage } from "../lib/errors";
import { formatDate, formatTime, todayISO } from "../lib/format";
import type { Appointment } from "../lib/types";
import { useFetch } from "../lib/useFetch";
import { useTab } from "../lib/useTab";

const ITEMS = [{ key: "appointments", label: "My appointments" }, { key: "book", label: "Book a visit" }];

export default function PatientDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useTab("appointments");
  const [flash, setFlash] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const appts = useFetch(() => myAppointments("all"), []);

  const { upcoming, history } = useMemo(() => {
    const today = todayISO();
    const all = appts.data ?? [];
    const isUp = (a: Appointment) => a.date >= today && (a.status === "PENDING" || a.status === "CONFIRMED");
    return {
      upcoming: all.filter(isUp).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
      history: all.filter((a) => !isUp(a)).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime)),
    };
  }, [appts.data]);

  async function cancel(a: Appointment) {
    if (!window.confirm(`Cancel your ${a.treatment.name} on ${formatDate(a.date)}?`)) return;
    setActionError(null);
    try {
      await cancelAppointment(a.id);
      setFlash("Your appointment was cancelled.");
      appts.reload();
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }

  return (
    <DashboardLayout title={`Hello, ${user?.fullName.split(" ")[0] ?? ""}`} subtitle="Your appointments and bookings" items={ITEMS} active={tab} onSelect={(k) => { setFlash(null); setTab(k); }}>
      {tab === "book" ? (
        <div className="card p-5">
          <BookingWizard
            onBooked={(a) => {
              setFlash(`Booked! ${a.treatment.name} with ${a.dentist.name} on ${formatDate(a.date)} at ${formatTime(a.startTime)}. The clinic will confirm it shortly.`);
              appts.reload();
              setTab("appointments");
            }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {flash && <AlertBanner tone="success" onClose={() => setFlash(null)}>{flash}</AlertBanner>}
          {actionError && <AlertBanner tone="error" onClose={() => setActionError(null)}>{actionError}</AlertBanner>}
          {appts.error && <AlertBanner tone="error">{appts.error}</AlertBanner>}

          {appts.loading && !appts.data ? <Spinner /> : (appts.data ?? []).length === 0 ? (
            <EmptyState title="No appointments yet" text="Book your first visit in a minute." action={<Button onClick={() => setTab("book")}>Book a visit</Button>} />
          ) : (
            <>
              <section>
                <h2 className="mb-3">Upcoming</h2>
                <AppointmentTable
                  items={upcoming}
                  perspective="patient"
                  emptyText="No upcoming appointments."
                  renderActions={(a) => <Button size="sm" variant="danger" onClick={() => cancel(a)}>Cancel</Button>}
                />
              </section>
              <section>
                <h2 className="mb-3">History</h2>
                <AppointmentTable items={history} perspective="patient" emptyText="Nothing here yet." />
              </section>
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
