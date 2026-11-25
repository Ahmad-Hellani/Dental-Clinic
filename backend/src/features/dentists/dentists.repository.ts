import { pool } from "../../config/db";
import { buildSet } from "../../shared/sql";
import { Errors } from "../../shared/app-error";
import type { DayCode } from "../../shared/time";
import type { UpdateDentistBody } from "./dentists.schema";

export type DentistRow = {
  id: string;
  user_id: string;
  full_name: string;
  specialty: string;
  bio: string;
  room_number: string;
  working_days: DayCode[];
  start_time: string;
  end_time: string;
  is_active: boolean;
};

const COLS = "id, user_id, full_name, specialty, bio, room_number, working_days, start_time, end_time, is_active";

export type NewDentist = {
  userId: string;
  fullName: string;
  specialty: string;
  bio: string;
  roomNumber: string;
  workingDays: DayCode[];
  startTime: string;
  endTime: string;
};

export const dentistsRepository = {
  async list(includeInactive: boolean): Promise<DentistRow[]> {
    const { rows } = await pool.query<DentistRow>(
      `SELECT ${COLS} FROM dentist_profiles ${includeInactive ? "" : "WHERE is_active = true"} ORDER BY full_name`,
    );
    return rows;
  },

  async findById(id: string): Promise<DentistRow | null> {
    const { rows } = await pool.query<DentistRow>(`SELECT ${COLS} FROM dentist_profiles WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async findByUserId(userId: string): Promise<DentistRow | null> {
    const { rows } = await pool.query<DentistRow>(`SELECT ${COLS} FROM dentist_profiles WHERE user_id = $1`, [userId]);
    return rows[0] ?? null;
  },

  async allUserIds(): Promise<Set<string>> {
    const { rows } = await pool.query<{ user_id: string }>(`SELECT user_id FROM dentist_profiles`);
    return new Set(rows.map((r) => r.user_id));
  },

  async create(d: NewDentist): Promise<DentistRow> {
    try {
      const { rows } = await pool.query<DentistRow>(
        `INSERT INTO dentist_profiles (user_id, full_name, specialty, bio, room_number, working_days, start_time, end_time)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8) RETURNING ${COLS}`,
        [d.userId, d.fullName, d.specialty, d.bio, d.roomNumber, JSON.stringify(d.workingDays), d.startTime, d.endTime],
      );
      return rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw Errors.conflict("A dentist profile already exists for this user");
      }
      throw err;
    }
  },

  async update(id: string, patch: UpdateDentistBody): Promise<DentistRow | null> {
    const prepared = {
      ...patch,
      workingDays: patch.workingDays ? JSON.stringify(patch.workingDays) : undefined,
    };
    const { sets, values } = buildSet(
      prepared,
      {
        fullName: "full_name",
        specialty: "specialty",
        bio: "bio",
        roomNumber: "room_number",
        workingDays: "working_days::jsonb",
        startTime: "start_time",
        endTime: "end_time",
        isActive: "is_active",
      },
      2,
    );
    if (!sets.length) return this.findById(id);
    const { rows } = await pool.query<DentistRow>(
      `UPDATE dentist_profiles SET ${sets.join(", ")} WHERE id = $1 RETURNING ${COLS}`,
      [id, ...values],
    );
    return rows[0] ?? null;
  },
};
