// src/modules/activities/activities.controller.js
import * as activitiesService from "./activities.service.js";
import { sendSuccess }        from "../../utils/response.js";
import { asyncHandler }       from "../../utils/asyncHandler.js";

export const getActivities = asyncHandler(async (req, res) => {
  const { stopId } = req.params;
  const userId     = req.user.id;
  const result     = await activitiesService.getActivities(stopId, userId);
  sendSuccess(res, result, "Activities fetched successfully");
});

export const createActivity = asyncHandler(async (req, res) => {
  const { stopId } = req.params;
  const userId     = req.user.id;
  const result     = await activitiesService.createActivity(stopId, userId, req.body);
  sendSuccess(res, result, "Activity created", 201);
});

export const updateActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId         = req.user.id;
  const result         = await activitiesService.updateActivity(activityId, userId, req.body);
  sendSuccess(res, result, "Activity updated");
});

export const deleteActivity = asyncHandler(async (req, res) => {
  const { activityId } = req.params;
  const userId         = req.user.id;
  const result         = await activitiesService.deleteActivity(activityId, userId);
  sendSuccess(res, result, "Activity deleted");
});

export const reorderActivities = asyncHandler(async (req, res) => {
  const { stopId }     = req.params;
  const userId         = req.user.id;
  const { activities } = req.body;
  const result         = await activitiesService.reorderActivities(stopId, userId, activities);
  sendSuccess(res, result, "Activities reordered");
});
