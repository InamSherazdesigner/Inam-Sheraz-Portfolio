/**
 * Express 4 does not catch rejections from an async handler — an awaited
 * failure becomes an unhandled rejection and the request hangs until it times
 * out. Every async route is wrapped in this so rejections reach the one
 * central error handler like any other throw.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
