// src/utils/asyncHandler.js
// Wraps async Express route handlers to eliminate repetitive try/catch blocks.
// Instead of wrapping every controller in try/catch and calling next(err),
// you wrap the function once and errors are forwarded automatically.
//
// Usage:
//   export const getTrip = asyncHandler(async (req, res) => {
//     const trip = await tripService.getById(req.params.tripId, req.user.id);
//     sendSuccess(res, { trip }, "Trip fetched");
//   });

/**
 * @param {Function} fn - An async Express route handler (req, res, next)
 * @returns {Function} - A wrapped handler that catches rejections and forwards to next()
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
