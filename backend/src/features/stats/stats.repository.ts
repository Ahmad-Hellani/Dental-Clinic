import { pool } from "../../config/db";

type OverviewRow = {
  total: string;
  pending: string;
  confirmed: string;
  completed: string;
  cancelled: string;
  today: string;
  revenue_completed: string;
  revenue_estimated: string;
};

export const statsRepository = {
  async overview(today: string): Promise<OverviewRow> {
    const { rows } = await pool.query<OverviewRow>(
      `SELECT
         COUNT(*)                                                         AS total,
         COUNT(*) FILTER (WHERE a.status = 'PENDING')                     AS pending,
         COUNT(*) FILTER (WHERE a.status = 'CONFIRMED')                   AS confirmed,
         COUNT(*) FILTER (WHERE a.status = 'COMPLETED')                   AS completed,
         COUNT(*) FILTER (WHERE a.status = 'CANCELLED')                   AS cancelled,
         COUNT(*) FILTER (WHERE a.appointment_date = $1 AND a.status IN ('PENDING','CONFIRMED')) AS today,
         COALESCE(SUM(t.price) FILTER (WHERE a.status = 'COMPLETED'), 0)  AS revenue_completed,
         COALESCE(SUM(t.price) FILTER (WHERE a.status IN ('CONFIRMED','COMPLETED')), 0) AS revenue_estimated
       FROM appointments a
       JOIN treatments t ON t.id = a.treatment_id`,
      [today],
    );
    return rows[0];
  },

  async activeCounts(): Promise<{ dentists: number; treatments: number }> {
    const [d, t] = await Promise.all([
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM dentist_profiles WHERE is_active = true`),
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM treatments WHERE is_active = true`),
    ]);
    return { dentists: Number(d.rows[0].count), treatments: Number(t.rows[0].count) };
  },
};
