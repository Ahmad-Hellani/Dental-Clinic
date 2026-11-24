export type Role = "PATIENT" | "DENTIST" | "ADMIN";

/** Row shape of the `users` table */
export type UserRow = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
};

/** Safe-to-return user (never includes the password hash) */
export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
};

/** What the `authenticate` middleware attaches to req.user */
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
};

export function toPublicUser(u: UserRow): PublicUser {
  return {
    id: u.id,
    fullName: u.full_name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isActive: u.is_active,
    createdAt: u.created_at,
  };
}
