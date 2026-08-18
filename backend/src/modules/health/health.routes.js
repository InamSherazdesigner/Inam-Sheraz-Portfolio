/**
 * HEALTH AND METRICS.
 *
 * Three endpoints with three different jobs, kept separate because an
 * orchestrator that conflates them will restart a healthy process:
 *
 *   /health/live   Is the process running? Never touches a dependency.
 *                  A liveness probe that checks the database restarts the API
 *                  every time Mongo hiccups — which fixes nothing and takes
 *                  the site down too.
 *
 *   /health/ready  Should this instance receive traffic? Checks dependencies.
 *                  Degraded (Mongo down) is still 200: the portfolio renders
 *                  without a database, so pulling the instance would turn a
 *                  partial outage into a total one.
 *
 *   /health/metrics  Counters for a dashboard. No PII, no secrets.
 */

import { Router } from 'express';
import mongoose from 'mongoose';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { isDatabaseConnected } from '../../config/database.js';
import { voiceHealth, voiceBreakerSnapshot } from '../voice/voice.service.js';
import { ok } from '../../lib/response.js';
import { env } from '../../config/env.js';

export const healthRouter = Router();

const startedAt = Date.now();

const READY_STATE = ['disconnected', 'connected', 'connecting', 'disconnecting'];

healthRouter.get('/live', (_req, res) =>
  ok(res, { status: 'live', uptimeSeconds: Math.round((Date.now() - startedAt) / 1000) })
);

healthRouter.get(
  '/ready',
  asyncHandler(async (_req, res) => {
    const voice = await voiceHealth();
    const database = {
      ok: isDatabaseConnected(),
      state: READY_STATE[mongoose.connection.readyState] ?? 'unknown',
    };

    // Neither dependency is required for the website to serve its work, so
    // neither can take this instance out of rotation. The body says what is
    // degraded; the status code says the instance is usable.
    const degraded = [
      ...(database.ok ? [] : ['database']),
      ...(voice.ok ? [] : ['voice']),
    ];

    return ok(res, {
      status: degraded.length ? 'degraded' : 'ready',
      degraded,
      checks: { database, voice: { ok: voice.ok, provider: voice.provider, detail: voice.detail } },
    });
  })
);

healthRouter.get('/metrics', (_req, res) => {
  const memory = process.memoryUsage();
  return ok(res, {
    uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
    node: process.version,
    env: env.NODE_ENV,
    memory: {
      rssMb: +(memory.rss / 1024 / 1024).toFixed(1),
      heapUsedMb: +(memory.heapUsed / 1024 / 1024).toFixed(1),
    },
    voiceBreaker: voiceBreakerSnapshot(),
    database: { connected: isDatabaseConnected() },
  });
});
