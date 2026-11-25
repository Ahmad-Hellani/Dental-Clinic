import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { pool } from "./config/db";
import treatmentsRoutes from "./features/treatments/treatments.routes";
import dentistsRoutes from "./features/dentists/dentists.routes";
import appointmentsRoutes from "./features/appointments/appointments.routes";
import statsRoutes from "./features/stats/stats.routes";
import { errorHandler, notFoundHandler } from "./shared/middleware/error.middleware";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // behind the Nginx proxy container

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGINS, credentials: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use(express.json({ limit: "100kb" }));

  // Docker Compose healthcheck
  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", service: "backend" });
    } catch {
      res.status(503).json({ status: "unavailable", service: "backend" });
    }
  });

  app.use("/api/treatments", treatmentsRoutes);
  app.use("/api/dentists", dentistsRoutes);
  app.use("/api/appointments", appointmentsRoutes);
  app.use("/api/admin/stats", statsRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler); // must be last

  return app;
}
