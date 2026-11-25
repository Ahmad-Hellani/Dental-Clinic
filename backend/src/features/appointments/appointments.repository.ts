import type { PoolClient } from "pg";
import { pool } from "../../config/db";
import type { AdminListQuery, AppointmentStatus } from "./appointments.schema";

export type AppointmentRow = {
  id: string;
  patient_user_id: string;
  patient_name: string;
  patient_email: string;
  dentist_id: string;
  treatment_id: string;
  appointment_date: string; // DATE parsed as YYYY-MM-DD
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  patient_notes: string | null;
  dentist_notes: string | null;
  created_at: Date;
  updated_at: Date;
  treatment_name: string;
  treatment_price: string;
  treatment_duration: number;
  dentist_name: string;
  dentist_specialty: string;
  dentist_room: string;
  dentist_user_id: string;
};

const SELECT = `
  SELECT a.*,
         t.name AS treatment_name, t.price AS treatment_price, t.duration_minutes AS treatment_duration,
         d.full_name AS dentist_name, d.specialty AS dentist_specialty, d.room_number AS dentist_room,
         d.user_id AS dentist_user_id
  FROM appointments a
  JOIN treatments t ON t.id = a.treatment_id
  JOIN dentist_profiles d ON d.id = a.dentist_id`;

export type NewAppointment = {
  patientUserId: string;
  patientName: string;
  patientEmail: string;
  dentistId: string;
  treatmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  patientNotes?: string;
};

export const appointmentsRepository = {
  async findById(id: string): Promise<AppointmentRow | null> {
    const { rows } = await pool.query<AppointmentRow>(`${SELECT} WHERE a.id = $1`, [id]);
    return rows[0] ?? null;
  },

  /** PENDING/CONFIRMED appointments that block a dentist's calendar on a date */
  async listBooked(dentistId: string, date: string): Promise<{ start_time: string; end_time: string }[]> {
    const { rows } = await pool.query<{ start_time: string; end_time: string }>(
      `SELECT start_time, end_time FROM appointments
       WHERE dentist_id = $1 AND appointment_date = $2 AND status IN ('PENDING', 'CONFIRMED')`,
      [dentistId, date],
    );
    return rows;
  },

  async hasOverlap(
    client: PoolClient,
    column: "dentist_id" | "patient_user_id",
    id: string,
    date: string,
    start: string,
    end: string,
  ): Promise<boolean> {
    const { rowCount } = await client.query(
      `SELECT 1 FROM appointments
       WHERE ${column} = $1 AND appointment_date = $2 AND status IN ('PENDING', 'CONFIRMED')
         AND start_time < $4 AND end_time > $3
       LIMIT 1`,
      [id, date, start, end],
    );
    return (rowCount ?? 0) > 0;
  },

  async insert(client: PoolClient, a: NewAppointment): Promise<string> {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO appointments
         (patient_user_id, patient_name, patient_email, dentist_id, treatment_id,
          appointment_date, start_time, end_time, patient_notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        a.patientUserId, a.patientName, a.patientEmail, a.dentistId, a.treatmentId,
        a.date, a.startTime, a.endTime, a.patientNotes ?? null,
      ],
    );
    return rows[0].id;
  },

  async listForPatient(
    userId: string,
    f: { scope: "upcoming" | "past" | "all"; status?: AppointmentStatus; today: string },
  ): Promise<AppointmentRow[]> {
    const where = ["a.patient_user_id = $1"];
    const params: unknown[] = [userId];
    if (f.scope === "upcoming") {
      params.push(f.today);
      where.push(`a.appointment_date >= $${params.length}`);
    } else if (f.scope === "past") {
      params.push(f.today);
      where.push(`a.appointment_date < $${params.length}`);
    }
    if (f.status) {
      params.push(f.status);
      where.push(`a.status = $${params.length}::appointment_status`);
    }
    const order = f.scope === "past" ? "DESC" : "ASC";
    const { rows } = await pool.query<AppointmentRow>(
      `${SELECT} WHERE ${where.join(" AND ")}
       ORDER BY a.appointment_date ${order}, a.start_time ${order}`,
      params,
    );
    return rows;
  },

  async listForDentistUser(
    userId: string,
    f: { from: string; to?: string; status?: AppointmentStatus },
  ): Promise<AppointmentRow[]> {
    const where = ["d.user_id = $1", "a.appointment_date >= $2"];
    const params: unknown[] = [userId, f.from];
    if (f.to) {
      params.push(f.to);
      where.push(`a.appointment_date <= $${params.length}`);
    }
    if (f.status) {
      params.push(f.status);
      where.push(`a.status = $${params.length}::appointment_status`);
    }
    const { rows } = await pool.query<AppointmentRow>(
      `${SELECT} WHERE ${where.join(" AND ")} ORDER BY a.appointment_date, a.start_time`,
      params,
    );
    return rows;
  },

  async listAdmin(f: AdminListQuery): Promise<{ rows: AppointmentRow[]; total: number }> {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      where.push(sql.replace("?", `$${params.length}`));
    };
    if (f.status) add("a.status = ?::appointment_status", f.status);
    if (f.date) add("a.appointment_date = ?", f.date);
    if (f.from) add("a.appointment_date >= ?", f.from);
    if (f.to) add("a.appointment_date <= ?", f.to);
    if (f.dentistId) add("a.dentist_id = ?", f.dentistId);
    if (f.search) {
      params.push(`%${f.search}%`);
      where.push(`(a.patient_name ILIKE $${params.length} OR a.patient_email ILIKE $${params.length})`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const count = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM appointments a ${clause}`, params);

    params.push(f.limit, (f.page - 1) * f.limit);
    const { rows } = await pool.query<AppointmentRow>(
      `${SELECT} ${clause}
       ORDER BY a.appointment_date DESC, a.start_time DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows, total: Number(count.rows[0].count) };
  },

  async updateStatusAndNotes(id: string, status?: AppointmentStatus, dentistNotes?: string): Promise<void> {
    await pool.query(
      `UPDATE appointments
       SET status = COALESCE($2::appointment_status, status),
           dentist_notes = COALESCE($3, dentist_notes)
       WHERE id = $1`,
      [id, status ?? null, dentistNotes ?? null],
    );
  },
};
