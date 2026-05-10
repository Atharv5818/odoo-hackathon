// src/modules/users/users.controller.js
// HTTP layer for the users module.
//
// Responsibilities:
//  - Extract inputs from the request (params, body, req.user).
//  - Call the appropriate service method.
//  - Return a structured HTTP response via sendSuccess / sendError.
//
// This file contains ZERO business logic. No validation, no ownership checks,
// no DB calls. If you find yourself writing an `if` that isn't about the HTTP
// response shape, it belongs in the service layer.

import { asyncHandler } from "../../utils/asyncHandler.js";
import { sendSuccess }  from "../../utils/response.js";
import * as usersService from "./users.service.js";

// ---------------------------------------------------------------------------
// GET /api/users/me
// ---------------------------------------------------------------------------

/**
 * Return the authenticated user's own profile.
 * req.user is guaranteed to be populated by requireAuth before this runs.
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await usersService.getMe(req.user.id);

  sendSuccess(res, { user }, "Profile retrieved successfully.");
});

// ---------------------------------------------------------------------------
// PATCH /api/users/me
// ---------------------------------------------------------------------------

/**
 * Update the authenticated user's profile.
 * req.body has already been validated and stripped by validate(updateUserSchema).
 */
export const updateMe = asyncHandler(async (req, res) => {
  const updatedUser = await usersService.updateMe(req.user.id, req.body);

  sendSuccess(res, { user: updatedUser }, "Profile updated successfully.");
});

// ---------------------------------------------------------------------------
// DELETE /api/users/me
// ---------------------------------------------------------------------------

/**
 * Permanently delete the authenticated user's account.
 * Returns 200 (not 204) to stay consistent with the project's sendSuccess
 * response envelope — the client receives a confirmation message.
 */
export const deleteMe = asyncHandler(async (req, res) => {
  await usersService.deleteMe(req.user.id);

  sendSuccess(res, null, "Account deleted successfully.");
});
