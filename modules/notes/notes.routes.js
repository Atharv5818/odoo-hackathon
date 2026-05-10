// src/modules/notes/notes.routes.js
import { Router } from "express";
import { authenticate }               from "../../middleware/auth.middleware.js";
import { validate }                   from "../../middleware/validate.middleware.js";
import { createNoteSchema, updateNoteSchema } from "./notes.validation.js";
import * as notesController           from "./notes.controller.js";

const router = Router({ mergeParams: true }); // mergeParams for :tripId

// All notes routes require authentication
router.use(authenticate);

// GET    /api/trips/:tripId/notes
router.get("/", notesController.getNotes);

// POST   /api/trips/:tripId/notes
router.post("/", validate(createNoteSchema), notesController.createNote);

// PATCH  /api/trips/:tripId/notes/:noteId
router.patch("/:noteId", validate(updateNoteSchema), notesController.updateNote);

// DELETE /api/trips/:tripId/notes/:noteId
router.delete("/:noteId", notesController.deleteNote);

export default router;
