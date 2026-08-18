'use client';

import { useEffect, useState } from 'react';
import { setInterfaceMuted } from '@/lib/interfaceSound';

export function SoundToggle() {
  const [muted, setMuted] = useState(false);
  useEffect(() => setInterfaceMuted(muted), [muted]);
  return (
    <button
      className="sound-toggle"
      type="button"
      aria-pressed={muted}
      onClick={() => setMuted((value) => !value)}
    >
      SOUND {muted ? 'OFF' : 'ON'}
    </button>
  );
}
