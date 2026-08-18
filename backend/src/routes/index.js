/**
 * ROUTE TABLE.
 *
 * Everything is mounted under /api/v1. The version is in the path from day
 * one, not added later when it is already too late — a breaking change ships
 * as /api/v2 alongside v1 rather than under it.
 */

import { Router } from 'express';
import { voiceRouter } from '../modules/voice/voice.routes.js';
import { contactRouter } from '../modules/contact/contact.routes.js';
import { gateRouter } from '../modules/gate/gate.routes.js';
import { ok } from '../lib/response.js';

export const apiRouter = Router();

/** Discovery root. Useful when someone opens the API URL in a browser. */
apiRouter.get('/', (_req, res) =>
  ok(res, {
    name: 'Inam Sheraz portfolio API',
    version: 'v1',
    endpoints: {
      'POST /api/v1/voice/session': 'Mint a short-lived voice-agent session. No credential leaves the server.',
      'POST /api/v1/contact/messages': 'Send a message.',
      'POST /api/v1/gate/cat/verify': 'Check the CAT set password.',
      'GET /health/live': 'Process liveness.',
      'GET /health/ready': 'Dependency readiness.',
      'GET /health/metrics': 'Counters.',
    },
    documentation: '/openapi.json',
  })
);

apiRouter.use('/voice', voiceRouter);
apiRouter.use('/contact', contactRouter);
apiRouter.use('/gate', gateRouter);
