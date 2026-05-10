// src/modules/auth/auth.controller.js
// HTTP layer for authentication.
// Controllers have ONE job: translate HTTP input into service calls,
// and translate service output into HTTP responses.
// No business logic. No DB calls. No validation.

import * as authService from "./auth.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";
import { refreshTokenCookieOptions } from "../../lib/jwt.js";

/**
 * POST /api/auth/signup
 * Creates a new user account and returns an access token.
 * Sets refresh token as an httpOnly cookie.
 */
export const signup = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.signup(req.body);

    // Set refresh token in httpOnly cookie — not in the response body
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());

    return sendSuccess(res, {
      statusCode: 201,
      message: "Account created successfully.",
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err); // Pass to global error handler
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns an access token.
 * Sets refresh token as an httpOnly cookie.
 */
export const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());

    return sendSuccess(res, {
      statusCode: 200,
      message: "Logged in successfully.",
      data: {
        user,
        accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 * Clears the refresh token cookie.
 * Client is responsible for discarding the access token from memory.
 */
export const logout = async (req, res, next) => {
  try {
    await authService.logout();

    // Clear the cookie using the same options it was set with
    // (path must match, otherwise the browser won't delete it)
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      path: "/api/auth",
    });

    return sendSuccess(res, {
      statusCode: 200,
      message: "Logged out successfully.",
    });
  } catch (err) {
    next(err);
  }
};
