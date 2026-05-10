// src/modules/notes/notes.repository.js
import prisma from "../../config/prisma.js";

// ─── SELECT SHAPE ─────────────────────────────────────────────────────────────
// Always return a consistent, sanitized note object.
const NOTE_SELECT = {
  id        : true,
  title     : true,
  content   : true,
  tripId    : true,
  createdAt : true,
  updatedAt : true,
};

// ─── QUERIES ──────────────────────────────────────────────────────────────────

/**
 * Return all notes for a trip, newest first.
 */
export async function findNotesByTripId(tripId) {
  return prisma.note.findMany({
    where   : { tripId },
    select  : NOTE_SELECT,
    orderBy : { createdAt: "desc" },
  });
}

/**
 * Return a single note by its ID.
 */
export async function findNoteById(noteId) {
  return prisma.note.findUnique({
    where  : { id: noteId },
    select : { ...NOTE_SELECT, tripId: true },
  });
}

/**
 * Create a new note attached to a trip.
 */
export async function createNote(tripId, data) {
  return prisma.note.create({
    data   : { tripId, title: data.title ?? null, content: data.content },
    select : NOTE_SELECT,
  });
}

/**
 * Update a note's title and/or content.
 */
export async function updateNote(noteId, data) {
  return prisma.note.update({
    where  : { id: noteId },
    data   : {
      ...(data.title   !== undefined && { title   : data.title   }),
      ...(data.content !== undefined && { content : data.content }),
    },
    select : NOTE_SELECT,
  });
}

/**
 * Delete a note by ID.
 */
export async function deleteNote(noteId) {
  return prisma.note.delete({ where: { id: noteId } });
}
