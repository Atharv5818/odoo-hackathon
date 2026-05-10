// src/routes/index.js
// Centralized route registration — import this in app.js / server.js.
// Preserves all existing auth/users/itinerary/budget/checklist routes.
// Phase 6 additions: trips (finalized), notes, sharing, activities, public.

import { Router } from "express";

// ─── EXISTING MODULES ─────────────────────────────────────────────────────────
// Replace these imports with your actual Phase 1–5 route files.
import authRouter      from "../modules/auth/auth.routes.js";
import usersRouter     from "../modules/users/users.routes.js";
// import itineraryRouter from "../modules/itinerary/itinerary.routes.js";
// import budgetRouter    from "../modules/budget/budget.routes.js";
// import checklistRouter from "../modules/checklist/checklist.routes.js";

// ─── PHASE 6 MODULES ──────────────────────────────────────────────────────────
import tripsRouter       from "../modules/trips/trips.routes.js";
import publicRouter      from "../modules/sharing/public.routes.js";
import {
  stopActivitiesRouter,
  activityRouter,
}                        from "../modules/activities/activities.routes.js";

const router = Router();

// ─── AUTH / USERS (existing) ──────────────────────────────────────────────────
router.use("/auth",  authRouter);
router.use("/users", usersRouter);

// ─── CORE TRIP RESOURCES ──────────────────────────────────────────────────────
// Trips router already mounts /notes and /shares as nested routes internally.
router.use("/trips", tripsRouter);

// ─── ITINERARY / STOPS (existing) ────────────────────────────────────────────
// router.use("/trips/:tripId/itinerary", itineraryRouter);

// ─── BUDGET / CHECKLIST (existing) ────────────────────────────────────────────
// router.use("/trips/:tripId/budget",    budgetRouter);
// router.use("/trips/:tripId/checklist", checklistRouter);

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────
// Stop-scoped: GET/POST/PATCH-reorder
router.use("/stops/:stopId/activities", stopActivitiesRouter);
// Activity-scoped: PATCH / DELETE
router.use("/activities", activityRouter);

// ─── PUBLIC (unauthenticated) ─────────────────────────────────────────────────
router.use("/public", publicRouter);

export default router;
