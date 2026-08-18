/**
 * POST /api/v1/voice/session
 *
 * The order of this middleware stack is the security design, so it is spelled
 * out rather than left to be inferred:
 *
 *   1. requireAllowedOrigin  — refuse anything not sent by the portfolio.
 *   2. voiceGlobalLimiter    — cap total sessions per window. The bill.
 *   3. voiceLimiter          — cap sessions per visitor. The abuse control.
 *   4. controller            — only now is the credential used.
 *
 * The cheapest rejections come first. A blocked caller is turned away before
 * this service does any work and long before it touches ElevenLabs.
 */

import { Router } from 'express';
import { postSession, postChat } from './voice.controller.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAllowedOrigin } from '../../middleware/security.js';
import { voiceLimiter, voiceGlobalLimiter } from '../../middleware/rateLimit.js';

export const voiceRouter = Router();

voiceRouter.post(
  '/session',
  requireAllowedOrigin,
  voiceGlobalLimiter,
  voiceLimiter,
  asyncHandler(postSession)
);

voiceRouter.post(
  '/chat',
  requireAllowedOrigin,
  voiceGlobalLimiter,
  voiceLimiter,
  asyncHandler(postChat)
);
