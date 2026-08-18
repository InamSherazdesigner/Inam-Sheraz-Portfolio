import { Router } from 'express';
import { submitMessage } from './contact.service.js';
import { contactBodySchema } from './contact.schema.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { contactLimiter } from '../../middleware/rateLimit.js';
import { requireAllowedOrigin } from '../../middleware/security.js';
import { ok } from '../../lib/response.js';

export const contactRouter = Router();

contactRouter.post(
  '/messages',
  requireAllowedOrigin,
  contactLimiter,
  validate({ body: contactBodySchema }),
  asyncHandler(async (req, res) => {
    const result = await submitMessage({
      input: req.body,
      ctx: { requestId: res.locals.requestId, ip: req.ip, log: req.log },
    });

    return ok(
      res,
      { accepted: result.accepted, message: 'Thanks — that came through. I will reply soon.' },
      { status: 201 }
    );
  })
);
