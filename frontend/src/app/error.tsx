'use client';

/**
 * ROUTE ERROR BOUNDARY.
 *
 * A render failure must not leave a blank page. The visitor gets a way out and
 * a digest they can quote; the detail goes to the console for a developer and
 * never onto the screen.
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[render]', error);
  }, [error]);

  return (
    <div className="crash">
      <h1>The screen went dark</h1>
      <p>
        Something failed while rendering this page. The work is all still on the one-page view,
        which does not depend on whatever broke here.
        {error.digest ? ` Reference: ${error.digest}.` : ''}
      </p>
      <div className="crash__actions">
        <button type="button" onClick={reset}>
          TRY AGAIN
        </button>
        <Link href="/everything">VIEW EVERYTHING</Link>
      </div>
    </div>
  );
}
