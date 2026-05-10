// src/utils/publicTripSerializer.js
// Strips private/internal fields before serving public share responses.
// All public endpoints MUST pass data through these serializers.

/**
 * Serialize a single activity for public view.
 */
function serializeActivity(activity) {
  return {
    id:         activity.id,
    title:      activity.title,
    notes:      activity.notes      ?? null,
    cost:       activity.cost       ?? null,
    bookingUrl: activity.bookingUrl ?? null,
    order:      activity.order,
  };
}

/**
 * Serialize a single stop for public view.
 */
function serializeStop(stop) {
  return {
    id:          stop.id,
    title:       stop.title,
    location:    stop.location    ?? null,
    description: stop.description ?? null,
    startTime:   stop.startTime   ?? null,
    endTime:     stop.endTime     ?? null,
    order:       stop.order,
    activities:  (stop.activities ?? []).map(serializeActivity),
  };
}

/**
 * Serialize a single itinerary day for public view.
 */
function serializeDay(day) {
  return {
    id:        day.id,
    dayNumber: day.dayNumber,
    date:      day.date  ?? null,
    title:     day.title ?? null,
    stops:     (day.stops ?? [])
      .sort((a, b) => a.order - b.order)
      .map(serializeStop),
  };
}

/**
 * Serialize the itinerary (array of days) for public view.
 */
export function serializePublicItinerary(days = []) {
  return days
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map(serializeDay);
}

/**
 * Serialize a trip object for public view.
 * Removes userId, internal timestamps, private metadata.
 */
export function serializePublicTrip(trip) {
  return {
    id:          trip.id,
    title:       trip.title,
    destination: trip.destination ?? null,
    description: trip.description ?? null,
    startDate:   trip.startDate   ?? null,
    endDate:     trip.endDate     ?? null,
    status:      trip.status,
    currency:    trip.currency    ?? "USD",
  };
}

/**
 * Serialize a budget summary for public view.
 */
export function serializePublicBudget(budget) {
  if (!budget) return null;

  return {
    totalBudget: budget.totalBudget ?? 0,
    totalSpent:  budget.totalSpent  ?? 0,
    remaining:   (budget.totalBudget ?? 0) - (budget.totalSpent ?? 0),
    categories:  (budget.categories ?? []).map((c) => ({
      name:   c.name ?? c.category,
      amount: c.amount ?? c._sum?.amount ?? 0,
    })),
  };
}

/**
 * Full public share response assembler.
 * Call this once in the sharing service before sending to the controller.
 *
 * @param {object} shareRecord - Prisma TripShare with nested trip, itinerary, budget
 */
export function buildPublicShareResponse(shareRecord) {
  const { trip } = shareRecord;

  const days   = trip?.itinerary?.days ?? [];
  const budget = trip?.budget ?? null;

  return {
    trip:      serializePublicTrip(trip),
    itinerary: { days: serializePublicItinerary(days) },
    budget:    serializePublicBudget(budget),
    sharedAt:  shareRecord.createdAt,
  };
}
