import bcrypt from "bcryptjs";
import { pool } from "./db";
import { BCRYPT_ROUNDS } from "./constants";
import type { Role } from "../shared/types/user";

/**
 * FIXED UUIDs. The clinic backend seeds its dentist_profiles with the same
 * DR_SARA / DR_KARIM ids as `user_id`, so no cross-database query is needed.
 */
export const SEED_USER_IDS = {
  ADMIN: "00000000-0000-4000-8000-000000000001",
  DR_SARA: "00000000-0000-4000-8000-000000000002",
  DR_KARIM: "00000000-0000-4000-8000-000000000003",
  PATIENT: "00000000-0000-4000-8000-000000000004",
} as const;

const DEMO_PASSWORD = "Password123!";

const DEMO_USERS: { id: string; fullName: string; email: string; role: Role; phone: string }[] = [
  { id: SEED_USER_IDS.ADMIN, fullName: "Clinic Admin", email: "admin@dentalclinic.com", role: "ADMIN", phone: "+96170000001" },
  { id: SEED_USER_IDS.DR_SARA, fullName: "Dr. Sara Haddad", email: "dr.sara@dentalclinic.com", role: "DENTIST", phone: "+96170000002" },
  { id: SEED_USER_IDS.DR_KARIM, fullName: "Dr. Karim Nasser", email: "dr.karim@dentalclinic.com", role: "DENTIST", phone: "+96170000003" },
  { id: SEED_USER_IDS.PATIENT, fullName: "Demo Patient", email: "patient@dentalclinic.com", role: "PATIENT", phone: "+96170000004" },
];

/** Idempotent: safe to run on every startup. */
export async function seedDemoUsers(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);
  let inserted = 0;
  for (const u of DEMO_USERS) {
    const res = await pool.query(
      `INSERT INTO users (id, full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5, $6::user_role)
       ON CONFLICT DO NOTHING`,
      [u.id, u.fullName, u.email, passwordHash, u.phone, u.role],
    );
    inserted += res.rowCount ?? 0;
  }
  console.log(`[seed] demo users ready (${inserted} inserted, ${DEMO_USERS.length - inserted} already existed)`);
}
