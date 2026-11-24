import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env";
import { REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH } from "../../config/constants";
import { asyncHandler } from "../../shared/async-handler";
import { Errors } from "../../shared/app-error";
import { authService, type Session } from "./auth.service";

// Base options (also used for clearing: Express 4 ignores `expires` if maxAge is passed to clearCookie)
const baseCookie: CookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: "lax",
  path: REFRESH_COOKIE_PATH,
};

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...baseCookie,
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function sendSession(res: Response, status: number, session: Session) {
  setRefreshCookie(res, session.refreshToken);
  res.status(status).json({ data: { accessToken: session.accessToken, user: session.user } });
}

const readRefreshCookie = (req: Request): string | undefined => req.cookies?.[REFRESH_COOKIE_NAME];

export const register = asyncHandler(async (req, res) => {
  sendSession(res, 201, await authService.register(req.body));
});

export const login = asyncHandler(async (req, res) => {
  sendSession(res, 200, await authService.login(req.body));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    sendSession(res, 200, await authService.refresh(readRefreshCookie(req)));
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE_NAME, baseCookie);
    throw err;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshCookie(req));
  res.clearCookie(REFRESH_COOKIE_NAME, baseCookie);
  res.status(200).json({ message: "Logged out successfully" });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  res.json({ data: { user: await authService.getProfile(req.user.id) } });
});

/** Internal endpoint: the clinic backend calls this to authenticate requests. */
export const verify = asyncHandler(async (req, res) => {
  if (!req.user) throw Errors.unauthorized();
  const { id, email, role, fullName } = req.user;
  res.json({ valid: true, user: { id, email, role, fullName } });
});
