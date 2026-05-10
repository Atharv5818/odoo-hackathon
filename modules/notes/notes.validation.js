// src/modules/notes/notes.validation.js
import { z } from "zod";

export const createNoteSchema = z.object({
  title   : z.string().max(200, "Title must be 200 characters or fewer").optional(),
  content : z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be 10,000 characters or fewer"),
});

export const updateNoteSchema = z.object({
  title   : z.string().max(200, "Title must be 200 characters or fewer").optional(),
  content : z.string()
    .min(1, "Content cannot be empty")
    .max(10000, "Content must be 10,000 characters or fewer")
    .optional(),
}).refine(
  (data) => data.title !== undefined || data.content !== undefined,
  { message: "At least one of title or content must be provided" }
);
