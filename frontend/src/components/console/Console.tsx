'use client';

/**
 * THE CONSOLE.
 *
 * A physical object, drawn in CSS, matching sprites/00-console-locked-
 * reference.png. Charcoal brick-game body, amber LCD, D-pad left, A and B
 * right, START, and a small power LED that follows the machine state.
 *
 * There is no POWER button and no SELECT button. The lamp is a lamp; START
 * boots and shuts down. BUILD_SPEC §5.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useConsole, type Key } from '@/hooks/useConsole';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { MenuView } from '../lcd/MenuView';
import { LoadView } from '../lcd/LoadView';
import { CardView } from '../lcd/CardView';
import { Stage, stepImage } from '../stage/Stage';
import { playInterfaceSound } from '@/lib/interfaceSound';
import { SoundToggle } from '../system/SoundToggle';

/** Keyboard equivalents: arrows, A / Enter, B / Escape, S for start. */
const KEYS: Record<string, Key> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  a: 'a',
  A: 'a',
  Enter: 'a',
  b: 'b',
  B: 'b',
  Escape: 'b',
  s: 'start',
  S: 'start',
};

export function Console() {
  const reducedMotion = useReducedMotion();
  const { state, items, current, channel, channelCount, press, openAt, closeFull, setSkip } =
    useConsole(reducedMotion);

  /** Which control is lit, so a keypress looks like a button being pressed. */
  const [held, setHeld] = useState<Key | null>(null);

  const flash = useCallback((key: Key) => {
    setHeld(key);
    setTimeout(() => setHeld((current) => (current === key ? null : current)), 110);
  }, []);

  const handle = useCallback(
    (key: Key) => {
      /**
       * The full view owns left/right while it is open — at that depth the
       * contextual control steps through images, not through list items.
       */
      if (state.view === 'full' && (key === 'left' || key === 'right')) {
        stepImage(key === 'left' ? -1 : 1);
        playInterfaceSound('move');
        return;
      }
      const sound =
        key === 'start'
          ? 'power'
          : key === 'a'
            ? 'open'
            : key === 'b'
              ? 'back'
              : key === 'left' || key === 'right'
                ? 'channel'
                : 'move';
      playInterfaceSound(sound);
      press(key);
    },
    [press, state.view]
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = KEYS[event.key];
      if (!key) return;

      const target = event.target;
      if (target instanceof Element) {
        /**
         * Never hijack a text field. The CAT password lives in one, and so
         * does the contact form — typing "a" there must type an "a", not open
         * a project underneath the visitor.
         */
        if (target.closest('input, textarea, select, [contenteditable]')) return;

        /**
         * When a link or a non-console button has focus, let the browser have
         * the keys it activates elements with — Enter and Space — and nothing
         * else. Enter is mapped to A here, and swallowing it broke the skip
         * link: a keyboard visitor could focus "Skip the console" and pressing
         * Enter did nothing at all. An E2E test caught that.
         *
         * Scoped to those two keys deliberately. A first attempt handed the
         * focused element *every* key, which broke the opposite promise: with
         * the stage's Back button focused, "B" stopped backing out. B, S and
         * the arrows mean nothing to a button, so they still belong to the
         * console wherever focus happens to be.
         *
         * Console controls carry data-key and are never excluded, so the D-pad
         * and face buttons keep working when focused.
         */
        const activating = event.key === 'Enter' || event.key === ' ';
        const interactive = target.closest('a[href], button, [role="button"]');
        if (activating && interactive && !interactive.hasAttribute('data-key')) return;
      }

      event.preventDefault();
      if (event.key === 'b' || event.key === 'B') setSkip(true);
      handle(key);
      flash(key);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handle, flash, setSkip]);

  useEffect(() => {
    if (state.view === 'load' && state.filled === 22) playInterfaceSound('complete');
    if (state.view === 'full' && state.transition === 'enter') playInterfaceSound('transition');
  }, [state.view, state.filled, state.transition]);

  const heldAttr = (key: Key) => (held === key ? 'true' : undefined);

  return (
    <>
      <main className="room">
        <div className="console">
          <div className="console__lip" />

          <div className="console__bezel">
            <span className="console__lamp" data-power={state.power ? 'on' : 'off'} />
            <span className="console__lamp-label">POWER</span>

            <div
              className="lcd"
              data-power={state.power ? 'on' : 'off'}
            >
              <div className="off">PRESS START</div>

              <div
                className="lcd__screen"
                id="console-screen"
                role="application"
                aria-label="Console screen. Use arrow keys to move, A or Enter to open, B or Escape to go back."
              >
                {state.power && state.view === 'boot' ? (
                  <div className="boot">
                    INAM SHERAZ
                    <br />
                    ●●●
                  </div>
                ) : null}

                {state.power && state.view === 'menu' ? (
                  <MenuView
                    channel={channel!}
                    items={items}
                    index={state.index}
                    atFirstChannel={state.channel === 0}
                    atLastChannel={state.channel === channelCount - 1}
                    onSelect={openAt}
                  />
                ) : null}

                {state.power && state.view === 'load' ? (
                  <LoadView item={current} filled={state.filled} />
                ) : null}

                {state.power && (state.view === 'card' || state.view === 'full') && current ? (
                  <CardView item={current} position={state.index + 1} total={items.length} />
                ) : null}
              </div>
            </div>
          </div>

          <div className="console__controls">
            <div className="start">
              <button
                className="start__btn"
                data-key="start"
                data-held={heldAttr('start')}
                aria-label="Start — turn the console on or off"
                onClick={() => handle('start')}
              />
              <span className="start__label">START</span>
            </div>

            <div className="dpad">
              <div className="dpad__plate" />
              {(['up', 'down', 'left', 'right'] as const).map((key) => (
                <button
                  key={key}
                  className="dpad__key"
                  data-key={key}
                  data-held={heldAttr(key)}
                  aria-label={key[0]!.toUpperCase() + key.slice(1)}
                  onClick={() => handle(key)}
                />
              ))}
              <div className="dpad__hub" />
            </div>

            <div className="face">
              <button
                className="face__btn"
                data-key="a"
                data-held={heldAttr('a')}
                aria-label="A — open"
                onClick={() => handle('a')}
              />
              <button
                className="face__btn"
                data-key="b"
                data-held={heldAttr('b')}
                aria-label="B — back"
                onClick={() => {
                  setSkip(true);
                  handle('b');
                }}
              />
              <span className="face__label" data-for="a">
                A
              </span>
              <span className="face__label" data-for="b">
                B
              </span>
            </div>
          </div>
        </div>

        <div className="console__instructions" aria-label="Console controls">
          ▲▼ SELECT&nbsp;&nbsp;&nbsp; ◀▶ CHANNEL&nbsp;&nbsp;&nbsp; A OPEN&nbsp;&nbsp;&nbsp; B BACK&nbsp;&nbsp;&nbsp; START POWER
        </div>
        <SoundToggle />

        {/**
         * The escape hatch. Outside the console, always visible, no controls
         * to learn. BUILD_SPEC §5 — this is how a hiring manager with thirty
         * seconds gets to the work, and it is not optional.
         */}
        <Link className="hatch" href="/everything">
          VIEW EVERYTHING AS ONE PAGE{' '}
          <span className="hatch__arrow" aria-hidden="true">
            →
          </span>
        </Link>
      </main>

      {state.view === 'full' && current ? (
        <Stage item={current} onClose={closeFull} transition={state.transition} />
      ) : null}
    </>
  );
}
