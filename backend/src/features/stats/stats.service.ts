import { clinicNow } from "../../shared/time";
import { statsRepository } from "./stats.repository";

export const statsService = {
  async overview() {
    const [o, active] = await Promise.all([statsRepository.overview(clinicNow().date), statsRepository.activeCounts()]);
    return {
      totalAppointments: Number(o.total),
      pendingApprovals: Number(o.pending),
      confirmed: Number(o.confirmed),
      completedVisits: Number(o.completed),
      cancelled: Number(o.cancelled),
      todaysAppointments: Number(o.today),
      revenueCompleted: Number(o.revenue_completed),
      estimatedRevenue: Number(o.revenue_estimated), // confirmed + completed
      activeDentists: active.dentists,
      activeTreatments: active.treatments,
    };
  },
};
