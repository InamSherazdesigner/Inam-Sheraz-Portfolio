'use client';

/**
 * STAGE 5 — THE FULL VIEW.
 *
 * The screen has become the whole window. The ground is the same amber as the
 * LCD, carrying the same faint pixel grid, and a slim console bar stays pinned
 * at the top so the object is still present. The visitor has not left the
 * screen — the screen got bigger. BUILD_SPEC §7.
 *
 * Artwork normally sits directly on its project ground. LIMINAL opts into a
 * paper-like mat because that treatment belongs to its black-and-white system.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Doc } from '../blocks/Doc';
import { isProject, type ChannelItem } from '@/content/types';
import { playInterfaceSound } from '@/lib/interfaceSound';

/** Pick the artwork nearest the vertical centre of the scroll container. */
function artworkInFocus(container: HTMLElement): HTMLElement | null {
  const plates = [...container.querySelectorAll<HTMLElement>('[data-artwork-bg]')].filter(
    (plate) => plate.offsetParent !== null
  );
  if (plates.length === 0) return null;

  const middle = container.scrollTop + container.clientHeight / 2;
  let best: HTMLElement | null = null;
  let bestDist = Infinity;

  for (const plate of plates) {
    const center = plate.offsetTop + plate.offsetHeight / 2;
    const dist = Math.abs(center - middle);
    if (dist < bestDist) {
      bestDist = dist;
      best = plate;
    }
  }

  return best;
}

interface StageProps {
  item: ChannelItem;
  onClose: () => void;
  transition: 'enter' | 'leave' | null;
}

export function Stage({ item, onClose, transition }: StageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const defaultGround = isProject(item) ? item.ground : undefined;

  const syncBackdrop = useCallback(() => {
    const stage = ref.current;
    if (!stage) return;

    const focused = artworkInFocus(stage);
    const next = focused?.dataset.artworkBg ?? defaultGround;
    if (next) stage.style.setProperty('--ground', next);
  }, [defaultGround]);

  /**
   * Focus moves into the overlay on open and the page behind it stops
   * scrolling. Without both, a keyboard visitor is left tabbing through a
   * document they cannot see, and a phone visitor scrolls the body under the
   * overlay instead of the overlay itself.
   */
  useEffect(() => {
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
    syncBackdrop();
  }, [item.slug, syncBackdrop]);

  /** Tint the full-view backdrop to match whichever artwork is centred. */
  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;

    syncBackdrop();
    stage.addEventListener('scroll', syncBackdrop, { passive: true });
    return () => stage.removeEventListener('scroll', syncBackdrop);
  }, [item.slug, syncBackdrop]);

  /**
   * A modal must not leak focus to the page behind it. Tab from the last
   * element wraps to the first and vice versa; Escape closes, which is what
   * every other dialog on the web does and what B does on the console.
   */
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        playInterfaceSound('back');
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = ref.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), video[controls], audio[controls], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  return (
    <div
      className={`stage stage--${item.slug}`}
      data-transition={transition ?? undefined}
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onKeyDown={onKeyDown}
      /* Project ground is content-owned; LIMINAL's near-white treatment is
         especially important to its black-and-white system. */
      style={
        isProject(item) && item.ground
          ? ({ ['--ground' as string]: item.ground } as React.CSSProperties)
          : undefined
      }
    >
      {item.sprite ? (
        <div
          className="stage__sprite-dissolve"
          aria-hidden="true"
          style={{ backgroundImage: `url(${item.sprite})` }}
        />
      ) : null}
      <div className="stage__bar">
        <span className="stage__lamp" />
        <span className="stage__id">{isProject(item) ? item.id : '—'}</span>
        <span className="stage__now">{item.title}</span>
        <button
          className="stage__back"
          type="button"
          onClick={() => {
            playInterfaceSound('back');
            onClose();
          }}
          ref={closeRef}
        >
          B BACK
        </button>
      </div>

      <article className="stage__doc res">
        {item.subtitle ? <p className="stage__eyebrow">{item.subtitle}</p> : null}
        <h1 className="stage__title">{item.title}</h1>
        <Doc item={item} priority />
      </article>
    </div>
  );
}

/**
 * D-pad left / right inside an open project steps through the images, which is
 * what the contextual control means at this depth. BUILD_SPEC §5.
 *
 * Exported separately because the console owns the buttons and the stage owns
 * the DOM they act on. The container is resolved from the document rather than
 * passed down a ref: `.stage` is the scrolling box, and only one is ever open,
 * so threading a ref through would add indirection without adding certainty.
 * The parameter exists so a test can hand in its own element.
 */
export function stepImage(direction: number, container?: HTMLElement | null) {
  const box = container ?? document.querySelector<HTMLElement>('.stage');
  if (!box) return;

  const plates = [...box.querySelectorAll<HTMLElement>('.plate')].filter(
    (plate) => plate.offsetParent !== null
  );
  if (plates.length === 0) return;

  const middle = box.scrollTop + box.clientHeight / 2;
  let index = plates.findIndex((plate) => plate.offsetTop + plate.offsetHeight / 2 > middle);
  if (index === -1) index = plates.length - 1;

  const target = plates[Math.min(plates.length - 1, Math.max(0, index + direction))];
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
