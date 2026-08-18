'use client';

/**
 * THE CONSOLE STATE MACHINE.
 *
 * One axis governs everything: low resolution → full resolution. Going deeper
 * always means gaining resolution, and nothing in the build contradicts it.
 * BUILD_SPEC §4.
 *
 *   off → boot → menu → load → card → full
 *
 * B backs out one stage at a time. Exiting runs the transition in reverse.
 *
 * A reducer rather than a pile of useState calls, because the transitions are
 * the interesting part: `press('a')` means something different in every view,
 * and a switch over (state, action) is the only shape where that stays
 * readable and testable without a browser.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CHANNELS } from '@/content/channels';
import type { ChannelItem } from '@/content/types';

export type View = 'boot' | 'menu' | 'load' | 'card' | 'full';
export type Key = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start';

export const LOAD_BLOCKS = 22;

export interface ConsoleState {
  power: boolean;
  view: View;
  /** Channel index: 0 WORK, 1 ABOUT, 2 CONTACT. */
  channel: number;
  /** Selection index within the channel. */
  index: number;
  /** How many loading blocks have dropped. Drives the Tetris bar. */
  filled: number;
  /** Retained for compatibility with the loading reducer; no screen flash uses it. */
  clearing: boolean;
  /** Keep the stage mounted while its LCD-resolution exit plays. */
  transition: 'enter' | 'leave' | null;
  /** Slugs opened this session. Drives ceremony length: full once, short after. */
  seen: string[];
}

type Action =
  | { type: 'boot' }
  | { type: 'booted' }
  | { type: 'shutdown' }
  | { type: 'move'; delta: number }
  | { type: 'flick'; delta: number }
  | { type: 'select'; index: number }
  | { type: 'open' }
  | { type: 'tick' }
  | { type: 'clear' }
  | { type: 'card' }
  | { type: 'full' }
  | { type: 'leaveFull' }
  | { type: 'settleBack' }
  | { type: 'back' }
  | { type: 'skip' };

const initialState: ConsoleState = {
  power: true,
  view: 'boot',
  channel: 0,
  index: 0,
  filled: 0,
  clearing: false,
  transition: null,
  seen: [],
};

const itemsIn = (channel: number): ChannelItem[] => CHANNELS[channel]?.items ?? [];

const keyOf = (item: ChannelItem | undefined) => item?.slug ?? item?.title ?? '';

function reducer(state: ConsoleState, action: Action): ConsoleState {
  switch (action.type) {
    case 'boot':
      return { ...state, power: true, view: 'boot', filled: 0, clearing: false, transition: null };

    case 'booted':
      return state.view === 'boot' ? { ...state, view: 'menu' } : state;

    case 'shutdown':
      return { ...state, power: false, view: 'menu', filled: 0, clearing: false, transition: null };

    case 'move': {
      const items = itemsIn(state.channel);
      if (items.length === 0) return state;
      // Wraps, so a visitor holding down never hits a dead end.
      const next = (state.index + action.delta + items.length) % items.length;
      return { ...state, index: next };
    }

    case 'flick': {
      const next = state.channel + action.delta;
      // Deliberately clamped rather than wrapped: the chevrons in the LCD
      // header dim at the ends, and wrapping would make them a lie.
      if (next < 0 || next >= CHANNELS.length) return state;
      return { ...state, channel: next, index: 0 };
    }

    case 'select':
      return { ...state, index: action.index };

    case 'open': {
      const item = itemsIn(state.channel)[state.index];
      const key = keyOf(item);
      return {
        ...state,
        view: 'load',
        filled: 0,
        clearing: false,
        seen: state.seen.includes(key) ? state.seen : [...state.seen, key],
      };
    }

    case 'tick':
      return state.view === 'load' ? { ...state, filled: Math.min(LOAD_BLOCKS, state.filled + 1) } : state;

    /** Locks the completed bar while the card is prepared. */
    case 'clear':
      return state.view === 'load' ? { ...state, clearing: true, filled: LOAD_BLOCKS } : state;

    case 'card':
      return state.view === 'load' ? { ...state, view: 'card', clearing: false } : state;

    case 'full':
      return state.view === 'card' ? { ...state, view: 'full', transition: 'enter' } : state;

    case 'leaveFull':
      return state.view === 'full' ? { ...state, transition: 'leave' } : state;

    case 'settleBack':
      return state.view === 'full' && state.transition === 'leave'
        ? { ...state, view: 'card', transition: null }
        : state;

    case 'back': {
      if (state.view === 'full') return { ...state, transition: 'leave' };
      if (state.view === 'card' || state.view === 'load') {
        return { ...state, view: 'menu', filled: 0, clearing: false };
      }
      return state;
    }

    /** Holding B or pressing START jumps straight through the ceremony. */
    case 'skip':
      return state.view === 'load' ? { ...state, filled: LOAD_BLOCKS } : state;

    default:
      return state;
  }
}

