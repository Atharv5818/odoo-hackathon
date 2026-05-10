// src/modules/trips/trips.routes.js
import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate }     from "../../middleware/validate.middleware.js";
import {
  createTripSchema,
  updateTripSchema,
  tripListQuerySchema,
} from "./trips.validation.js";
import * as tripsController from "./trips.controller.js";

// Sub-module routers mounted under /:tripId
import notesRouter   from "../notes/notes.routes.js";
import sharesRouter  from "../sharing/sharing.routes.js";

const router = Router();

router.use(authenticate);

// GET    /api/trips          — paginated + filtered list
router.get(
  "/",
  validate(tripListQuerySchema, "query"),
  tripsController.getTrips
);

// POST   /api/trips
router.post("/", validate(createTripSchema), tripsController.createTrip);

// GET    /api/trips/:tripId  — full detail
router.get("/:tripId", tripsController.getTrip);

// PATCH  /api/trips/:tripId
router.patch("/:tripId", validate(updateTripSchema), tripsController.updateTrip);

// DELETE /api/trips/:tripId
router.delete("/:tripId", tripsController.deleteTrip);

// ─── NESTED RESOURCE ROUTERS ──────────────────────────────────────────────────
// Mount notes and shares under trips for RESTful nesting.

// /api/trips/:tripId/notes
router.use("/:tripId/notes", notesRouter);

// /api/trips/:tripId/shares
router.use("/:tripId/shares", sharesRouter);

export default router;
