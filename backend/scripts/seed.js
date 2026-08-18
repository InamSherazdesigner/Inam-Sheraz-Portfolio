/**
 * SEED / MIGRATE.
 *
 * There is no content to seed — the portfolio's words and artwork live in the
 * frontend as typed modules (ADR 0003). What this script does is the part
 * Mongoose otherwise does lazily and unreliably in production: build every
 * index declared on a model, including the two TTL indexes that enforce data
 * retention.
 *
 * Idempotent. Safe to run on every deploy, and intended to be.
 *
 *   npm run seed --workspace backend
 */

import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { logger } from '../src/lib/logger.js';
import { Message } from '../src/modules/contact/message.model.js';
import { VoiceSession } from '../src/modules/voice/voiceSession.model.js';

const MODELS = [Message, VoiceSession];

async function main() {
  logger.info({ uri: env.MONGODB_URI.replace(/\/\/.*@/, '//***@') }, 'connecting');
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  for (const model of MODELS) {
    // syncIndexes also drops indexes that are no longer declared, which keeps
    // the database matching the code rather than accumulating dead ones.
    const dropped = await model.syncIndexes();
    const indexes = await model.collection.indexes();
    logger.info(
      {
        collection: model.collection.collectionName,
        indexes: indexes.map((i) => i.name),
        dropped,
      },
      'indexes synced'
    );
  }

  await mongoose.connection.close();
  logger.info('done');
}

main().catch(async (error) => {
  logger.fatal({ err: error }, 'seed failed');
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
