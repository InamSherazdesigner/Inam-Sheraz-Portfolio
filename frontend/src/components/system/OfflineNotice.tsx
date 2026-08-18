'use client';

/**
 * OFFLINE STATE.
 *
 * The artwork and the words are already in the page, so losing the network
 * does not stop someone reading the portfolio — it stops the voice agent and
 * the contact form, which are the only two things that need a server.
 *
 * So this says exactly that, and nothing more. A modal or a full-page takeover
 * would be a bigger interruption than the problem it is reporting.
 *
 * `navigator.onLine` is browser-owned state with its own event pair, which is
 * precisely what useSyncExternalStore exists for. The server snapshot is
 * "online" so the server and client markup agree on the first render.
 */

import { useCallback, useSyncExternalStore } from 'react';

export function OfflineNotice() {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener('offline', onChange);
    window.addEventListener('online', onChange);
    return () => {
      window.removeEventListener('offline', onChange);
      window.removeEventListener('online', onChange);
    };
  }, []);

  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  );

  if (online) return null;

  return (
    <div className="offline" role="status" aria-live="polite">
      OFFLINE — the work is still readable. The voice agent and the contact form need a connection.
    </div>
  );
}
