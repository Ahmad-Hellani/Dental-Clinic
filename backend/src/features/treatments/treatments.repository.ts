import { pool } from "../../config/db";
import { buildSet } from "../../shared/sql";
import type { CreateTreatmentBody, UpdateTreatmentBody } from "./treatments.schema";

export type TreatmentRow = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: string; // NUMERIC comes back as string
  category: string;
  is_active: boolean;
};

const COLS = "id, name, description, duration_minutes, price, category, is_active";

export const treatmentsRepository = {
  async list(f: { search?: string; category?: string; includeInactive: boolean }): Promise<TreatmentRow[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (!f.includeInactive) where.push("is_active = true");
    if (f.search) {
      params.push(`%${f.search}%`);
      where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }
    if (f.category) {
      params.push(f.category);
      where.push(`category ILIKE $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query<TreatmentRow>(
      `SELECT ${COLS} FROM treatments ${clause} ORDER BY category, name`,
      params,
    );
    return rows;
  },

  async categories(): Promise<string[]> {
    const { rows } = await pool.query<{ category: string }>(
      `SELECT DISTINCT category FROM treatments WHERE is_active = true ORDER BY category`,
    );
    return rows.map((r) => r.category);
  },

  async findById(id: string): Promise<TreatmentRow | null> {
    const { rows } = await pool.query<TreatmentRow>(`SELECT ${COLS} FROM treatments WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(b: CreateTreatmentBody): Promise<TreatmentRow> {
    const { rows } = await pool.query<TreatmentRow>(
      `INSERT INTO treatments (name, description, duration_minutes, price, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING ${COLS}`,
      [b.name, b.description, b.durationMinutes, b.price, b.category],
    );
    return rows[0];
  },

  async update(id: string, patch: UpdateTreatmentBody): Promise<TreatmentRow | null> {
    const { sets, values } = buildSet(
      patch,
      {
        name: "name",
        description: "description",
        durationMinutes: "duration_minutes",
        price: "price",
        category: "category",
        isActive: "is_active",
      },
      2,
    );
    if (!sets.length) return this.findById(id);
    const { rows } = await pool.query<TreatmentRow>(
      `UPDATE treatments SET ${sets.join(", ")} WHERE id = $1 RETURNING ${COLS}`,
      [id, ...values],
    );
    return rows[0] ?? null;
  },
};
