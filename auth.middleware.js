// src/middleware/auth.middleware.js
// Verifies the JWT access token on every protected route.
// Attaches the authenticated user's ID to req.user.
// Controllers and services read from req.user — they don't re-verify tokens.

import { verifyAccessToken } from "../lib/jwt.js";
import { AppError } from "../utils/AppError.js";
import prisma from "../lib/prisma.js";

/**
 * Protects a route by requiring a valid JWT access token.
 *
 * Expected header: Authorization: Bearer <access_token>
 *
 * On success: sets req.user = { id: string } and calls next()
 * On failure: throws AppError.unauthorized() which the error handler catches
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Authorization header missing or malformed.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw AppError.unauthorized("Access token is missing.");
    }

    // Verifies signature and expiry. Throws if invalid.
    const payload = verifyAccessToken(token);

    // Minimal DB check: verify the user still exists.
    // This handles the case where an account was deleted after a token was issued.
    // If this becomes a performance bottleneck at scale, move to Redis
    // and store a "user version" counter in the token payload instead.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true }, // Only fetch what we need
    });

    if (!user) {
      throw AppError.unauthorized("Account not found.");
    }

    // Attach minimal user context to the request
    req.user = { id: user.id };

    next();
  } catch (err) {
    next(err);
  }
};
