export type Role = "PATIENT" | "DENTIST" | "ADMIN";

/** Identity returned by the authentication service's /verify endpoint */
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  fullName: string;
};
