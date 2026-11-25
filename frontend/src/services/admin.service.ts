import { http } from "./http";
import type { Paginated, Role, Stats, User } from "../lib/types";

export async function getStats(): Promise<Stats> {
  const res = await http.get<{ data: Stats }>("/admin/stats");
  return res.data.data;
}

export async function listUsers(params: { search?: string; role?: Role | ""; page?: number; limit?: number }): Promise<Paginated<User>> {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));
  const res = await http.get<{ data: Paginated<User> }>("/auth/users", { params: clean });
  return res.data.data;
}

export type NewUserInput = { fullName: string; email: string; password: string; phone?: string; role: Role };

export async function createUser(input: NewUserInput): Promise<User> {
  const res = await http.post<{ data: { user: User } }>("/auth/users", input);
  return res.data.data.user;
}

export async function updateUser(id: string, patch: { role?: Role; isActive?: boolean }): Promise<User> {
  const res = await http.patch<{ data: { user: User } }>(`/auth/users/${id}`, patch);
  return res.data.data.user;
}
