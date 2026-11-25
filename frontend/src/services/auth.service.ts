import { http } from "./http";
import type { AuthSession } from "../lib/types";

export type RegisterInput = { fullName: string; email: string; password: string; phone?: string };

export async function login(email: string, password: string): Promise<AuthSession> {
  const res = await http.post<{ data: AuthSession }>("/auth/login", { email, password });
  return res.data.data;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const res = await http.post<{ data: AuthSession }>("/auth/register", input);
  return res.data.data;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}
