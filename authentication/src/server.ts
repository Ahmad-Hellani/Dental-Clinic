import { env } from "./config/env";
import { pool, waitForDb } from "./config/db";
import { runMigrations } from "./config/migrate";
import { seedDemoUsers } from "./config/seed";
import { createApp } from "./app";

async function main() {
  await waitForDb();
  await runMigrations();
  if (env.SEED_DEMO_DATA) await seedDemoUsers();

  const server = createApp().listen(env.PORT, () => {
    console.log(`[authentication] listening on :${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    console.log(`[authentication] ${signal} received, shutting down`);
    server.close(() => {
      pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  console.error("[authentication] failed to start:", err);
  process.exit(1);
});
