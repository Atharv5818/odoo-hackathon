// src/utils/ownership.js
// Reusable ownership validation helpers.
// Every mutating operation on a user-owned resource must verify
// that req.user.id matches the resource's owner before proceeding.

import { AppError } from "./AppError.js";

/**
 * Throws AppError.notFound if the resource is null/undefined.
 *
 * @param {any}    resource     - The fetched resource (null if not found)
 * @param {string} resourceName - Human-readable name for error messages (e.g. "Trip")
 */
export const assertExists = (resource, resourceName = "Resource") => {
  if (!resource) {
    throw AppError.notFound(`${resourceName} not found.`);
  }
};

/**
 * Throws AppError.forbidden if the resource owner doesn't match the requesting user.
 * Always call assertExists before assertOwnership.
 *
 * @param {string} ownerId          - The userId stored on the resource
 * @param {string} requestingUserId - The userId from req.user.id
 * @param {string} resourceName     - Human-readable name for error messages
 */
export const assertOwnership = (ownerId, requestingUserId, resourceName = "Resource") => {
  if (ownerId !== requestingUserId) {
    throw AppError.forbidden(`You do not have permission to modify this ${resourceName}.`);
  }
};

/**
 * Convenience: assertExists + assertOwnership in one call.
 */
export const assertExistsAndOwned = (resource, ownerId, requestingUserId, resourceName = "Resource") => {
  assertExists(resource, resourceName);
  assertOwnership(ownerId, requestingUserId, resourceName);
};
