import { useMemo, useState } from "react";
import { Avatar } from "../components/atoms/Avatar";
import { Button } from "../components/atoms/Button";
import { Spinner } from "../components/atoms/Spinner";
import { AlertBanner } from "../components/molecules/AlertBanner";
import { DentistScheduleGrid } from "../components/organisms/DentistScheduleGrid";
import { DashboardLayout } from "../components/templates/DashboardLayout";
import { dentistSchedule } from "../services/appointments.service";
import { myDentistProfile } from "../services/dentists.service";
import { cn } from "../lib/cn";
import { formatDays, formatTime, todayISO } from "../lib/format";
import { useFetch } from "../lib/useFetch";
import { useTab } from "../lib/useTab";

const ITEMS = [{ key: "schedule", label: "My schedule" }];
type View = "today" | "pending" | "upcoming";

export default function DentistDashboard() {
  const [tab, setTab] = useTab("schedule");
  const [view, setView] = useState<View>("upcoming");
  const profile = useFetch(() => myDentistProfile(), []);
  const schedule = useFetch(() => dentistSchedule(), []);

  const visible = useMemo(() => {
    const all = (schedule.data ?? []).filter((a) => a.status !== "CANCELLED");
    if (view === "today") return all.filter((a) => a.date === todayISO());
    if (view === "pending") return all.filter((a) => a.status === "PENDING");
    return all;
  }, [schedule.data, view]);

  const pendingCount = (schedule.data ?? []).filter((a) => a.status === "PENDING").length;
  const todayCount = (schedule.data ?? []).filter((a) => a.date === todayISO() && a.status !== "CANCELLED").length;

  return (
    <DashboardLayout title="Daily schedule" subtitle="Today's and upcoming appointments assigned to you" items={ITEMS} active={tab} onSelect={setTab}>
      <div className="space-y-6">
        {profile.data && (
          <div className="card flex items-center gap-4 p-4">
            <Avatar name={profile.data.fullName} size="lg" />
            <div>
              <p className="font-serif text-lg font-bold">{profile.data.fullName}</p>
              <p className="text-sm text-ink-soft">{profile.data.specialty} · {profile.data.roomNumber}</p>
              <p className="text-xs text-ink-muted">{formatDays(profile.data.workingDays)} · {formatTime(profile.data.startTime)} – {formatTime(profile.data.endTime)}</p>
            </div>
          </div>
        )}
        {profile.error && <AlertBanner tone="warning">{profile.error}</AlertBanner>}

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Schedule view">
          {([["upcoming", "All upcoming"], ["today", `Today (${todayCount})`], ["pending", `Needs confirmation (${pendingCount})`]] as [View, string][]).map(([key, label]) => (
            <Button key={key} size="sm" variant={view === key ? "primary" : "secondary"} className={cn(view === key && "pointer-events-none")} onClick={() => setView(key)}>{label}</Button>
          ))}
        </div>

        {schedule.error && <AlertBanner tone="error">{schedule.error}</AlertBanner>}
        {schedule.loading && !schedule.data ? <Spinner /> : <DentistScheduleGrid appointments={visible} onChanged={schedule.reload} />}
      </div>
    </DashboardLayout>
  );
}
