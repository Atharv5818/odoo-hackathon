// src/config/prisma.js
// Single Prisma client instance shared across the entire application.
// Re-creating PrismaClient on every request opens new DB connections
// and will exhaust your connection pool under load.
//
// NOTE: Both `import prisma from "./config/prisma.js"` (default) and
//       `import { prisma } from "./config/prisma.js"` (named) are supported
//       so modules written in either style work without changes.

import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";

const prisma = new PrismaClient({
  log:
    env.NODE_ENV === "development"
      ? ["query", "warn", "error"]
      : ["warn", "error"],
});

export { prisma };
export default prisma;
