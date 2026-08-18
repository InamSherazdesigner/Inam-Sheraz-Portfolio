/**
 * VOICE SESSION AUDIT ROW.
 *
 * One document per session minted. This is the cost ledger and the abuse
 * trail: it answers "how many sessions did we hand out yesterday, to how many
 * distinct visitors, and how many failed".
 *
 * What is NOT stored, ever:
 *   - the signed URL           (it is a bearer token)
 *   - the API key              (obviously)
 *   - conversation audio or transcripts  (they never pass through this server;
 *     the browser talks to ElevenLabs directly)
 *
 * The IP is stored as a salted SHA-256 hash. Rate-limit forensics only needs
 * to know that two requests came from the same place, not where that place is
 * — so the identifying value is never written down. GDPR data-minimisation.
 */

import mongoose from 'mongoose';

const voiceSessionSchema = new mongoose.Schema(
  {
    requestId: { type: String, required: true, index: true },
    provider: { type: String, required: true, enum: ['elevenlabs', 'mock'] },
    agentId: { type: String, required: true },
    outcome: {
      type: String,
      required: true,
      enum: ['issued', 'failed'],
      index: true,
    },
    errorCode: { type: String, default: null },
    latencyMs: { type: Number, required: true, min: 0 },
    /** SHA-256 of (ip + per-boot salt). Not reversible to an address. */
    clientHash: { type: String, required: true, index: true },
    origin: { type: String, default: null },
    userAgent: { type: String, default: null, maxlength: 300 },
    expiresAt: { type: Date, default: null },
  },
  {
    timestamps: true, // createdAt / updatedAt — the audit columns
    versionKey: false,
    collection: 'voice_sessions',
  }
);

/** Cost reporting: sessions per day, grouped by outcome. */
voiceSessionSchema.index({ createdAt: -1, outcome: 1 });

/**
 * Retention: 90 days, enforced by Mongo rather than by a cron nobody runs.
 * Long enough to investigate a billing spike, short enough that we are not
 * sitting on a year of behavioural data for no reason.
 */
voiceSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const VoiceSession = mongoose.model('VoiceSession', voiceSessionSchema);
