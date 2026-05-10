// src/modules/trips/trips.repository.js
//
// EXTENDS existing trips repository.
// Add/replace the list and detail queries here.
// All existing mutations (create/update/delete) remain unchanged below the separator.

import prisma from "../../config/prisma.js";

// ─── SHARED SELECT ────────────────────────────────────────────────────────────

/** Lightweight trip card used in list views */
const TRIP_LIST_SELECT = {
  id          : true,
  title       : true,
  destination : true,
  description : true,
  status      : true,
  startDate   : true,
  endDate     : true,
  currency    : true,
  createdAt   : true,
  updatedAt   : true,
  // Aggregate counts for analytics card
  _count: {
    select: {
      notes      : true,
      shares     : true,
    },
  },
  // Checklist summary
  checklist: {
    select: {
      _count: {
        select: { items: true },
      },
    },
  },
  // Budget headline figures
  budget: {
    select: {
      totalBudget : true,
      totalSpent  : true,
    },
  },
};

/** Full trip detail used in single-trip view */
const TRIP_DETAIL_INCLUDE = {
  budget: {
    select: {
      id          : true,
      totalBudget : true,
      totalSpent  : true,
      items       : {
        select  : { id: true, title: true, amount: true, category: true, createdAt: true },
        orderBy : { createdAt: "desc" },
        take    : 50, // cap at 50 most recent for the detail panel
      },
    },
  },
  checklist: {
    include: {
      groups: {
        orderBy : { createdAt: "asc" },
        include  : {
          items: {
            orderBy: { createdAt: "asc" },
            select : { id: true, title: true, isCompleted: true },
          },
        },
      },
    },
  },
  itinerary: {
    include: {
      days: {
        orderBy : { dayNumber: "asc" },
        include  : {
          stops: {
            orderBy : { order: "asc" },
            include  : {
              activities: {
                orderBy : { order: "asc" },
                select  : {
                  id         : true,
                  title      : true,
                  cost       : true,
                  bookingUrl : true,
                  notes      : true,
                  order      : true,
                },
              },
            },
          },
        },
      },
    },
  },
  _count: {
    select: { notes: true, shares: true },
  },
};

// ─── QUERY BUILDER HELPERS ───────────────────────────────────────────────────

/**
 * Build a Prisma where clause from query params.
 *
 * Supported filters:
 *   status       - PLANNING | UPCOMING | ONGOING | COMPLETED | CANCELLED
 *   destination  - partial, case-insensitive match
 *   search       - searches title + destination
 *   startAfter   - ISO date string
 *   startBefore  - ISO date string
 */
function buildTripWhere(userId, query) {
  const where = { userId };

  if (query.status) {
    where.status = query.status.toUpperCase();
  }

  if (query.destination) {
    where.destination = { contains: query.destination, mode: "insensitive" };
  }

  if (query.search) {
    where.OR = [
      { title       : { contains: query.search, mode: "insensitive" } },
      { destination : { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.startAfter) {
    where.startDate = { ...where.startDate, gte: new Date(query.startAfter) };
  }

  if (query.startBefore) {
    where.startDate = { ...where.startDate, lte: new Date(query.startBefore) };
  }

  return where;
}

/**
 * Build Prisma orderBy from query params.
 *
 * Supported sort fields: createdAt | startDate | title | updatedAt
 * Supported sort orders: asc | desc (default: desc)
 */
function buildTripOrderBy(query) {
  const allowed = ["createdAt", "startDate", "title", "updatedAt"];
  const field   = allowed.includes(query.sortBy) ? query.sortBy : "createdAt";
  const dir     = query.sortOrder === "asc" ? "asc" : "desc";
  return { [field]: dir };
}

// ─── REPOSITORY METHODS ───────────────────────────────────────────────────────

/**
 * Count trips matching the filter (used for pagination metadata).
 */
export async function countTrips(userId, query = {}) {
  return prisma.trip.count({ where: buildTripWhere(userId, query) });
}

/**
 * Paginated, filtered, sorted trip list.
 *
 * @param {string} userId
 * @param {object} query   - raw req.query object
 * @param {number} skip
 * @param {number} limit
 */
export async function findTrips(userId, query = {}, skip = 0, limit = 20) {
  return prisma.trip.findMany({
    where   : buildTripWhere(userId, query),
    select  : TRIP_LIST_SELECT,
    orderBy : buildTripOrderBy(query),
    skip,
    take    : limit,
  });
}

/**
 * Single trip by ID (no ownership check — caller must verify).
 */
export async function findTripById(tripId) {
  return prisma.trip.findUnique({
    where  : { id: tripId },
    select : { id: true, userId: true, title: true, status: true },
  });
}

/**
 * Full trip detail with all nested relations.
 */
export async function findTripDetail(tripId) {
  return prisma.trip.findUnique({
    where   : { id: tripId },
    include : TRIP_DETAIL_INCLUDE,
  });
}

// ─── MUTATIONS (preserve existing implementations) ────────────────────────────

export async function createTrip(userId, data) {
  return prisma.trip.create({
    data: {
      userId,
      title       : data.title,
      destination : data.destination ?? null,
      description : data.description ?? null,
      status      : data.status      ?? "PLANNING",
      startDate   : data.startDate   ? new Date(data.startDate) : null,
      endDate     : data.endDate     ? new Date(data.endDate)   : null,
      currency    : data.currency    ?? "USD",
    },
  });
}

export async function updateTrip(tripId, data) {
  return prisma.trip.update({
    where : { id: tripId },
    data  : {
      ...(data.title       !== undefined && { title       : data.title       }),
      ...(data.destination !== undefined && { destination : data.destination }),
      ...(data.description !== undefined && { description : data.description }),
      ...(data.status      !== undefined && { status      : data.status.toUpperCase() }),
      ...(data.startDate   !== undefined && { startDate   : data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate     !== undefined && { endDate     : data.endDate   ? new Date(data.endDate)   : null }),
      ...(data.currency    !== undefined && { currency    : data.currency    }),
    },
  });
}

export async function deleteTrip(tripId) {
  return prisma.trip.delete({ where: { id: tripId } });
}
