// src/modules/activities/activities.validation.js
import { z } from "zod";

export const createActivitySchema = z.object({
  title      : z.string().min(1, "Title is required").max(300, "Title too long"),
  notes      : z.string().max(5000, "Notes too long").optional(),
  cost       : z.number().positive("Cost must be a positive number").optional(),
  bookingUrl : z.string().url("bookingUrl must be a valid URL").optional(),
  order      : z.number().int().nonnegative().optional(),
});

export const updateActivitySchema = z.object({
  title      : z.string().min(1, "Title cannot be empty").max(300).optional(),
  notes      : z.string().max(5000).optional().nullable(),
  cost       : z.number().positive("Cost must be a positive number").optional().nullable(),
  bookingUrl : z.string().url("bookingUrl must be a valid URL").optional().nullable(),
  order      : z.number().int().nonnegative().optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: "At least one field must be provided" }
);

export const reorderActivitiesSchema = z.object({
  // Array of { id, order } pairs
  activities: z.array(
    z.object({
      id    : z.string().uuid(),
      order : z.number().int().nonnegative(),
    })
  ).min(1, "At least one activity required"),
});
