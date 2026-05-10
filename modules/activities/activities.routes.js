// src/modules/activities/activities.routes.js
import { Router }       from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate }     from "../../middleware/validate.middleware.js";
import {
  createActivitySchema,
  updateActivitySchema,
  reorderActivitiesSchema,
} from "./activities.validation.js";
import * as activitiesController from "./activities.controller.js";

// ─── STOP-SCOPED ROUTES (/api/stops/:stopId/activities) ───────────────────────
export const stopActivitiesRouter = Router({ mergeParams: true });

stopActivitiesRouter.use(authenticate);

// GET    /api/stops/:stopId/activities
stopActivitiesRouter.get("/", activitiesController.getActivities);

// POST   /api/stops/:stopId/activities
stopActivitiesRouter.post(
  "/",
  validate(createActivitySchema),
  activitiesController.createActivity
);

// PATCH  /api/stops/:stopId/activities/reorder
stopActivitiesRouter.patch(
  "/reorder",
  validate(reorderActivitiesSchema),
  activitiesController.reorderActivities
);

// ─── ACTIVITY-SCOPED ROUTES (/api/activities/:activityId) ─────────────────────
export const activityRouter = Router({ mergeParams: true });

activityRouter.use(authenticate);

// PATCH  /api/activities/:activityId
activityRouter.patch(
  "/:activityId",
  validate(updateActivitySchema),
  activitiesController.updateActivity
);

// DELETE /api/activities/:activityId
activityRouter.delete("/:activityId", activitiesController.deleteActivity);
