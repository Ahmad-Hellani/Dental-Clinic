import { pool } from "../../config/db";
import { USER_COLUMNS } from "../../config/constants";
import type { Role, UserRow } from "../../shared/types/user";

export const usersRepository = {
  async list(f: { search?: string; role?: Role; isActive?: boolean; page: number; limit: number }) {
    const where: string[] = [];
    const params: unknown[] = [];

    if (f.search) {
      params.push(`%${f.search}%`);
      where.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
    }
    if (f.role) {
      params.push(f.role);
      where.push(`role = $${params.length}::user_role`);
    }
    if (f.isActive !== undefined) {
      params.push(f.isActive);
      where.push(`is_active = $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const count = await pool.query<{ count: string }>(`SELECT COUNT(*) FROM users ${clause}`, params);

    params.push(f.limit, (f.page - 1) * f.limit);
    const rows = await pool.query<UserRow>(
      `SELECT ${USER_COLUMNS} FROM users ${clause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return { rows: rows.rows, total: Number(count.rows[0].count) };
  },

  async update(id: string, patch: { role?: Role; isActive?: boolean }): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
      `UPDATE users
       SET role = COALESCE($2::user_role, role),
           is_active = COALESCE($3, is_active)
       WHERE id = $1
       RETURNING ${USER_COLUMNS}`,
      [id, patch.role ?? null, patch.isActive ?? null],
    );
    return rows[0] ?? null;
  },
};
