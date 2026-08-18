'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Console } from '@/components/console/Console';
import DEFAULT_COMPOSITION from '@/content/heroComposition.json';
import '@/styles/hero.css';

// Types
export interface ItemConfig {
  id: string;
  name: string;
  src?: string;
  awakeSrc?: string;
  top: number;
  left: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
  fontSize?: number;
  type?: 'item' | 'box' | 'bubble' | 'cat' | 'catTag' | 'character';
  boxKey?: string;
  catId?: string;
  desc?: string;
  text?: string;
  anim?: string;
}

export interface FrameConfig {
  width?: number;
  height: number;
  borderWidth: number;
  borderRadius: number;
  glow?: number;
}

export interface CatLiveState {
  catId?: string;
  isAwake: boolean;
  purrCount: number;
  purring: boolean;
}

const DEFAULT_FRAME: FrameConfig = DEFAULT_COMPOSITION.frame;
const DEFAULT_LAYOUT: Record<string, ItemConfig> = (DEFAULT_COMPOSITION.layout || (DEFAULT_COMPOSITION as unknown as { items: Record<string, ItemConfig> }).items) as Record<string, ItemConfig>;

const stripEmojis = (str: string) => {
  return str
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
};

let sharedAudioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
      }
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
};

// 8-bit Retro Web Audio Sound Effects for Cat Interactions (Progressive Purr & Chimes)
const playRetroCatSound = (type: 'purr' | 'purr1' | 'purr2' | 'wake' | 'sleep') => {
  if (typeof window === 'undefined') return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    if (type === 'purr' || type === 'purr1' || type === 'purr2') {
      const isSecond = type === 'purr2';
      const baseFreq = isSecond ? 140 : 115;
      const chirpFreq = isSecond ? 740 : 587;

      // 1. High-pitch cute cat chirp/meow blip
      const chirpOsc = ctx.createOscillator();
      const chirpGain = ctx.createGain();
      chirpOsc.type = 'triangle';
      chirpOsc.frequency.setValueAtTime(chirpFreq, now);
      chirpOsc.frequency.exponentialRampToValueAtTime(chirpFreq * 1.25, now + 0.08);
      chirpOsc.frequency.exponentialRampToValueAtTime(chirpFreq * 0.85, now + 0.18);

      chirpGain.gain.setValueAtTime(0, now);
      chirpGain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      chirpOsc.connect(chirpGain);
      chirpGain.connect(ctx.destination);
      chirpOsc.start(now);
      chirpOsc.stop(now + 0.2);

      // 2. Warm 8-bit purr vibration rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq + 35, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(baseFreq - 20, now + 0.32);

      lfo.type = 'sawtooth';
      lfo.frequency.setValueAtTime(isSecond ? 30 : 25, now);
      lfoGain.gain.setValueAtTime(32, now);
      lfo.connect(osc.frequency);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

      osc.connect(gain);
      gain.connect(ctx.destination);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 0.36);
      osc.stop(now + 0.36);
    } else if (type === 'wake') {
      // 8-bit cheerful wake-up arpeggio (C5 -> E5 -> G5 -> C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, now + i * 0.055);

        gain.gain.setValueAtTime(0.1, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.055 + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.055);
        osc.stop(now + (i + 1) * 0.055 + 0.05);
      });
    } else if (type === 'sleep') {
      // 8-bit sleepy descending chirp (G5 -> E5 -> C5)
      const freqs = [783.99, 659.25, 523.25];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + i * 0.075);

        gain.gain.setValueAtTime(0.09, now + i * 0.075);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * 0.075 + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.075);
        osc.stop(now + (i + 1) * 0.075 + 0.045);
      });
    }
  } catch {
    // Ignore audio policy restriction
  }
};

