import { pool, withTransaction } from "../../config/db";
import { USER_COLUMNS } from "../../config/constants";
import { Errors } from "../../shared/app-error";
import type { Role, UserRow } from "../../shared/types/user";

export type NewUser = {
  fullName: string;
  email: string;
  passwordHash: string;
  phone?: string | null;
  role: Role;
};

export const authRepository = {
  async findByEmail(email: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE email = $1`, [email]);
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(input: NewUser): Promise<UserRow> {
    try {
      const { rows } = await pool.query<UserRow>(
        `INSERT INTO users (full_name, email, password_hash, phone, role)
         VALUES ($1, $2, $3, $4, $5::user_role)
         RETURNING ${USER_COLUMNS}`,
        [input.fullName, input.email, input.passwordHash, input.phone ?? null, input.role],
      );
      return rows[0];
    } catch (err) {
      if ((err as { code?: string }).code === "23505") {
        throw Errors.conflict("An account with this email already exists");
      }
      throw err;
    }
  },

  // ---------- refresh tokens ----------
  async insertRefreshToken(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );
  },

  async findActiveRefreshToken(tokenHash: string): Promise<{ id: string; user_id: string } | null> {
    const { rows } = await pool.query<{ id: string; user_id: string }>(
      `SELECT id, user_id FROM refresh_tokens
       WHERE token_hash = $1 AND is_revoked = false AND expires_at > now()`,
      [tokenHash],
    );
    return rows[0] ?? null;
  },

  /** Revoke the old token and store the new one atomically (rotation). */
  async rotateRefreshToken(oldId: string, userId: string, newHash: string, expiresAt: Date): Promise<void> {
    await withTransaction(async (client) => {
      await client.query(`UPDATE refresh_tokens SET is_revoked = true WHERE id = $1`, [oldId]);
      await client.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [userId, newHash, expiresAt],
      );
    });
  },

  async revokeByHash(tokenHash: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`, [tokenHash]);
  },

  async revokeAllForUser(userId: string): Promise<void> {
    await pool.query(`UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1 AND is_revoked = false`, [userId]);
  },
};
