import type { Request, RequestHandler } from "express";
import { asyncHandler } from "../async-handler";
import { Errors } from "../app-error";
import { verifyToken } from "../auth-client";
import type { Role } from "../types/user";

function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  return header?.startsWith("Bearer ") ? header.slice(7) : null;
}

/** Requires a valid token. Identity comes from the authentication microservice, never from local DB tables. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  if (!token) throw Errors.unauthorized("Missing or invalid authorization header");
  req.user = await verifyToken(token);
  req.accessToken = token;
  next();
});

/** For public endpoints that behave differently for logged-in users (e.g. admins see inactive items). */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = bearerToken(req);
  if (token) {
    req.user = await verifyToken(token);
    req.accessToken = token;
  }
  next();
});

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
