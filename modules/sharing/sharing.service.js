// src/modules/sharing/sharing.service.js
import * as sharingRepo from "./sharing.repository.js";
import { findTripById } from "../trips/trips.repository.js";
import { generateShareSlug }         from "../../utils/slugify.js";
import { buildPublicShareResponse }  from "../../utils/publicTripSerializer.js";
import { AppError }                  from "../../utils/AppError.js";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

async function assertTripOwnership(tripId, userId) {
  const trip = await findTripById(tripId);
  if (!trip)                  throw new AppError("Trip not found", 404);
  if (trip.userId !== userId) throw new AppError("Forbidden", 403);
  return trip;
}

/**
 * Generate a slug that is guaranteed unique in the DB.
 * Retries up to 5 times (astronomically unlikely to collide).
 */
async function generateUniqueSlug(title) {
  for (let i = 0; i < 5; i++) {
    const slug = generateShareSlug(title);
    const taken = await sharingRepo.slugExists(slug);
    if (!taken) return slug;
  }
  throw new AppError("Could not generate a unique share slug — please try again", 500);
}

// ─── SERVICE METHODS ──────────────────────────────────────────────────────────

export async function getShares(tripId, userId) {
  await assertTripOwnership(tripId, userId);
  const shares = await sharingRepo.findSharesByTripId(tripId);
  return { shares };
}

export async function createShare(tripId, userId, data = {}) {
  const trip = await assertTripOwnership(tripId, userId);
  const slug = await generateUniqueSlug(trip.title);

  const expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  const share     = await sharingRepo.createShare(tripId, slug, expiresAt);

  return {
    share,
    shareUrl: `/share/${slug}`,
  };
}

export async function deleteShare(tripId, shareId, userId) {
  await assertTripOwnership(tripId, userId);

  const share = await sharingRepo.findShareById(shareId);
  if (!share) throw new AppError("Share link not found", 404);
  if (share.tripId !== tripId) throw new AppError("Share link does not belong to this trip", 403);

  await sharingRepo.deleteShare(shareId);
  return { deleted: true };
}

export async function getPublicTrip(slug) {
  const shareRecord = await sharingRepo.findShareBySlug(slug);
  if (!shareRecord) throw new AppError("This itinerary is not available", 404);

  // Check if share has expired
  if (shareRecord.expiresAt && new Date() > new Date(shareRecord.expiresAt)) {
    throw new AppError("This share link has expired", 410);
  }

  // Assemble budget categories from items
  if (shareRecord.trip?.budget?.items) {
    const grouped = shareRecord.trip.budget.items.reduce((acc, item) => {
      const key = item.category ?? "other";
      acc[key]  = (acc[key] ?? 0) + (item.amount ?? 0);
      return acc;
    }, {});

    shareRecord.trip.budget.categories = Object.entries(grouped).map(
      ([name, amount]) => ({ name, amount })
    );
  }

  return buildPublicShareResponse(shareRecord);
}
