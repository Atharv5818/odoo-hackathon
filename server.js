// src/server.js
// Entry point. Starts the HTTP server.
// Kept separate from app.js so the Express app can be imported in tests
// without actually binding a port.

import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";

const server = app.listen(env.PORT, () => {
  console.log(`✅ Traveloop API running on port ${env.PORT} [${env.NODE_ENV}]`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
// On SIGTERM or SIGINT: stop accepting new connections,
// wait for in-flight requests to finish, then disconnect from DB.
// Without this, a rolling deploy can drop in-flight requests.

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log("HTTP server closed.");

    await prisma.$disconnect();
    console.log("Database connection closed.");

    process.exit(0);
  });

  // Force exit if graceful shutdown takes longer than 10 seconds
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// ── Unhandled rejections ──────────────────────────────────────────────────────
// Log and exit — never silently swallow unhandled promise rejections.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});
