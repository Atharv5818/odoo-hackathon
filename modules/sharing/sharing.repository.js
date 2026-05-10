// src/modules/sharing/sharing.repository.js
import prisma from "../../config/prisma.js";

// ─── SELECT SHAPES ────────────────────────────────────────────────────────────

const SHARE_SELECT = {
  id        : true,
  slug      : true,
  tripId    : true,
  createdAt : true,
  expiresAt : true,
};

// Deep include for public page — all nested relations needed for serialization
const PUBLIC_SHARE_INCLUDE = {
  trip: {
    include: {
      itinerary: {
        include: {
          days: {
            orderBy : { dayNumber: "asc" },
            include  : {
              stops: {
                orderBy : { order: "asc" },
                include  : {
                  activities: {
                    orderBy: { order: "asc" },
                    select : {
                      id         : true,
                      title      : true,
                      notes      : true,
                      cost       : true,
                      bookingUrl : true,
                      order      : true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      budget: {
        select: {
          totalBudget : true,
          totalSpent  : true,
          items       : {
            select: { category: true, amount: true },
          },
        },
      },
    },
  },
};

// ─── QUERIES ──────────────────────────────────────────────────────────────────

/**
 * Return all share links for a trip.
 */
export async function findSharesByTripId(tripId) {
  return prisma.tripShare.findMany({
    where   : { tripId },
    select  : SHARE_SELECT,
    orderBy : { createdAt: "desc" },
  });
}

/**
 * Find a share record by ID (for ownership/deletion checks).
 */
export async function findShareById(shareId) {
  return prisma.tripShare.findUnique({
    where  : { id: shareId },
    select : { ...SHARE_SELECT, trip: { select: { userId: true } } },
  });
}

/**
 * Find a share record by its public slug (for the public route).
 * Includes all nested trip data for serialization.
 */
export async function findShareBySlug(slug) {
  return prisma.tripShare.findUnique({
    where   : { slug },
    include : PUBLIC_SHARE_INCLUDE,
  });
}

/**
 * Check if a slug is already taken.
 */
export async function slugExists(slug) {
  const count = await prisma.tripShare.count({ where: { slug } });
  return count > 0;
}

/**
 * Create a new share link.
 */
export async function createShare(tripId, slug, expiresAt) {
  return prisma.tripShare.create({
    data   : { tripId, slug, expiresAt: expiresAt ?? null },
    select : SHARE_SELECT,
  });
}

/**
 * Delete a share link by ID.
 */
export async function deleteShare(shareId) {
  return prisma.tripShare.delete({ where: { id: shareId } });
}
