// src/lib/jwt.js
// Centralized JWT helpers. All token logic lives here — nowhere else.
// Controllers and services never import jsonwebtoken directly.

import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

/**
 * Generates a short-lived access token.
 * Payload contains only userId — nothing else.
 * Less surface area in the token = less damage if it leaks.
 */
export const generateAccessToken = (userId) => {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    issuer: "traveloop",
  });
};

/**
 * Generates a long-lived refresh token.
 * This is stored in an httpOnly cookie on the client — never in localStorage.
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: "traveloop",
  });
};

/**
 * Verifies an access token and returns the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure —
 * callers are responsible for catching and handling appropriately.
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "traveloop",
  });
};

/**
 * Verifies a refresh token and returns the decoded payload.
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "traveloop",
  });
};

/**
 * Centralized cookie options for the refresh token.
 * httpOnly: JS cannot read this cookie — XSS can't steal it.
 * sameSite: "strict" prevents CSRF reads.
 * secure: only sent over HTTPS in production.
 */
export const refreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/api/auth",                 // Only sent to auth endpoints
});
