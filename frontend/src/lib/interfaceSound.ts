'use client';

/** Tiny synthesized interface sounds. No assets are fetched and no sound is
 * created until an interaction asks for one. */
export type InterfaceSound = 'move' | 'open' | 'back' | 'power' | 'channel' | 'complete' | 'transition';

let muted = false;
let context: AudioContext | undefined;

export function setInterfaceMuted(next: boolean) {
  muted = next;
}

export function playInterfaceSound(kind: InterfaceSound) {
  if (muted || typeof window === 'undefined') return;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  context ??= new Audio();
  if (context.state === 'suspended') void context.resume();

  const now = context.currentTime;
  const specs: Record<InterfaceSound, [number, number, number]> = {
    move: [540, 0.035, 0.12],
    open: [740, 0.07, 0.18],
    back: [300, 0.055, 0.15],
    power: [180, 0.11, 0.2],
    channel: [620, 0.045, 0.14],
    complete: [880, 0.09, 0.16],
    transition: [420, 0.16, 0.15],
  };
  const [frequency, duration, volume] = specs[kind];
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(70, frequency * (kind === 'back' ? 0.55 : 1.35)), now + duration);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
