// src/middleware/rateLimiter.middleware.js
// Different rate limits for different endpoint sensitivity levels.

import rateLimit from "express-rate-limit";
import { sendError } from "../utils/response.js";

// ── Shared response handler ───────────────────────────────────────────────────

const rateLimitHandler = (req, res) => {
  return sendError(res, {
    statusCode: 429,
    message:    "Too many requests. Please try again later.",
  });
};

// ── Global limiter: applies to all routes ────────────────────────────────────
// 100 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  handler:        rateLimitHandler,
});

// ── Auth limiter: stricter, for /api/auth/* ───────────────────────────────────
// 10 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs:              15 * 60 * 1000,
  max:                   10,
  standardHeaders:       true,
  legacyHeaders:         false,
  handler:               rateLimitHandler,
  skipSuccessfulRequests: true,
});

// ── Public content limiter: for unauthenticated read endpoints ────────────────
// 30 requests per minute per IP
export const publicLimiter = rateLimit({
  windowMs:       60 * 1000,
  max:            30,
  standardHeaders: true,
  legacyHeaders:  false,
  handler:        rateLimitHandler,
});
