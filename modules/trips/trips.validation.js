// src/modules/trips/trips.validation.js
import { z } from "zod";

const TRIP_STATUSES = ["PLANNING", "UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];

export const createTripSchema = z.object({
  title       : z.string().min(1, "Title is required").max(300),
  destination : z.string().max(300).optional(),
  description : z.string().max(5000).optional(),
  status      : z.enum(TRIP_STATUSES).optional(),
  startDate   : z.string().datetime({ offset: true }).optional(),
  endDate     : z.string().datetime({ offset: true }).optional(),
  currency    : z.string().length(3, "Currency must be a 3-letter ISO code").optional(),
});

export const updateTripSchema = z.object({
  title       : z.string().min(1).max(300).optional(),
  destination : z.string().max(300).optional().nullable(),
  description : z.string().max(5000).optional().nullable(),
  status      : z.enum(TRIP_STATUSES).optional(),
  startDate   : z.string().datetime({ offset: true }).optional().nullable(),
  endDate     : z.string().datetime({ offset: true }).optional().nullable(),
  currency    : z.string().length(3).optional(),
}).refine(
  (d) => Object.keys(d).length > 0,
  { message: "At least one field must be provided" }
);

export const tripListQuerySchema = z.object({
  page        : z.string().optional(),
  limit       : z.string().optional(),
  status      : z.enum(TRIP_STATUSES).optional(),
  destination : z.string().optional(),
  search      : z.string().optional(),
  sortBy      : z.enum(["createdAt", "startDate", "title", "updatedAt"]).optional(),
  sortOrder   : z.enum(["asc", "desc"]).optional(),
  startAfter  : z.string().optional(),
  startBefore : z.string().optional(),
}).optional();
