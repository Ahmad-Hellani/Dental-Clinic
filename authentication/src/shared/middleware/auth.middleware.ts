import type { RequestHandler } from "express";
import { asyncHandler } from "../async-handler";
import { Errors } from "../app-error";
import type { Role } from "../types/user";
import { authService } from "../../features/auth/auth.service";

/** Requires `Authorization: Bearer <accessToken>`; loads the fresh user from the DB. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw Errors.unauthorized("Missing or invalid authorization header");
  }
  req.user = await authService.verifyAccessToken(header.slice(7));
  next();
});

export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(Errors.unauthorized());
    if (!roles.includes(req.user.role)) return next(Errors.forbidden());
    next();
  };
