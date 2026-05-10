// src/modules/sharing/sharing.controller.js
import * as sharingService from "./sharing.service.js";
import { sendSuccess }     from "../../utils/response.js";
import { asyncHandler }    from "../../utils/asyncHandler.js";

// ─── AUTHENTICATED ROUTES ─────────────────────────────────────────────────────

export const getShares = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await sharingService.getShares(tripId, userId);
  sendSuccess(res, result, "Shares fetched successfully");
});

export const createShare = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await sharingService.createShare(tripId, userId, req.body);
  sendSuccess(res, result, "Share link created", 201);
});

export const deleteShare = asyncHandler(async (req, res) => {
  const { tripId, shareId } = req.params;
  const userId              = req.user.id;
  const result              = await sharingService.deleteShare(tripId, shareId, userId);
  sendSuccess(res, result, "Share link revoked");
});

// ─── PUBLIC ROUTE ─────────────────────────────────────────────────────────────

export const getPublicTrip = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result   = await sharingService.getPublicTrip(slug);
  sendSuccess(res, result, "Public trip fetched successfully");
});
