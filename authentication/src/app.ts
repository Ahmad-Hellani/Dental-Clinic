import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { pool } from "./config/db";
import authRoutes from "./features/auth/auth.routes";
import usersRoutes from "./features/users/users.routes";
import { errorHandler, notFoundHandler } from "./shared/middleware/error.middleware";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // we sit behind the Nginx proxy container

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  // Docker Compose healthcheck
  app.get("/api/auth/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", service: "authentication" });
    } catch {
      res.status(503).json({ status: "unavailable", service: "authentication" });
    }
  });

  app.use("/api/auth/users", usersRoutes);
  app.use("/api/auth", authRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler); // must be last

  return app;
}
