// src/utils/AppError.js
// Custom error class used throughout the service layer.
// Throwing AppError lets the global error handler distinguish
// "expected" errors (validation, not found, unauthorized) from
// unexpected crashes, and respond correctly to each.

export class AppError extends Error {
  /**
   * @param {string} message  - Error message returned to the client
   * @param {number} statusCode - HTTP status code
   * @param {any}    errors   - Optional validation error details
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = errors;
    // Preserves correct stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Named constructors for common cases ─────────────────────────────────

  static badRequest(message = "Bad request", errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403);
  }

  static notFound(message = "Resource not found") {
    return new AppError(message, 404);
  }

  static conflict(message = "Conflict") {
    return new AppError(message, 409);
  }

  static internal(message = "Internal server error") {
    return new AppError(message, 500);
  }
}
