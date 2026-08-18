/**
 * PSEUDONYMISATION.
 *
 * Audit rows need to tell one visitor apart from another. They do not need to
 * know who either visitor is. Hashing with a salt that is generated fresh at
 * every boot means the rows are correlatable within a run and not correlatable
 * across a restart — and a dump of the collection reveals no addresses at all.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const SALT = randomBytes(32);

export function hashClient(value) {
  return createHash('sha256')
    .update(SALT)
    .update(String(value ?? 'unknown'))
    .digest('hex')
    .slice(0, 32);
}

/**
 * Constant-time string comparison for the CAT gate.
 *
 * A plain `===` on a secret leaks its length and, in principle, its prefix
 * through timing. This costs nothing and removes the question. Both sides are
 * hashed first so the comparison is always over equal-length buffers —
 * timingSafeEqual throws on a length mismatch, which would itself be a leak.
 */
export function safeEqual(a, b) {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}
