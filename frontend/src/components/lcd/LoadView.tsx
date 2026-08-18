/**
 * STAGE 2 — LOADING.
 *
 * A 1-bit sprite specific to the project, then a bar made of falling blocks
 * that stack up, Tetris-style. The amber LCD stays visible throughout; the
 * card appears when the bar is full. BUILD_SPEC §7.
 */

import { LOAD_BLOCKS } from '@/hooks/useConsole';
import type { ChannelItem } from '@/content/types';
import { LoadingSprite } from './LoadingSprite';

export function LoadView({ item, filled }: { item: ChannelItem | undefined; filled: number }) {
  return (
    <div className="load">
      {item?.sprite ? (
        <LoadingSprite slug={item.slug} src={item.sprite} />
      ) : (
        /* Fallback when a project has no sprite asset yet. */
        <div className="load__sprite load__sprite--tbd">
          SPRITE
          <br />
          TO&nbsp;COME
        </div>
      )}

      <div className="load__bar">
        {Array.from({ length: LOAD_BLOCKS }, (_, i) => (
          <i key={i} className="load__blk" data-filled={i < filled ? 'true' : undefined} />
        ))}
      </div>

      <div className="load__label">LOADING…</div>
    </div>
  );
}
