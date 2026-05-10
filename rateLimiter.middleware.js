// src/middleware/rateLimiter.middleware.js
// Different rate limits for different endpoint sensitivity levels.
// Auth endpoints are tighter — they're the primary target for brute force.

import rateLimit from "express-rate-limit";
import { sendError } from "../utils/apiResponse.js";

// ── Shared response handler ───────────────────────────────────────────────────

const rateLimitHandler = (req, res) => {
  return sendError(res, {
    statusCode: 429,
    message: "Too many requests. Please try again later.",
  });
};

// ── Global limiter: applies to all routes ────────────────────────────────────
// 100 requests per minute per IP
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,   // Sends RateLimit-* headers (RFC 6585)
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ── Auth limiter: stricter, for /api/auth/* ───────────────────────────────────
// 10 requests per 15 minutes per IP
// This makes brute-forcing a password take days instead of seconds.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  // Skip successful requests — only count failures against the limit
  skipSuccessfulRequests: true,
});

// ── Public content limiter: for unauthenticated read endpoints ────────────────
// 30 requests per minute per IP
export const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
