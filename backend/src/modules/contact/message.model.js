/**
 * CONTACT MESSAGE.
 *
 * This holds personal data — a name, an email, a message body — so it carries
 * the obligations that come with that: minimal fields, a stated retention
 * period, and a documented deletion path (docs/05-security.md, "Right to
 * erasure"). Nothing is collected that is not needed to reply.
 */

import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    subject: { type: String, trim: true, maxlength: 200, default: '' },
    body: { type: String, required: true, trim: true, maxlength: 5000 },

    // --- Audit columns -----------------------------------------------------
    requestId: { type: String, required: true },
    clientHash: { type: String, required: true },
    status: {
      type: String,
      enum: ['new', 'read', 'replied', 'spam'],
      default: 'new',
      index: true,
    },
    // Soft delete. A message is never destroyed by a handling mistake; it is
    // marked and swept later by the retention job.
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
    collection: 'messages',
  }
);

/** The inbox query: newest first, deleted excluded. */
messageSchema.index({ createdAt: -1, deletedAt: 1 });

/**
 * Retention: two years from creation. An enquiry older than that has either
 * been answered or is not going to be, and keeping it is a liability rather
 * than an asset.
 */
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

export const Message = mongoose.model('Message', messageSchema);
