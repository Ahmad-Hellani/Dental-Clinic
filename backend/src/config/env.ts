import { z } from "zod";

const boolString = z.enum(["true", "false"]).transform((v) => v === "true");

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4002),

  DB_HOST: z.string().min(1).default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // internal Docker-network address of the authentication microservice
  AUTH_SERVICE_URL: z.string().url().default("http://authentication:4001"),
  AUTH_TIMEOUT_MS: z.coerce.number().int().positive().default(5000),

  // "today" and "now" for slot calculation are evaluated in the clinic's timezone
  CLINIC_TIMEZONE: z.string().min(1).default("Asia/Beirut"),

  SEED_DEMO_DATA: boolString.default("true"),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:8080,http://localhost:5173")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
