// src/app.js
// Express application bootstrap.
// Initializes middleware, mounts routes, and attaches the error handler.
// app.js does NOT start the server — that's server.js.
// This separation makes the app importable for testing without binding a port.

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";

import { env } from "./config/env.js";
import { globalLimiter, authLimiter } from "./middleware/rateLimiter.middleware.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";

// ── Route imports (will grow as modules are added) ────────────────────────────
import authRoutes from "./modules/auth/auth.routes.js";

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
// Helmet sets a dozen security-related HTTP headers in one call.
// For an API-only server, the defaults are sensible.
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,         // Required for httpOnly cookies to be sent cross-origin
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
// Limit body size to 10kb for regular endpoints.
// Prevents simple DoS via oversized payloads.
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
// Auth routes get their own stricter rate limiter
app.use("/api/auth", authLimiter, authRoutes);

// Future modules will be mounted here:
// app.use("/api/users", requireAuth, userRoutes);
// app.use("/api/trips", requireAuth, tripRoutes);
// app.use("/api/public", publicLimiter, publicRoutes);

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
