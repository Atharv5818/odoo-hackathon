// src/modules/auth/auth.routes.js
// Route definitions for the auth module.
// Order matters: middleware runs left-to-right.
// validate() runs BEFORE the controller — bad input never reaches the service.

import { Router } from "express";
import { validate } from "../../middleware/validate.middleware.js";
import { signupSchema, loginSchema } from "./auth.validation.js";
import * as authController from "./auth.controller.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), authController.signup);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/logout
router.post("/logout", authController.logout);

export default router;
