// src/app.js
// Express application bootstrap.
// Initializes middleware, mounts the central route registry, and attaches the error handler.
// app.js does NOT start the server — that's server.js.
// This separation makes the app importable for testing without binding a port.

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env.js";
import { globalLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import routes from "./routes/index.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// Helmet sets a dozen security-related HTTP headers in one call.
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
// Limit body size to 10kb. Prevents simple DoS via oversized payloads.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Global rate limiting ──────────────────────────────────────────────────────
app.use(globalLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
// Unauthenticated, not rate-limited — used by load balancers and uptime monitors.
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// All module routes are centrally managed in src/routes/index.js.
// New modules only require changes there — app.js stays stable.
app.use("/api", routes);

// ── 404 handler ───────────────────────────────────────────────────────────────
// Catches any request that didn't match a route above.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

// ── Global error handler ──────────────────────────────────────────────────────
// MUST be last. Express identifies error handlers by their 4-parameter signature.
app.use(errorHandler);

export default app;
