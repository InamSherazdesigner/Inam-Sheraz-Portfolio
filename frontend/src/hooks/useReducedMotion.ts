'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * `prefers-reduced-motion` cuts every transition instantly, with no animation.
 * BUILD_SPEC §7 — a hard requirement, not a nicety.
 *
 * useSyncExternalStore rather than useEffect + useState. A media query is
 * exactly what this hook is for: browser-owned state that React has to read
 * and subscribe to. Reading it in an effect and then setting state means the
 * first paint animates before the second render turns it off — which is the
 * one frame a visitor who set this preference must not be shown.
 *
 * The server snapshot is `false` so the markup React renders on the server and
 * the markup it expects on the client agree. The real value arrives during
 * hydration, before paint.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Listened to rather than read once: the setting can be toggled
    // mid-session, and someone who turns it on because the loading ceremony
    // made them ill should not have to reload to be believed.
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  );
}
