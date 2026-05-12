/**
 * Slice a filtered array using ?page=&limit= query params.
 * @param {unknown[]} items
 * @param {import("express").Request} req
 * @param {{ defaultLimit?: number; maxLimit?: number }} [opts]
 */
exports.paginateArray = (items, req, opts = {}) => {
  const defaultLimit = opts.defaultLimit ?? 25;
  const maxLimit = opts.maxLimit ?? 100;
  const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
  let limit = parseInt(String(req.query.limit || String(defaultLimit)), 10) || defaultLimit;
  limit = Math.min(maxLimit, Math.max(1, limit));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;
  const data = items.slice(offset, offset + limit);
  return {
    data,
    page: safePage,
    limit,
    total,
    totalPages,
    offset,
  };
};
