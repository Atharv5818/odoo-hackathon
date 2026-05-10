// src/middleware/errorHandler.middleware.js
// Express requires 4-parameter middleware to be recognized as an error handler.
// This is the single place in the app where errors are turned into responses.

import { AppError } from "../utils/AppError.js";
import { sendError } from "../utils/response.js";
import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
  // ── Known operational errors (thrown deliberately via AppError) ──────────
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message:    err.message,
      errors:     err.errors,
    });
  }

  // ── Prisma unique constraint violation ───────────────────────────────────
  // Prisma error code P2002 = unique constraint failed
  if (err?.code === "P2002") {
    const field = err.meta?.target?.[0] ?? "field";
    return sendError(res, {
      statusCode: 409,
      message:    `A record with this ${field} already exists.`,
    });
  }

  // ── Prisma record not found ──────────────────────────────────────────────
  // Prisma error code P2025 = record not found (e.g., update/delete on missing row)
  if (err?.code === "P2025") {
    return sendError(res, {
      statusCode: 404,
      message:    "Record not found.",
    });
  }

  // ── JWT errors ───────────────────────────────────────────────────────────
  if (err?.name === "JsonWebTokenError") {
    return sendError(res, { statusCode: 401, message: "Invalid token." });
  }

  if (err?.name === "TokenExpiredError") {
    return sendError(res, { statusCode: 401, message: "Token has expired." });
  }

  // ── Unexpected errors ────────────────────────────────────────────────────
  // Never leak internal details in production.
  console.error("Unhandled error:", err);

  return sendError(res, {
    statusCode: 500,
    message:    "An unexpected error occurred.",
    errors:     env.NODE_ENV === "development" ? err.message : null,
  });
};
