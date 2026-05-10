// src/modules/users/users.routes.js
// Route definitions for the users module.
//
// Every route here is protected by requireAuth — there are no public user
// endpoints. Validation middleware runs after auth so we don't spend time
// validating bodies for unauthenticated requests.
//
// Route shape:
//   requireAuth → [validate(schema)] → controller

import { Router }          from "express";
import { requireAuth }     from "../../middleware/auth.middleware.js";
import { validate }        from "../../middleware/validate.middleware.js";
import { updateUserSchema } from "./users.validation.js";
import * as usersController from "./users.controller.js";

const router = Router();

// All routes in this module require authentication.
// Applying requireAuth at the router level avoids repeating it per-route
// and makes it impossible to accidentally expose a route without auth.
router.use(requireAuth);

// ---------------------------------------------------------------------------
// GET /api/users/me
// No request body → no validation schema needed.
// ---------------------------------------------------------------------------
router.get("/me", usersController.getMe);

// ---------------------------------------------------------------------------
// PATCH /api/users/me
// Validates and strips the request body before the controller runs.
// ---------------------------------------------------------------------------
router.patch("/me", validate(updateUserSchema), usersController.updateMe);

// ---------------------------------------------------------------------------
// DELETE /api/users/me
// No request body → no validation schema needed.
// ---------------------------------------------------------------------------
router.delete("/me", usersController.deleteMe);

export default router;
