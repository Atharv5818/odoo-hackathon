// src/utils/apiResponse.js
// Every response the API sends goes through these helpers.
// Consistent shape: { success, message, data } — frontend never has to guess.

/**
 * Sends a successful response.
 *
 * @param {import("express").Response} res
 * @param {object} options
 * @param {number}  options.statusCode - HTTP status code (default 200)
 * @param {string}  options.message    - Human-readable success message
 * @param {any}     options.data       - Payload to return (omit for 204-style responses)
 */
export const sendSuccess = (res, { statusCode = 200, message = "Success", data = null } = {}) => {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

/**
 * Sends an error response.
 *
 * @param {import("express").Response} res
 * @param {object} options
 * @param {number}  options.statusCode - HTTP status code (default 500)
 * @param {string}  options.message    - Human-readable error message
 * @param {any}     options.errors     - Optional validation errors or details
 */
export const sendError = (res, { statusCode = 500, message = "Internal server error", errors = null } = {}) => {
  const body = { success: false, message };
  if (errors !== null) body.errors = errors;
  return res.status(statusCode).json(body);
};
