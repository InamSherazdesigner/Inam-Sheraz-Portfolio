/**
 * MONGODB — connection lifecycle.
 *
 * The database is deliberately NOT on the critical path of the website. Site
 * content lives in the frontend as typed modules (ADR 0003), so Mongo being
 * down degrades the contact form and the audit trail and nothing else. The
 * portfolio itself still renders in full. Graceful degradation, by design.
 */

import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

let connected = false;

export const isDatabaseConnected = () => connected && mongoose.connection.readyState === 1;

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  // Buffering makes a query sit and wait when the driver is disconnected, so
  // a Mongo outage turns into a hung request. We want an immediate failure
  // that the error handler can degrade cleanly.
  mongoose.set('bufferCommands', false);

  mongoose.connection.on('connected', () => {
    connected = true;
    logger.info({ db: mongoose.connection.name }, 'mongodb connected');
  });
  mongoose.connection.on('disconnected', () => {
    connected = false;
    logger.warn('mongodb disconnected');
  });
  mongoose.connection.on('error', (error) => {
    connected = false;
    logger.error({ err: error }, 'mongodb error');
  });

  try {
    await mongoose.connect(env.MONGODB_URI, {
      maxPoolSize: env.MONGODB_MAX_POOL_SIZE,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 20_000,
    });
  } catch (error) {
    // Not fatal. The site is the product; the database is bookkeeping.
    logger.error(
      { err: error },
      'mongodb unavailable at boot — starting anyway, persistence is disabled'
    );
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.connection.close();
  connected = false;
  logger.info('mongodb connection closed');
}
