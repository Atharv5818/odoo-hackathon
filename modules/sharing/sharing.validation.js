// src/modules/sharing/sharing.validation.js
import { z } from "zod";

export const createShareSchema = z.object({
  // Optional: consumer can pass nothing — slug is server-generated.
  // Future: allow expiry date or custom slugs.
  expiresAt : z.string().datetime().optional(), // ISO datetime string
});
