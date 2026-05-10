// src/middleware/validate.middleware.js
// Reusable middleware factory that validates request data against a Zod schema.
// Keeps controllers clean — no validation logic bleeds into them.
//
// Usage:
//   router.post("/signup", validate(signupSchema), authController.signup);
//
// Validates req.body by default.
// Pass { target: "params" } or { target: "query" } for other targets.

import { ZodError } from "zod";
import { sendError } from "../utils/apiResponse.js";

/**
 * @param {import("zod").ZodSchema} schema
 * @param {{ target?: "body" | "params" | "query" }} options
 */
export const validate = (schema, { target = "body" } = {}) => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Format Zod errors into a flat, readable structure
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return sendError(res, {
        statusCode: 422,
        message: "Validation failed",
        errors,
      });
    }

    // Replace req[target] with the parsed (and stripped) data
    // so controllers always get clean, type-safe input
    req[target] = result.data;
    next();
  };
};
