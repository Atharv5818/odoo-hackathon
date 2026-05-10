// src/modules/auth/auth.repository.js
// Data access layer for the auth module.
// Services call repository methods — never Prisma directly.

import prisma from "../../config/prisma.js";

/**
 * Find a user by their email address.
 * Returns null if not found.
 */
export const findUserByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

/**
 * Find a user by their username.
 * Returns null if not found.
 */
export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({ where: { username } });
};

/**
 * Find a user by their ID.
 * Returns only the id field — used by auth middleware for existence checks.
 */
export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where:  { id },
    select: { id: true },
  });
};

/**
 * Create a new user record.
 */
export const createUser = async ({ email, username, passwordHash, fullName }) => {
  return prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      fullName: fullName ?? null,
    },
  });
};
