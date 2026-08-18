/**
 * RESPONSE ENVELOPE — every endpoint answers in exactly one of two shapes.
 *
 *   success  { ok: true,  data, meta }
 *   failure  { ok: false, error: { code, message, details? }, meta }
 *
 * `meta.requestId` appears on both, so a visitor can quote a failure back and
 * it can be found in the logs immediately.
 */

export function ok(res, data, { status = 200, meta = {} } = {}) {
  return res.status(status).json({
    ok: true,
    data,
    meta: { requestId: res.locals.requestId, ...meta },
  });
}

export function fail(res, { status, code, message, details, meta = {} }) {
  return res.status(status).json({
    ok: false,
    error: { code, message, ...(details ? { details } : {}) },
    meta: { requestId: res.locals.requestId, ...meta },
  });
}
