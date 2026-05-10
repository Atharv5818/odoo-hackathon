// src/utils/pagination.js
// Reusable pagination helpers for list endpoints.

/**
 * Parse and validate pagination query params from Express request.
 * Returns a safe { page, limit, skip } object for use in Prisma queries.
 *
 * @param {object} query  - req.query
 * @param {object} [opts] - { defaultLimit, maxLimit }
 */
export function parsePagination(query = {}, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const skip  = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build a consistent pagination metadata object to attach to list responses.
 *
 * @param {number} total  - total record count (from Prisma count)
 * @param {number} page
 * @param {number} limit
 */
export function buildPaginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  const hasNext    = page < totalPages;
  const hasPrev    = page > 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null,
  };
}

/**
 * Convenience wrapper — returns { data, pagination } shape.
 *
 * @param {any[]}  records
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 */
export function paginate(records, total, page, limit) {
  return {
    data:       records,
    pagination: buildPaginationMeta(total, page, limit),
  };
}

// Legacy alias used by phase1,2 code
export const getPaginationParams = parsePagination;
export const buildPaginatedResponse = (items, total, { page, limit }) =>
  paginate(items, total, page, limit);