export function useConsole(reducedMotion: boolean) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const skipRef = useRef(false);

  const items = itemsIn(state.channel);
  const current = items[state.index];

  /* --- Boot ------------------------------------------------------------- */
  useEffect(() => {
    if (state.view !== 'boot') return;
    const delay = reducedMotion ? 0 : 620;
    const timer = setTimeout(() => dispatch({ type: 'booted' }), delay);
    return () => clearTimeout(timer);
  }, [state.view, reducedMotion]);

  /* --- The loading ceremony ---------------------------------------------
     Full ceremony the first time a project is opened, abbreviated on later
     opens in the same session. BUILD_SPEC §7. Driven by one interval rather
     than a chain of awaited timeouts so it can be cancelled cleanly when the
     visitor backs out mid-load — the original had to guard for that after the
     fact, and this cannot get into that state at all. */
  useEffect(() => {
    if (state.view !== 'load') return;

    const first = !state.seen.slice(0, -1).includes(keyOf(current));
    const total = reducedMotion ? 0 : first ? 1400 : 520;
    const step = total / LOAD_BLOCKS;

    if (total === 0) {
      dispatch({ type: 'clear' });
      const straight = setTimeout(() => dispatch({ type: 'card' }), 0);
      return () => clearTimeout(straight);
    }

    let cancelled = false;
    const interval = setInterval(() => {
      if (cancelled) return;
      if (skipRef.current) {
        dispatch({ type: 'skip' });
        return;
      }
      dispatch({ type: 'tick' });
    }, step);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // `current` is derived from channel+index, which cannot change while the
    // view is 'load' — no control does both.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.view, reducedMotion]);

  /** Bar full → card. The amber LCD remains visible throughout. */
  useEffect(() => {
    if (state.view !== 'load' || state.filled < LOAD_BLOCKS) return;

    dispatch({ type: 'clear' });
    const timer = setTimeout(() => dispatch({ type: 'card' }), reducedMotion ? 0 : 220);
    return () => clearTimeout(timer);
  }, [state.view, state.filled, reducedMotion]);

  useEffect(() => {
    if (state.view !== 'full' || state.transition !== 'leave') return;
    const timer = setTimeout(() => dispatch({ type: 'settleBack' }), reducedMotion ? 0 : 300);
    return () => clearTimeout(timer);
  }, [state.view, state.transition, reducedMotion]);

  /* --- Input ------------------------------------------------------------- */

  const press = useCallback(
    (key: Key) => {
      if (!state.power) {
        if (key === 'start') dispatch({ type: 'boot' });
        return;
      }

      switch (key) {
        case 'up':
          if (state.view === 'menu') dispatch({ type: 'move', delta: -1 });
          break;
        case 'down':
          if (state.view === 'menu') dispatch({ type: 'move', delta: 1 });
          break;

        /**
         * Contextual, by depth. On the menu, left/right change channel. On the
         * card, they step through items. Inside the full view they step
         * through images — which the Stage owns, because only it knows where
         * the artwork is. BUILD_SPEC §5.
         */
        case 'left':
          if (state.view === 'menu') dispatch({ type: 'flick', delta: -1 });
          else if (state.view === 'card') dispatch({ type: 'move', delta: -1 });
          break;
        case 'right':
          if (state.view === 'menu') dispatch({ type: 'flick', delta: 1 });
          else if (state.view === 'card') dispatch({ type: 'move', delta: 1 });
          break;

        case 'a':
          if (state.view === 'menu') dispatch({ type: 'open' });
          else if (state.view === 'card') dispatch({ type: 'full' });
          break;

        case 'b':
          skipRef.current = true;
          dispatch({ type: 'back' });
          break;

        case 'start':
          if (state.view === 'load') {
            skipRef.current = true;
            dispatch({ type: 'skip' });
            break;
          }
          dispatch({ type: 'shutdown' });
          break;
      }
    },
    [state.power, state.view]
  );

  /** Clicking a row must work without learning the D-pad. */
  const openAt = useCallback((index: number) => {
    skipRef.current = false;
    dispatch({ type: 'select', index });
    dispatch({ type: 'open' });
  }, []);

  const closeFull = useCallback(() => dispatch({ type: 'leaveFull' }), []);

  useEffect(() => {
    if (state.view !== 'load') skipRef.current = false;
  }, [state.view]);

  return {
    state,
    items,
    current,
    channel: CHANNELS[state.channel],
    channelCount: CHANNELS.length,
    press,
    openAt,
    closeFull,
    setSkip: (value: boolean) => {
      skipRef.current = value;
    },
  };
}
