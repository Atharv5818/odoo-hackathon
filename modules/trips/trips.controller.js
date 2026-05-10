// src/modules/trips/trips.controller.js
import * as tripsService from "./trips.service.js";
import { sendSuccess }   from "../../utils/response.js";
import { asyncHandler }  from "../../utils/asyncHandler.js";

export const getTrips = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await tripsService.getTrips(userId, req.query);
  // result shape: { data: [...], pagination: {...} }
  sendSuccess(res, result, "Trips fetched successfully");
});

export const getTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await tripsService.getTripDetail(tripId, userId);
  sendSuccess(res, result, "Trip fetched successfully");
});

export const createTrip = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const result = await tripsService.createTrip(userId, req.body);
  sendSuccess(res, result, "Trip created", 201);
});

export const updateTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await tripsService.updateTrip(tripId, userId, req.body);
  sendSuccess(res, result, "Trip updated");
});

export const deleteTrip = asyncHandler(async (req, res) => {
  const { tripId } = req.params;
  const userId     = req.user.id;
  const result     = await tripsService.deleteTrip(tripId, userId);
  sendSuccess(res, result, "Trip deleted");
});
