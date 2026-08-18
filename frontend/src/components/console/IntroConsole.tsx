'use client';

import { useCallback, useEffect, useState } from 'react';
import { INTRO_QUOTES } from '@/content/intro';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { playInterfaceSound } from '@/lib/interfaceSound';
import HeroSection from '../HeroSection';

type IntroPhase = 'quote' | 'resolve' | 'console';

const RESOLVE_MS = 520;

export function IntroConsole() {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<IntroPhase>('quote');
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  const finish = useCallback(() => {
    if (phase !== 'quote') return;
    playInterfaceSound('power');
    if (reducedMotion) {
      setPhase('console');
      return;
    }
    setPhase('resolve');
    window.setTimeout(() => setPhase('console'), RESOLVE_MS);
  }, [phase, reducedMotion]);

  // Keep quotes cycling on continuous loop until visitor presses A / Enter / Start or clicks
  useEffect(() => {
    if (phase !== 'quote') return;
    const interval = window.setInterval(() => {
      setQuoteVisible(false);
      window.setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % INTRO_QUOTES.length);
        setQuoteVisible(true);
      }, 350);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'quote') return;
    const skip = (event: KeyboardEvent) => {
      if (!['Enter', ' ', 'Spacebar', 'a', 'A', 's', 'S'].includes(event.key)) return;
      event.preventDefault();
      finish();
    };
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [finish, phase]);

  return (
    <>
      {phase !== 'quote' ? <HeroSection /> : null}
      {phase !== 'console' ? (
        <section
          className={`intro${phase === 'resolve' ? ' intro--resolve' : ''}`}
          aria-label="Portfolio introduction"
          onClick={finish}
        >
          <p
            className="intro__quote"
            style={{
              transition: 'opacity 350ms ease, transform 350ms ease',
              opacity: quoteVisible ? 1 : 0,
              transform: quoteVisible ? 'scale(1)' : 'scale(0.98)',
              minHeight: '4.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {INTRO_QUOTES[quoteIndex]}
          </p>
          <button type="button" className="intro__skip" onClick={finish}>
            START / A / ENTER TO CONTINUE
          </button>
          <a
            className="intro__hatch"
            href="/everything"
            onClick={(e) => {
              e.stopPropagation();
              playInterfaceSound('open');
            }}
          >
            VIEW EVERYTHING AS ONE PAGE
          </a>
        </section>
      ) : null}
    </>
  );
}
