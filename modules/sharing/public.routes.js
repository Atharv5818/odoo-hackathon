// src/modules/sharing/public.routes.js
// These routes are intentionally unauthenticated — public read-only access.
import { Router }             from "express";
import { getPublicTrip }      from "./sharing.controller.js";

const router = Router();

// GET /api/public/:slug
// Read-only public view of a shared trip itinerary.
router.get("/:slug", getPublicTrip);

export default router;
