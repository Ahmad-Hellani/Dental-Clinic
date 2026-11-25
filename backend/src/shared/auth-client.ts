import { z } from "zod";
import { env } from "../config/env";
import { AppError, Errors } from "./app-error";
import { roleSchema } from "./validation";
import type { AuthUser } from "./types/user";

/** All calls to the authentication microservice go through this file (internal Docker network). */

const verifySchema = z.object({
  valid: z.literal(true),
  user: z.object({ id: z.string(), email: z.string(), role: roleSchema, fullName: z.string() }),
});

const dentistUsersSchema = z.object({
  data: z.object({
    items: z.array(z.object({ id: z.string(), fullName: z.string(), email: z.string(), isActive: z.boolean() })),
  }),
});

const unavailable = () => new AppError(503, "AUTH_SERVICE_UNAVAILABLE", "Authentication service is unavailable");

async function callAuth(path: string, token: string): Promise<Response> {
  try {
    return await fetch(`${env.AUTH_SERVICE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(env.AUTH_TIMEOUT_MS),
    });
  } catch (err) {
    console.error("[auth-client] request failed:", (err as Error).message);
    throw unavailable();
  }
}

/** Validates a bearer token with the authentication service (GET /api/auth/verify). */
export async function verifyToken(token: string): Promise<AuthUser> {
  const res = await callAuth("/api/auth/verify", token);
  if (res.status === 401) throw Errors.unauthorized("Invalid or expired token");
  if (!res.ok) throw unavailable();

  const parsed = verifySchema.safeParse(await res.json());
  if (!parsed.success) throw new AppError(502, "AUTH_BAD_RESPONSE", "Unexpected response from authentication service");
  return parsed.data.user;
}

/** Active users with the DENTIST role. Needs an ADMIN token (the auth service enforces it). */
export async function listDentistUsers(adminToken: string) {
  const res = await callAuth("/api/auth/users?role=DENTIST&isActive=true&limit=100", adminToken);
  if (res.status === 401) throw Errors.unauthorized("Invalid or expired token");
  if (res.status === 403) throw Errors.forbidden();
  if (!res.ok) throw unavailable();

  const parsed = dentistUsersSchema.safeParse(await res.json());
  if (!parsed.success) throw new AppError(502, "AUTH_BAD_RESPONSE", "Unexpected response from authentication service");
  return parsed.data.data.items;
}
