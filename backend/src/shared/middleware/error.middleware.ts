import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { AppError } from "../app-error";

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Route not found"));
};

// Express identifies error handlers by their 4-argument signature
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.message, code: err.code, details: err.details });
    return;
  }

  // malformed JSON body etc. from body-parser
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: "Invalid request", code: "BAD_REQUEST" });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error", code: "INTERNAL_ERROR" });
};
