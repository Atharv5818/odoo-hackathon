// src/utils/slugify.js
// Generates URL-safe slugs for shared trip links.
// FIX: Unified from two separate slugify files with different exported function names.

import { randomBytes } from "crypto";

/**
 * Convert a string into a URL-safe slug.
 * e.g. "My Trip to Japan! 2025" → "my-trip-to-japan-2025"
 *
 * @param {string} str
 */
export function slugify(str = "") {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")   // remove non-word chars (keep hyphens)
    .replace(/[\s_]+/g, "-")    // spaces/underscores → hyphen
    .replace(/-+/g, "-")        // collapse multiple hyphens
    .slice(0, 60);              // cap length
}

// Alias used by phase1,2 code
export const slugifyText = slugify;

/**
 * Generate a unique, collision-resistant share slug.
 * Format: <slugified-title>-<6-char random suffix>
 *
 * @param {string} title - trip title used as human-readable prefix
 */
export function generateShareSlug(title = "trip") {
  const base   = slugify(title) || "trip";
  const suffix = randomBytes(4).toString("hex").slice(0, 6);
  return `${base}-${suffix}`;
}

// Aliases used by phase1,2 code
export const generateSlug      = generateShareSlug;
export const generateTripSlug  = generateShareSlug;