export default function HeroSection() {
  const [layout, setLayout] = useState<Record<string, ItemConfig>>(() => {
    const clean: Record<string, ItemConfig> = {};
    Object.entries(DEFAULT_LAYOUT).forEach(([k, v]) => {
      clean[k] = {
        ...v,
        name: stripEmojis(v.name),
        text: v.text ? stripEmojis(v.text) : undefined,
        rotation: k === 'cat_zubair' ? 0 : v.rotation,
      };
    });
    return clean;
  });

  const frame: FrameConfig = DEFAULT_FRAME;
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number; text?: string }[]>([]);
  const [catsState, setCatsState] = useState<Record<string, CatLiveState>>({});

  const [mobileScale, setMobileScale] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive mobile scaling
  useEffect(() => {
    const updateScale = () => {
      const screenW = typeof window !== 'undefined' ? (document.documentElement.clientWidth || window.innerWidth) : 1200;
      const baseW = 980;
      if (screenW < 1060) {
        // 40px safe buffer (20px left + 20px right) so both border lines & shadows have clear space
        const availableW = Math.max(260, screenW - 40);
        setMobileScale(availableW / baseW);
      } else {
        setMobileScale(1);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Load from localStorage if present
  useEffect(() => {
    try {
      const keys = [
        'hero_custom_layout_final_v10',
        'hero_custom_layout_final_v9',
        'hero_custom_layout_final_v8',
        'hero_custom_layout_final_v7',
      ];
      for (const k of keys) {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          const sanitized: Record<string, ItemConfig> = {};
          Object.entries(parsed).forEach(([pk, pv]) => {
            if (pk === 'portfolioHeading') return;
            const item = pv as ItemConfig;
            sanitized[pk] = {
              ...item,
              name: stripEmojis(item.name),
              text: item.text ? stripEmojis(item.text) : undefined,
              rotation: pk === 'cat_zubair' ? 0 : item.rotation,
            };
          });
          if (sanitized.character) {
            sanitized.character.src = '/hero/Inam_transparent_idle_loop.webm';
          }
          if (sanitized.cat_zubair) {
            sanitized.cat_zubair.rotation = 0;
          }
          delete sanitized.portfolioHeading;
          setLayout(sanitized);
          break;
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  // Cat Click Handler
  const handleCatClick = useCallback((e: React.MouseEvent, targetId: string, item: ItemConfig) => {
    e.stopPropagation();

    const currentState = catsState[targetId] || {
      isAwake: false,
      purrCount: 0,
      purring: false,
    };

    if (currentState.isAwake) {
      // 1 click puts cat back to sleep
      playRetroCatSound('sleep');
      const heartId = Date.now() + Math.random();
      const newHeart = {
        id: heartId,
        x: item.left + item.width / 2 - 12 + (Math.random() * 20 - 10),
        y: item.top - 10,
        text: 'nap time',
      };
      setHearts((prev) => [...prev, newHeart]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== heartId)), 1200);

      setCatsState((prev) => ({
        ...prev,
        [targetId]: {
          ...currentState,
          isAwake: false,
          purrCount: 0,
          purring: true,
        },
      }));
    } else {
      // Sleeping: needs 3 purrs to wake up
      const nextPurrs = currentState.purrCount + 1;
      const willWake = nextPurrs >= 3;

      if (willWake) {
        playRetroCatSound('wake');
      } else if (nextPurrs === 1) {
        playRetroCatSound('purr1');
      } else {
        playRetroCatSound('purr2');
      }

      const message = willWake ? 'Woke up!' : `purr (${nextPurrs}/3)`;
      const heartId = Date.now() + Math.random();
      const newHeart = {
        id: heartId,
        x: item.left + item.width / 2 - 12 + (Math.random() * 20 - 10),
        y: item.top - 10,
        text: message,
      };
      setHearts((prev) => [...prev, newHeart]);
      setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== heartId)), 1200);

      setCatsState((prev) => ({
        ...prev,
        [targetId]: {
          ...currentState,
          purrCount: willWake ? 0 : nextPurrs,
          isAwake: willWake,
          purring: true,
        },
      }));
    }

    setTimeout(() => {
      setCatsState((prev) => {
        if (!prev[targetId]) return prev;
        return {
          ...prev,
          [targetId]: {
            ...prev[targetId],
            purring: false,
          },
        };
      });
    }, 400);
  }, [catsState]);

  // Box Content Renderers
  const renderBoxContent = (boxKey?: string, fontSize?: number) => {
    const fs = fontSize || 14;
    const isMobileFont = mobileScale < 0.6;
    const computedFontSize = isMobileFont ? `${Math.max(10, fs - 2)}px` : `${fs}px`;

    switch (boxKey) {
      case 'profile':
        return (
          <div
            style={{
              backgroundColor: '#0a0a0c',
              border: '1px solid #FFA827',
              borderRadius: '2px',
              fontFamily: 'monospace',
              color: '#FFA827',
              boxShadow: '3px 3px 0px #000',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#FFA827',
                color: '#000000',
                padding: '3px 6px',
                fontSize: `${Math.max(10, fs - 2)}px`,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              <span>PROFILE.EXE</span>
              <span>[X]</span>
            </div>
            <div style={{ padding: '0.65rem 0.85rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: computedFontSize, lineHeight: '1.45', color: '#FFA827' }}>
                <li>- Visual Comm-</li>
                <li>Designer</li>
                <li>- Branding, UI/UX,</li>
                <li>Motion, Animation</li>
                <li>& Illustration</li>
                <li>- <a href="/M.Inam Sheraz.pdf" target="_blank" download="M.Inam Sheraz.pdf" style={{ color: '#FFA827', textDecoration: 'underline', fontWeight: 800 }}>[ CV / RESUME ↗ ]</a></li>
              </ul>
            </div>
          </div>
        );

      case 'trivia':
        return (
          <div
            style={{
              backgroundColor: '#0a0a0c',
              border: '1px solid #FFA827',
              borderRadius: '2px',
              fontFamily: 'monospace',
              color: '#FFA827',
              boxShadow: '3px 3px 0px #000',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#FFA827',
                color: '#000000',
                padding: '3px 6px',
                fontSize: `${Math.max(10, fs - 2)}px`,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              <span>TRIVIA.TXT</span>
              <span>[X]</span>
            </div>
            <div style={{ padding: '0.65rem 0.85rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: computedFontSize, lineHeight: '1.45', color: '#FFA827' }}>
                <li>- Retro console fan</li>
                <li>- Indie is vibe</li>
                <li>- HATE untidiness</li>
                <li>- OCD | 180cm</li>
              </ul>
            </div>
          </div>
        );

      case 'hobbies':
        return (
          <div
            style={{
              backgroundColor: '#0a0a0c',
              border: '1px solid #FFA827',
              borderRadius: '2px',
              fontFamily: 'monospace',
              color: '#FFA827',
              boxShadow: '3px 3px 0px #000',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#FFA827',
                color: '#000000',
                padding: '3px 6px',
                fontSize: `${Math.max(10, fs - 2)}px`,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              <span>HOBBIES.DAT</span>
              <span>[X]</span>
            </div>
            <div style={{ padding: '0.65rem 0.85rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: computedFontSize, lineHeight: '1.45', color: '#FFA827' }}>
                <li>- Gaming</li>
                <li>- Football</li>
                <li>- Anime</li>
                <li>- Reading Books</li>
              </ul>
            </div>
          </div>
        );

      case 'toolbelt':
        return (
          <div
            style={{
              backgroundColor: '#0a0a0c',
              border: '1px solid #FFA827',
              borderRadius: '2px',
              fontFamily: 'monospace',
              color: '#FFA827',
              boxShadow: '3px 3px 0px #000',
              height: '100%',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#FFA827',
                color: '#000000',
                padding: '3px 6px',
                fontSize: `${Math.max(10, fs - 2)}px`,
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              <span>TOOLBELT.SYS</span>
              <span>[X]</span>
            </div>
            <div style={{ padding: '0.65rem 0.85rem' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: computedFontSize, lineHeight: '1.45', color: '#FFA827' }}>
                <li>- Figma / AI / PS / ID</li>
                <li>- After Effects / Premiere</li>
                <li>- Cursor / Claude / Anti-Gravity</li>
              </ul>
            </div>
          </div>
        );

      case 'meet_artist':
      case 'meetBubble':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(18, 18, 22, 0.95)',
              border: '2px solid #FFA827',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${fs || 14}px`,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#FFA827',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          >
            MEET THE ARTIST!
          </div>
        );

      case 'hi_inam':
      case 'inamBubble':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(18, 18, 22, 0.95)',
              border: '2px solid #FFA827',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${fs || 14}px`,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#FFA827',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          >
            HI, I'M INAM!
          </div>
        );

      case 'inventory':
      case 'invTag':
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(18, 18, 22, 0.95)',
              border: '2px solid #FFA827',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: `${fs || 14}px`,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: '#FFA827',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)',
              userSelect: 'none',
            }}
          >
            [ INVENTORY ]
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0d0d0d',
        backgroundImage:
          'linear-gradient(to right, rgba(255, 168, 39, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 168, 39, 0.05) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* MAIN SPLIT CANVAS: Left Profile Frame + Right Real Console */}
      <div className="hero-split-canvas">
        {/* LEFT SIDE: FINALIZED PROFILE CANVAS */}
        <div
          ref={viewportRef}
          className="hero-profile-viewport"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            height: mobileScale < 1 ? `${Math.round(frame.height * mobileScale + 16)}px` : undefined,
            position: 'relative',
            overflow: 'visible',
          }}
        >
          <div
            style={{
              width: mobileScale < 1 ? `${Math.round(980 * mobileScale)}px` : '980px',
              height: mobileScale < 1 ? `${Math.round(frame.height * mobileScale)}px` : `${frame.height}px`,
              position: 'relative',
              overflow: 'visible',
              flexShrink: 0,
            }}
          >
            <div
              ref={containerRef}
              style={{
                position: mobileScale < 1 ? 'absolute' : 'relative',
                top: 0,
                left: 0,
                width: '980px',
                minWidth: '980px',
                maxWidth: '980px',
                height: `${frame.height}px`,
                transform: mobileScale < 1 ? `scale(${mobileScale})` : undefined,
                transformOrigin: 'top left',
                backgroundColor: 'transparent',
                border: `${frame.borderWidth}px solid rgba(255, 168, 39, 0.45)`,
                borderRadius: `${frame.borderRadius}px`,
                padding: '1.25rem',
                overflow: 'visible',
                boxShadow: '0 0 35px rgba(255, 168, 39, 0.12)',
                boxSizing: 'border-box',
              }}
            >


              {/* Render Floating Hearts & Purr Feedback */}
              {hearts.map((h) => (
                <span
                  key={h.id}
                  style={{
                    position: 'absolute',
                    left: `${h.x}px`,
                    top: `${h.y}px`,
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    color: '#FFA827',
                    textShadow: '0 0 8px #FFA827, 2px 2px 0 #000',
                    pointerEvents: 'none',
                    zIndex: 99,
                    animation: 'floatUp 1.2s ease-out forwards',
                  }}
                >
                  {h.text}
                </span>
              ))}

              {/* ALL CANVAS ITEMS */}
              {Object.entries(layout).map(([id, item]) => {
                const isCat = item.type === 'cat';
                const isCatTag = item.type === 'catTag';
                const isChar = id === 'character';
                const targetCatId = isCat ? (item.catId || id) : isCatTag ? id.replace('tag_', '') : undefined;
                const catState = targetCatId ? catsState[targetCatId] : null;
                const isCatAwake = catState?.isAwake ?? false;

                return (
                  <div
                    key={id}
                    onClick={targetCatId ? (e) => handleCatClick(e, targetCatId, item) : undefined}
                    style={{
                      position: 'absolute',
                      top: `${item.top}px`,
                      left: `${item.left}px`,
                      width: `${item.width}px`,
                      height: `${item.height}px`,
                      zIndex: item.zIndex || 10,
                      transform: (id === 'cat_zubair' || item.catId === 'zubair') ? undefined : item.rotation ? `rotate(${item.rotation}deg)` : undefined,
                      cursor: targetCatId ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    {/* Character Sprite (Inam) */}
                    {isChar ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          filter: 'drop-shadow(0 0 8px rgba(255,168,39,0.18))',
                        }}
                      >
                        <video
                          src={item.src || '/hero/Inam_transparent_idle_loop.webm'}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                            pointerEvents: 'none',
                            userSelect: 'none',
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Standard Pixel Art Items */}
                    {!isChar && !isCat && !isCatTag && item.type !== 'box' && item.type !== 'bubble' && item.src ? (
                      <div
                        className={
                          item.anim === 'reverse'
                            ? 'animate-box-float-reverse'
                            : item.anim === 'slow'
                            ? 'animate-box-float'
                            : undefined
                        }
                        style={{ width: '100%', height: '100%' }}
                      >
                        <img
                          src={item.src}
                          alt={item.name}
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                            pointerEvents: 'none',
                            userSelect: 'none',
                            filter: 'drop-shadow(0 0 6px rgba(255,168,39,0.25))',
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Interactive Cat */}
                    {isCat ? (
                      <div
                        className={
                          catState?.purring
                            ? 'animate-cat-purr'
                            : isCatAwake
                            ? 'animate-cat-awake'
                            : 'animate-cat-sleep'
                        }
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          filter: catState?.purring ? 'drop-shadow(0 0 12px #FFA827)' : 'drop-shadow(0 0 6px rgba(255,168,39,0.3))',
                        }}
                      >
                        <img
                          src={isCatAwake && item.awakeSrc ? item.awakeSrc : item.src}
                          alt={item.name}
                          draggable={false}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            imageRendering: 'pixelated',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>
                    ) : null}

                    {/* Cat Name Tag */}
                    {isCatTag ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'rgba(18, 18, 22, 0.92)',
                          border: '1px solid #FFA827',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: `${item.fontSize || 10}px`,
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          color: '#FFA827',
                          padding: '0 4px',
                          whiteSpace: 'nowrap',
                          boxShadow: '2px 2px 0px #000000',
                          userSelect: 'none',
                        }}
                      >
                        {stripEmojis(item.text || item.name)}
                      </div>
                    ) : null}

                    {/* Window Boxes with Vertical Float */}
                    {item.type === 'box' ? (
                      <div
                        className={
                          id === 'profileBox' || id === 'hobbiesBox'
                            ? 'animate-box-float'
                            : 'animate-box-float-reverse'
                        }
                        style={{ width: '100%', height: '100%' }}
                      >
                        {renderBoxContent(item.boxKey, item.fontSize)}
                      </div>
                    ) : item.type === 'bubble' ? (
                      renderBoxContent(item.boxKey, item.fontSize)
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: PHYSICAL CONSOLE */}
        <div
          className="hero-console-wrapper"
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            position: 'relative',
          }}
        >
          <div
            className="animate-box-float"
            style={{
              width: '100%',
              maxWidth: '380px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '-0.75rem',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 10,
            }}
          >
            <img
              src="/hero/clean/Portfolio_clean.png"
              alt="PORTFOLIO"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.7))',
              }}
            />
          </div>
          <Console />
        </div>
      </div>
    </section>
  );
}
