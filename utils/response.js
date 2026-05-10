// src/utils/response.js
// Unified API response helpers.
// All successful and error responses go through these functions.
// This ensures a consistent shape: { success, message, data }
//
// FIX: Previously split between apiResponse.js and response.js causing import errors.
// This single file supports all call signatures used across phases 3-6.
//
// Supported call signatures:
//   sendSuccess(res, data, message, statusCode)     — Phase 4/5/6 style
//   sendSuccess(res, { statusCode, message, data }) — Phase 3 style

/**
 * Sends a successful JSON response.
 *
 * @param {import("express").Response} res
 * @param {any} data
 * @param {string} message
 * @param {number} statusCode
 */
export const sendSuccess = (res, data, message = "Success", statusCode = 200) => {
  // Support Phase 3 call signature: sendSuccess(res, { statusCode, message, data })
  if (
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    ("statusCode" in data || "message" in data) &&
    !("trip" in data) &&
    !("user" in data) &&
    !("trips" in data) &&
    !("notes" in data) &&
    !("shares" in data) &&
    !("activities" in data) &&
    !("pagination" in data) &&
    !("data" in data) &&
    !("deleted" in data) &&
    !("share" in data) &&
    !("shareUrl" in data) &&
    !("note" in data) &&
    !("activity" in data)
  ) {
    const opts = data;
    statusCode = opts.statusCode ?? 200;
    message    = opts.message   ?? "Success";
    data       = opts.data      ?? null;
  }

  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Sends an error JSON response.
 *
 * @param {import("express").Response} res
 * @param {{ statusCode?: number, message?: string, errors?: any }} options
 */
export const sendError = (
  res,
  { statusCode = 500, message = "Internal server error", errors = null } = {}
) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};
