// src/middleware/validate.middleware.js
// Reusable middleware factory that validates request data against a Zod schema.
// Keeps controllers clean — no validation logic bleeds into them.
//
// Usage:
//   router.post("/signup", validate(signupSchema), authController.signup);
//   router.get("/", validate(querySchema, "query"), controller.list);
//
// FIX: Phase 5/6 routes imported from "validate.js" (missing .middleware).
//      This file is canonical. validate.js is a thin re-export.

import { ZodError } from "zod";
import { sendError } from "../utils/response.js";

/**
 * @param {import("zod").ZodSchema} schema
 * @param {"body" | "params" | "query"} target
 */
export const validate = (schema, target = "body") => {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field:   issue.path.join("."),
        message: issue.message,
      }));

      return sendError(res, {
        statusCode: 422,
        message:    "Validation failed",
        errors,
      });
    }

    // Replace req[target] with the parsed (and stripped) data
    req[target] = result.data;
    next();
  };
};
