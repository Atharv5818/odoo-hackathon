// src/modules/users/users.validation.js
// Zod validation schemas for the users module.
// Only fields explicitly listed here are accepted — unknown fields are stripped
// by Zod's .strip() (the default for z.object), so no extra sanitization needed
// in the service layer.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Reusable field definitions
// Keeping these as standalone consts makes them easy to compose and test.
// ---------------------------------------------------------------------------

const usernameField = z
  .string()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be at most 30 characters.")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers, and underscores."
  )
  .transform((val) => val.trim());

const fullNameField = z
  .string()
  .max(100, "Full name must be at most 100 characters.")
  .transform((val) => val.trim());

const avatarUrlField = z
  .string()
  .url("Avatar URL must be a valid URL.");

// ---------------------------------------------------------------------------
// PATCH /api/users/me
// All fields optional — client may update any subset.
// At least one field is required to avoid no-op requests.
// ---------------------------------------------------------------------------

export const updateUserSchema = z
  .object({
    username:  usernameField.optional(),
    fullName:  fullNameField.optional(),
    avatarUrl: avatarUrlField.optional(),
  })
  .strict() // reject unknown keys with a validation error instead of silently stripping
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field must be provided for update." }
  );
