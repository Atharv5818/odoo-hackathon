// src/modules/auth/auth.validation.js
// Zod schemas for all auth request bodies.
// These are the single source of truth for what auth endpoints accept.
// If a field isn't in the schema, Zod strips it — no extra fields reach the service.

import { z } from "zod";

// ─── Reusable field definitions ───────────────────────────────────────────────

const emailField = z
  .string({ required_error: "Email is required" })
  .trim()
  .toLowerCase()
  .email("Please provide a valid email address");

const passwordField = z
  .string({ required_error: "Password is required" })
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password cannot exceed 72 characters") // bcrypt silently truncates at 72 bytes
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const usernameField = z
  .string({ required_error: "Username is required" })
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username cannot exceed 30 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  );

// ─── Schemas ──────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: emailField,
  username: usernameField,
  password: passwordField,
  fullName: z
    .string()
    .trim()
    .max(100, "Full name cannot exceed 100 characters")
    .optional(),
});

export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required"),
});
