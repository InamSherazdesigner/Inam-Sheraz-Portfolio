/**
 * POST /api/v1/gate/cat/verify
 *
 * The CAT set is password-gated at the researcher's request, because the
 * Children's Apperception Test depends on children not having seen the cards
 * before.
 *
 * What moving this check to the server buys: the password is no longer sitting
 * in a JavaScript bundle where "view source" finds it in ten seconds, and
 * guessing is rate-limited.
 *
 * What it does NOT buy: the images themselves are static files at predictable
 * URLs. Anyone who wants them can have them. This remains a deterrent, exactly
 * as BUILD_SPEC §10 requires, and the UI must never claim otherwise. See
 * ADR 0004 for why the images were not moved behind an authorising proxy.
 */

import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { safeEqual } from '../../lib/hash.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { gateLimiter } from '../../middleware/rateLimit.js';
import { requireAllowedOrigin } from '../../middleware/security.js';
import { ApiError, ErrorCode } from '../../lib/ApiError.js';
import { ok } from '../../lib/response.js';

export const gateRouter = Router();

const bodySchema = z.object({
  password: z.string().min(1, 'Enter the password.').max(200),
});

gateRouter.post(
  '/cat/verify',
  requireAllowedOrigin,
  gateLimiter,
  validate({ body: bodySchema }),
  asyncHandler(async (req, res) => {
    const attempt = req.body.password.trim().toLowerCase();
    const expected = env.CAT_GATE_PASSWORD.trim().toLowerCase();

    if (!safeEqual(attempt, expected)) {
      req.log.info('cat gate attempt rejected');
      throw new ApiError(403, ErrorCode.GATE_DENIED, 'That is not the password.');
    }

    res.setHeader('Cache-Control', 'no-store');
    return ok(res, {
      unlocked: true,
      message: 'Unlocked. Please do not circulate these.',
    });
  })
);
