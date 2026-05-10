// src/modules/trips/trips.service.js
import * as tripsRepo          from "./trips.repository.js";
import { parsePagination, paginate } from "../../utils/pagination.js";
import { AppError }            from "../../utils/AppError.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function assertOwnership(tripId, userId) {
  const trip = await tripsRepo.findTripById(tripId);
  if (!trip)                  throw new AppError("Trip not found", 404);
  if (trip.userId !== userId) throw new AppError("Forbidden", 403);
  return trip;
}

// ─── RESPONSE SHAPERS ─────────────────────────────────────────────────────────

/**
 * Enrich a list-view trip with derived stats.
 */
function shapeTripListItem(trip) {
  const checklistTotal  = trip.checklist?._count?.items ?? 0;
  // Completed items require a second query or model adjustment — provide total only for list
  const budget = trip.budget ?? null;

  return {
    id          : trip.id,
    title       : trip.title,
    destination : trip.destination,
    description : trip.description,
    status      : trip.status,
    startDate   : trip.startDate,
    endDate     : trip.endDate,
    currency    : trip.currency,
    createdAt   : trip.createdAt,
    updatedAt   : trip.updatedAt,
    stats: {
      notes          : trip._count?.notes    ?? 0,
      shares         : trip._count?.shares   ?? 0,
      checklistItems : checklistTotal,
    },
    budget: budget
      ? {
          totalBudget : budget.totalBudget ?? 0,
          totalSpent  : budget.totalSpent  ?? 0,
          remaining   : (budget.totalBudget ?? 0) - (budget.totalSpent ?? 0),
        }
      : null,
  };
}

/**
 * Enrich a detail-view trip with derived budget summary and checklist counts.
 */
function shapeTripDetail(trip) {
  // Derive budget categories from items
  const budgetCategories = (trip.budget?.items ?? []).reduce((acc, item) => {
    const key = item.category ?? "other";
    acc[key]  = (acc[key] ?? 0) + (item.amount ?? 0);
    return acc;
  }, {});

  // Checklist summary
  const checklistGroups  = trip.checklist?.groups ?? [];
  const totalItems       = checklistGroups.reduce((s, g) => s + (g.items?.length ?? 0), 0);
  const completedItems   = checklistGroups.reduce(
    (s, g) => s + (g.items?.filter((i) => i.isCompleted).length ?? 0),
    0
  );

  return {
    id          : trip.id,
    title       : trip.title,
    destination : trip.destination,
    description : trip.description,
    status      : trip.status,
    startDate   : trip.startDate,
    endDate     : trip.endDate,
    currency    : trip.currency,
    createdAt   : trip.createdAt,
    updatedAt   : trip.updatedAt,
    stats: {
      notes  : trip._count?.notes  ?? 0,
      shares : trip._count?.shares ?? 0,
    },
    budget: trip.budget
      ? {
          id          : trip.budget.id,
          totalBudget : trip.budget.totalBudget ?? 0,
          totalSpent  : trip.budget.totalSpent  ?? 0,
          remaining   : (trip.budget.totalBudget ?? 0) - (trip.budget.totalSpent ?? 0),
          categories  : Object.entries(budgetCategories).map(([name, amount]) => ({ name, amount })),
          recentItems : trip.budget.items,
        }
      : null,
    checklist: {
      totalItems,
      completedItems,
      completionPct : totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      groups        : checklistGroups,
    },
    itinerary   : trip.itinerary ?? null,
  };
}

// ─── SERVICE METHODS ──────────────────────────────────────────────────────────

export async function getTrips(userId, query) {
  const { page, limit, skip } = parsePagination(query);
  const [total, rawTrips]     = await Promise.all([
    tripsRepo.countTrips(userId, query),
    tripsRepo.findTrips(userId, query, skip, limit),
  ]);

  const trips = rawTrips.map(shapeTripListItem);
  return paginate(trips, total, page, limit);
}

export async function getTripDetail(tripId, userId) {
  await assertOwnership(tripId, userId);
  const trip = await tripsRepo.findTripDetail(tripId);
  if (!trip) throw new AppError("Trip not found", 404);
  return { trip: shapeTripDetail(trip) };
}

export async function createTrip(userId, data) {
  const trip = await tripsRepo.createTrip(userId, data);
  return { trip };
}

export async function updateTrip(tripId, userId, data) {
  await assertOwnership(tripId, userId);
  const trip = await tripsRepo.updateTrip(tripId, data);
  return { trip };
}

export async function deleteTrip(tripId, userId) {
  await assertOwnership(tripId, userId);
  await tripsRepo.deleteTrip(tripId);
  return { deleted: true };
}
