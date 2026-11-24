import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import type { Request, Response } from "express";

const minutes = (n: number) => n * 60 * 1000;

function tooMany(message: string) {
  return (req: Request, res: Response) => {
    const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
    const retryAfterSeconds = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : 60;
    res.status(429).json({ error: message, code: "RATE_LIMITED", retryAfterSeconds });
  };
}

const common = { standardHeaders: "draft-7", legacyHeaders: false } as const;

// 5 FAILED sign-ins per IP + email every 15 minutes (successful logins are not counted)
export const loginLimiter = rateLimit({
  ...common,
  windowMs: minutes(15),
  limit: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) =>
    `${ipKeyGenerator(req.ip ?? "")}|${String(req.body?.email ?? "").trim().toLowerCase().slice(0, 254)}`,
  handler: tooMany("Too many failed sign-in attempts. Please wait before trying again."),
});

// wider net per IP, against guessing across many emails
export const loginIpLimiter = rateLimit({
  ...common,
  windowMs: minutes(15),
  limit: 100,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  handler: tooMany("Too many failed sign-in attempts from this network. Please wait before trying again."),
});

// stop mass account creation
export const registerLimiter = rateLimit({
  ...common,
  windowMs: minutes(60),
  limit: 20,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""),
  handler: tooMany("Too many registrations from this network. Please try again later."),
});
