// src/modules/activities/activities.repository.js
import prisma from "../../config/prisma.js";

// ─── SELECT SHAPE ─────────────────────────────────────────────────────────────
const ACTIVITY_SELECT = {
  id         : true,
  title      : true,
  notes      : true,
  cost       : true,
  bookingUrl : true,
  order      : true,
  stopId     : true,
  createdAt  : true,
  updatedAt  : true,
};

// ─── QUERIES ──────────────────────────────────────────────────────────────────

/**
 * Fetch all activities for a stop, sorted by order ascending.
 */
export async function findActivitiesByStopId(stopId) {
  return prisma.activity.findMany({
    where   : { stopId },
    select  : ACTIVITY_SELECT,
    orderBy : { order: "asc" },
  });
}

/**
 * Fetch a single activity by ID.
 */
export async function findActivityById(activityId) {
  return prisma.activity.findUnique({
    where  : { id: activityId },
    select : { ...ACTIVITY_SELECT, stop: { select: { id: true, itineraryDay: { select: { itinerary: { select: { tripId: true } } } } } } },
  });
}

/**
 * Count existing activities on a stop to auto-assign order.
 */
export async function countActivitiesByStopId(stopId) {
  return prisma.activity.count({ where: { stopId } });
}

/**
 * Create a new activity on a stop.
 */
export async function createActivity(stopId, data) {
  return prisma.activity.create({
    data   : {
      stopId,
      title      : data.title,
      notes      : data.notes      ?? null,
      cost       : data.cost       ?? null,
      bookingUrl : data.bookingUrl ?? null,
      order      : data.order,
    },
    select : ACTIVITY_SELECT,
  });
}

/**
 * Update an activity's fields.
 */
export async function updateActivity(activityId, data) {
  return prisma.activity.update({
    where  : { id: activityId },
    data   : {
      ...(data.title      !== undefined && { title      : data.title      }),
      ...(data.notes      !== undefined && { notes      : data.notes      }),
      ...(data.cost       !== undefined && { cost       : data.cost       }),
      ...(data.bookingUrl !== undefined && { bookingUrl : data.bookingUrl }),
      ...(data.order      !== undefined && { order      : data.order      }),
    },
    select : ACTIVITY_SELECT,
  });
}

/**
 * Delete an activity by ID.
 */
export async function deleteActivity(activityId) {
  return prisma.activity.delete({ where: { id: activityId } });
}

/**
 * Batch-update activity order (used in reorder endpoint).
 * Runs in a Prisma transaction for atomicity.
 */
export async function reorderActivities(activities) {
  return prisma.$transaction(
    activities.map(({ id, order }) =>
      prisma.activity.update({ where: { id }, data: { order } })
    )
  );
}
