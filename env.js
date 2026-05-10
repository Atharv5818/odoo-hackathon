// src/config/env.js
// Validates all required environment variables at startup.
// If anything is missing or malformed, the process exits immediately.

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  PORT: z.coerce.number().int().positive().default(3000),

  CLIENT_ORIGIN: z
    .string()
    .url("CLIENT_ORIGIN must be a valid URL")
    .default("http://localhost:5173"),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:\n");
  parsed.error.issues.forEach((issue) => {
    console.error(`  [${issue.path.join(".")}] → ${issue.message}`);
  });
  process.exit(1);
}

export const env = parsed.data;
