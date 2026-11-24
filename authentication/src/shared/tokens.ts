import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "./types/user";

export type AccessClaims = { sub: string; email: string; role: Role };

export function signAccessToken(user: { id: string; email: string; role: Role }): string {
  return jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    algorithm: "HS256",
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    algorithm: "HS256",
    expiresIn: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60,
    jwtid: crypto.randomUUID(),
  });
}

/** Throws on invalid / expired tokens. */
export function verifyAccessJwt(token: string): AccessClaims {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || !payload.sub) throw new Error("Malformed token");
  return { sub: payload.sub, email: payload.email, role: payload.role };
}

/** Throws on invalid / expired tokens. Returns the user id. */
export function verifyRefreshJwt(token: string): string {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
  if (typeof payload === "string" || !payload.sub) throw new Error("Malformed token");
  return payload.sub;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
