// src/modules/users/users.repository.js
// Database layer for the users module.
// This file contains ONLY Prisma queries — no business logic, no error handling,
// no AppError. Services are responsible for interpreting what these results mean.
//
// Convention: every method returns the raw Prisma result (or null if not found).

import { prisma } from "../../config/prisma.js";

// Fields returned for all user queries.
// passwordHash is NEVER selected — it must not leak through any code path.
const USER_SELECT = {
  id:        true,
  email:     true,
  username:  true,
  fullName:  true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
};

/**
 * Find a single user by their primary key.
 *
 * @param {string} id
 * @returns {Promise<User|null>}
 */
export const findUserById = (id) =>
  prisma.user.findUnique({
    where:  { id },
    select: USER_SELECT,
  });

/**
 * Find a single user by username (case-sensitive, as stored).
 * Used for uniqueness checks during profile updates.
 *
 * @param {string} username
 * @returns {Promise<User|null>}
 */
export const findUserByUsername = (username) =>
  prisma.user.findUnique({
    where:  { username },
    select: USER_SELECT,
  });

/**
 * Update a user's profile fields.
 * Only the fields present in `data` are written; Prisma ignores undefined keys.
 *
 * @param {string} id
 * @param {{ username?: string, fullName?: string, avatarUrl?: string }} data
 * @returns {Promise<User>}
 */
export const updateUser = (id, data) =>
  prisma.user.update({
    where:  { id },
    data,
    select: USER_SELECT,
  });

/**
 * Delete a user record by ID.
 * Related records (trips, etc.) must be handled by Prisma cascade rules defined
 * in the schema — this repository does not orchestrate cascades manually.
 *
 * @param {string} id
 * @returns {Promise<{ id: string }>}
 */
export const deleteUser = (id) =>
  prisma.user.delete({
    where:  { id },
    select: { id: true },
  });
