// src/modules/auth/auth.service.js
// Business logic for authentication.
// This layer knows nothing about HTTP — no req, no res.
// It receives plain data, talks to Prisma, and returns plain data or throws AppError.

import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { generateAccessToken, generateRefreshToken } from "../../lib/jwt.js";
import { AppError } from "../../utils/AppError.js";
import { env } from "../../config/env.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strips the password hash before returning user data to any caller.
 * passwordHash must NEVER leave the service layer.
 */
const sanitizeUser = (user) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

/**
 * Generates both tokens in one call.
 * Access token → returned in response body (short-lived, client stores in memory).
 * Refresh token → set as httpOnly cookie by the controller (long-lived, not in body).
 */
const issueTokens = (userId) => ({
  accessToken: generateAccessToken(userId),
  refreshToken: generateRefreshToken(userId),
});

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Registers a new user.
 *
 * Checks for duplicate email and username independently so the error
 * message is specific — generic "already exists" errors force users
 * to guess which field is conflicting.
 *
 * @param {{ email: string, username: string, password: string, fullName?: string }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const signup = async ({ email, username, password, fullName }) => {
  // Check email uniqueness before hashing (hashing is expensive — don't waste it)
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw AppError.conflict("An account with this email already exists.");
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    throw AppError.conflict("This username is already taken.");
  }

  // Hash password. Cost factor comes from env (default 12).
  // Never hard-code the rounds — it needs to be tunable as hardware improves.
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      fullName: fullName ?? null,
    },
  });

  const { accessToken, refreshToken } = issueTokens(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Authenticates an existing user.
 *
 * IMPORTANT: The error message for wrong credentials is intentionally vague.
 * Saying "email not found" vs "wrong password" lets attackers enumerate accounts.
 * Always return the same message for both cases.
 *
 * @param {{ email: string, password: string }} data
 * @returns {{ user: object, accessToken: string, refreshToken: string }}
 */
export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Use constant-time comparison regardless of whether user exists.
  // If user doesn't exist, we still call bcrypt.compare against a dummy hash
  // to prevent timing attacks that would reveal whether the email is registered.
  const DUMMY_HASH = "$2a$12$invalidhashfortimingprotectiononly.............";
  const hashToCompare = user ? user.passwordHash : DUMMY_HASH;

  const isPasswordValid = await bcrypt.compare(password, hashToCompare);

  if (!user || !isPasswordValid) {
    throw AppError.unauthorized("Invalid email or password.");
  }

  const { accessToken, refreshToken } = issueTokens(user.id);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

/**
 * Logs out a user.
 * With stateless JWTs there's nothing to delete server-side.
 * The controller clears the httpOnly cookie.
 * This function exists as a named placeholder — if you later add a
 * token blocklist (Redis), the logic goes here, not in the controller.
 */
export const logout = async () => {
  // Future: add refreshToken to a Redis blocklist here
  return true;
};
