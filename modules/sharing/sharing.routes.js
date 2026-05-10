// src/modules/sharing/sharing.routes.js
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createShareSchema } from "./sharing.validation.js";
import * as sharingController from "./sharing.controller.js";

const router = Router({ mergeParams: true }); // mergeParams for :tripId

router.use(authenticate);

// GET    /api/trips/:tripId/shares
router.get("/", sharingController.getShares);

// POST   /api/trips/:tripId/shares
router.post("/", validate(createShareSchema), sharingController.createShare);

// DELETE /api/trips/:tripId/shares/:shareId
router.delete("/:shareId", sharingController.deleteShare);

export default router;
