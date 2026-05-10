// src/lib/prisma.js
// Single Prisma client instance shared across the entire application.
// Re-creating PrismaClient on every request opens new DB connections
// and will exhaust your connection pool under load.

import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});

export default prisma;
