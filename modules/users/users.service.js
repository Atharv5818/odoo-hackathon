// src/modules/users/users.service.js
// Business logic for the users module.
//
// Rules enforced here:
//  - Ownership: users can only read/mutate their own profile.
//  - Username uniqueness: a new username must not already belong to another user.
//  - Sanitization: trimming is handled by Zod schemas upstream; the service
//    receives already-clean data and focuses on semantic validation only.
//
// This layer never imports Prisma directly — all DB access goes through the
// repository, keeping concerns cleanly separated.

import { AppError }         from "../../utils/AppError.js";
import { assertExists }     from "../../utils/ownership.js";
import * as usersRepo       from "./users.repository.js";

// ---------------------------------------------------------------------------
// getMe
// ---------------------------------------------------------------------------

/**
 * Return the authenticated user's own profile.
 *
 * The repository already excludes passwordHash via its SELECT projection,
 * so we can return the result directly without further sanitization.
 *
 * @param {string} userId  - req.user.id injected by requireAuth middleware
 * @returns {Promise<User>}
 */
export const getMe = async (userId) => {
  const user = await usersRepo.findUserById(userId);

  // This should rarely fire in practice (the JWT references a real user),
  // but guards against stale tokens after account deletion.
  assertExists(user, "User");

  return user;
};

// ---------------------------------------------------------------------------
// updateMe
// ---------------------------------------------------------------------------

/**
 * Update the authenticated user's profile.
 *
 * Ownership is implicitly enforced: we only ever look up and update the user
 * identified by userId (from the verified JWT), so a user can never touch
 * another user's record through this service.
 *
 * @param {string} userId
 * @param {{ username?: string, fullName?: string, avatarUrl?: string }} data
 *   Already validated and stripped by Zod (updateUserSchema).
 * @returns {Promise<User>}
 */
export const updateMe = async (userId, data) => {
  // 1. Confirm the requesting user still exists.
  const existingUser = await usersRepo.findUserById(userId);
  assertExists(existingUser, "User");

  // 2. If a new username is requested, ensure it isn't already taken.
  if (data.username && data.username !== existingUser.username) {
    const conflict = await usersRepo.findUserByUsername(data.username);

    if (conflict) {
      // 409 Conflict — semantically more accurate than 400 for a uniqueness
      // violation that the client can resolve by choosing a different value.
      throw AppError.conflict("Username is already taken.");
    }
  }

  // 3. Persist and return the updated profile.
  const updatedUser = await usersRepo.updateUser(userId, data);
  return updatedUser;
};

// ---------------------------------------------------------------------------
// deleteMe
// ---------------------------------------------------------------------------

/**
 * Permanently delete the authenticated user's account.
 *
 * Cascade behaviour (trips, participants, etc.) is defined at the Prisma schema
 * level using `onDelete: Cascade`. The service intentionally delegates that
 * responsibility to the schema rather than orchestrating it manually, ensuring
 * referential integrity is DB-enforced.
 *
 * @param {string} userId
 * @returns {Promise<void>}
 */
export const deleteMe = async (userId) => {
  // Verify the user exists before attempting deletion.
  const user = await usersRepo.findUserById(userId);
  assertExists(user, "User");

  await usersRepo.deleteUser(userId);
};
