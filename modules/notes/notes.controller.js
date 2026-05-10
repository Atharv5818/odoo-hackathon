// src/modules/notes/notes.controller.js
import * as notesService from "./notes.service.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { asyncHandler }           from "../../utils/asyncHandler.js";

export const getNotes = asyncHandler(async (req, res) => {
  const { tripId }  = req.params;
  const userId      = req.user.id;
  const result      = await notesService.getNotes(tripId, userId);
  sendSuccess(res, result, "Notes fetched successfully");
});

export const createNote = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await notesService.createNote(tripId, userId, req.body);
  sendSuccess(res, result, "Note created", 201);
});

export const updateNote = asyncHandler(async (req, res) => {
  const { tripId, noteId } = req.params;
  const userId             = req.user.id;
  const result             = await notesService.updateNote(tripId, noteId, userId, req.body);
  sendSuccess(res, result, "Note updated");
});

export const deleteNote = asyncHandler(async (req, res) => {
  const { tripId, noteId } = req.params;
  const userId             = req.user.id;
  const result             = await notesService.deleteNote(tripId, noteId, userId);
  sendSuccess(res, result, "Note deleted");
});
