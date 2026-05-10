// src/modules/notes/notes.service.js
import * as notesRepo from "./notes.repository.js";
import { findTripById } from "../trips/trips.repository.js";
import { AppError }     from "../../utils/AppError.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Verify the trip exists and is owned by the requesting user.
 * Throws 404 if trip not found, 403 if not the owner.
 */
async function assertTripOwnership(tripId, userId) {
  const trip = await findTripById(tripId);
  if (!trip)              throw new AppError("Trip not found", 404);
  if (trip.userId !== userId) throw new AppError("Forbidden", 403);
  return trip;
}

/**
 * Verify the note belongs to the given trip (prevents cross-trip manipulation).
 */
async function assertNoteOwnership(noteId, tripId) {
  const note = await notesRepo.findNoteById(noteId);
  if (!note)              throw new AppError("Note not found", 404);
  if (note.tripId !== tripId) throw new AppError("Note does not belong to this trip", 403);
  return note;
}

// ─── SERVICE METHODS ──────────────────────────────────────────────────────────

export async function getNotes(tripId, userId) {
  await assertTripOwnership(tripId, userId);
  const notes = await notesRepo.findNotesByTripId(tripId);
  return { notes };
}

export async function createNote(tripId, userId, data) {
  await assertTripOwnership(tripId, userId);
  const note = await notesRepo.createNote(tripId, data);
  return { note };
}

export async function updateNote(tripId, noteId, userId, data) {
  await assertTripOwnership(tripId, userId);
  await assertNoteOwnership(noteId, tripId);
  const note = await notesRepo.updateNote(noteId, data);
  return { note };
}

export async function deleteNote(tripId, noteId, userId) {
  await assertTripOwnership(tripId, userId);
  await assertNoteOwnership(noteId, tripId);
  await notesRepo.deleteNote(noteId);
  return { deleted: true };
}
