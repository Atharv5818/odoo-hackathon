// src/modules/activities/activities.service.js
import * as activitiesRepo from "./activities.repository.js";
import { AppError }        from "../../utils/AppError.js";
import prisma              from "../../config/prisma.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Resolve the tripId that owns a given stop.
 * Uses the nested Prisma join: stop → itineraryDay → itinerary → tripId.
 *
 * We need the stop record to include this join; findActivityById does the same.
 * For stop-level assertions, we use a lightweight stop lookup instead.
 */
async function getTripIdForStop(stopId) {
  const stop = await prisma.stop.findUnique({
    where: { id: stopId },
    select: { itineraryDay: { select: { itinerary: { select: { tripId: true } } } } }
  });
  if (!stop) throw new AppError("Stop not found", 404);

  // Traverse: stop.itineraryDay.itinerary.tripId
  const tripId = stop?.itineraryDay?.itinerary?.tripId;
  if (!tripId) throw new AppError("Could not resolve trip for this stop", 500);

  return tripId;
}

/**
 * Verify the trip that owns the stop belongs to userId.
 */
async function assertStopOwnership(stopId, userId) {
  const { findTripById } = await import("../trips/trips.repository.js");
  const tripId = await getTripIdForStop(stopId);
  const trip   = await findTripById(tripId);
  if (!trip)              throw new AppError("Trip not found", 404);
  if (trip.userId !== userId) throw new AppError("Forbidden", 403);
  return tripId;
}

/**
 * Verify an activity exists and retrieve the owning tripId.
 */
async function assertActivityOwnership(activityId, userId) {
  const { findTripById } = await import("../trips/trips.repository.js");

  const activity = await activitiesRepo.findActivityById(activityId);
  if (!activity) throw new AppError("Activity not found", 404);

  const tripId = activity?.stop?.itineraryDay?.itinerary?.tripId;
  if (!tripId)  throw new AppError("Could not resolve trip for this activity", 500);

  const trip = await findTripById(tripId);
  if (!trip)             throw new AppError("Trip not found", 404);
  if (trip.userId !== userId) throw new AppError("Forbidden", 403);

  return activity;
}

// ─── SERVICE METHODS ──────────────────────────────────────────────────────────

export async function getActivities(stopId, userId) {
  await assertStopOwnership(stopId, userId);
  const activities = await activitiesRepo.findActivitiesByStopId(stopId);
  return { activities };
}

export async function createActivity(stopId, userId, data) {
  await assertStopOwnership(stopId, userId);

  // Auto-assign order if not provided: append to end
  const order = data.order ?? (await activitiesRepo.countActivitiesByStopId(stopId));

  const activity = await activitiesRepo.createActivity(stopId, { ...data, order });
  return { activity };
}

export async function updateActivity(activityId, userId, data) {
  await assertActivityOwnership(activityId, userId);
  const activity = await activitiesRepo.updateActivity(activityId, data);
  return { activity };
}

export async function deleteActivity(activityId, userId) {
  await assertActivityOwnership(activityId, userId);
  await activitiesRepo.deleteActivity(activityId);
  return { deleted: true };
}

export async function reorderActivities(stopId, userId, activities) {
  await assertStopOwnership(stopId, userId);
  await activitiesRepo.reorderActivities(activities);
  const updated = await activitiesRepo.findActivitiesByStopId(stopId);
  return { activities: updated };
}
