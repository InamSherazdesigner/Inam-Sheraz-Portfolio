'use client';

import React, { useState, useEffect } from 'react';

interface CatItem {
  id: string;
  name: string;
  desc: string;
  sleepSprite: string;
  awakeSprite: string;
  sleepX: number;
  sleepY: number;
  wanderX: number;
  wanderY: number;
}

const CATS: CatItem[] = [
  {
    id: 'burger',
    name: 'Burger',
    desc: 'Innocent void kitten 🐾',
    sleepSprite: '/hero/cats/burger_sleep.png',
    awakeSprite: '/hero/cats/burger_awake.png',
    sleepX: 8,
    sleepY: 10,
    wanderX: 15,
    wanderY: 25,
  },
  {
    id: 'coco',
    name: 'Coco',
    desc: 'Derpy Siamese mom 🥥',
    sleepSprite: '/hero/cats/coco_sleep.png',
    awakeSprite: '/hero/cats/coco_awake.png',
    sleepX: 28,
    sleepY: 16,
    wanderX: 35,
    wanderY: 65,
  },
  {
    id: 'simba',
    name: 'Simba',
    desc: 'Majestic Persian dad 🦁',
    sleepSprite: '/hero/cats/simba_sleep.png',
    awakeSprite: '/hero/cats/simba_awake.png',
    sleepX: 48,
    sleepY: 8,
    wanderX: 60,
    wanderY: 35,
  },
  {
    id: 'mooto',
    name: 'Mooto Mooto',
    desc: 'Lazy sploot / watching YouTube 📺',
    sleepSprite: '/hero/cats/mooto_sleep.png',
    awakeSprite: '/hero/cats/mooto_awake.png',
    sleepX: 68,
    sleepY: 18,
    wanderX: 78,
    wanderY: 70,
  },
  {
    id: 'zubair',
    name: 'Zubair',
    desc: 'Kneading biscuits & massage 💆',
    sleepSprite: '/hero/cats/zubair_sleep.png',
    awakeSprite: '/hero/cats/zubair_awake.png',
    sleepX: 84,
    sleepY: 12,
    wanderX: 82,
    wanderY: 20,
  },
];

interface CatFamilyProps {
  fontSize?: number;
}

export default function CatFamily({ fontSize = 11 }: CatFamilyProps) {
  const [clickCount, setClickCount] = useState(0);
  const [isAwake, setIsAwake] = useState(false);
  const [purringCat, setPurringCat] = useState<string | null>(null);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>(CATS.map((c) => ({ x: c.wanderX, y: c.wanderY })));

  const handleCatClick = (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    setPurringCat(catId);
    setTimeout(() => setPurringCat(null), 400);

    const rect = e.currentTarget.getBoundingClientRect();
    const newHeart = { id: Date.now(), x: e.clientX - rect.left, y: e.clientY - rect.top };
    setHearts((prev) => [...prev, newHeart]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== newHeart.id)), 1200);

    if (nextCount >= 5) {
      setIsAwake(true);
      setClickCount(0);
    }
  };

  useEffect(() => {
    if (!isAwake) return;
    const interval = setInterval(() => {
      setPositions((prev) =>
        prev.map((pos) => ({
          x: Math.max(8, Math.min(88, pos.x + (Math.random() * 24 - 12))),
          y: Math.max(12, Math.min(80, pos.y + (Math.random() * 24 - 12))),
        }))
      );
    }, 2800);
    return () => clearInterval(interval);
  }, [isAwake]);

  return (
    <>
      {!isAwake ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(22, 22, 22, 0.75)',
            border: '1px solid rgba(255, 168, 39, 0.45)',
            borderRadius: '12px',
            padding: '0.4rem',
            userSelect: 'none',
            boxShadow: '0 0 14px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              fontSize: `${fontSize}px`,
              color: 'rgba(255, 168, 39, 0.85)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 0.25rem',
              marginBottom: '0.2rem',
              fontWeight: 800,
            }}
          >
            <span>💤 CAT FAMILY (PET US!)</span>
            <span>{clickCount > 0 ? `PURR: ${clickCount}/5` : 'ZZZ'}</span>
          </div>

          <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 20px)' }}>
            {CATS.map((cat: CatItem) => (
              <div
                key={cat.id}
                onClick={(e) => handleCatClick(e, cat.id)}
                className={`cursor-pointer transition-transform duration-200 hover:scale-110 ${
                  purringCat === cat.id ? 'animate-purr' : ''
                }`}
                style={{
                  position: 'absolute',
                  left: `${cat.sleepX}%`,
                  top: `${cat.sleepY}%`,
                  zIndex: 20,
                  transform: 'translate(-50%, 0)',
                }}
                title={`${cat.name} (Sleeping - click to pet!)`}
              >
                <img
                  src={cat.sleepSprite}
                  alt={cat.name}
                  style={{
                    width: '3.25rem',
                    height: '3.25rem',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 6px rgba(255,168,39,0.3))',
                    pointerEvents: 'auto',
                  }}
                />
              </div>
            ))}
          </div>

          {hearts.map((h) => (
            <span
              key={h.id}
              style={{
                position: 'absolute',
                left: `${h.x}px`,
                top: `${h.y}px`,
                fontSize: '11px',
                color: '#FFA827',
                pointerEvents: 'none',
                fontWeight: 800,
                zIndex: 40,
                animation: 'bubbleBounce 0.8s ease-out',
              }}
            >
              ❤️ purr~
            </span>
          ))}
        </div>
      ) : (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35 }}>
          <button
            type="button"
            onClick={() => setIsAwake(false)}
            style={{
              pointerEvents: 'auto',
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: '#141414',
              border: '1px solid #FFA827',
              color: '#FFA827',
              fontSize: '10px',
              padding: '0.3rem 0.75rem',
              borderRadius: '6px',
              boxShadow: '2px 2px 0px #000000',
              fontWeight: 800,
              cursor: 'pointer',
              zIndex: 40,
            }}
          >
            🥣 Pspsps (Nap Time)
          </button>

          {CATS.map((cat: CatItem, i: number) => (
            <div
              key={cat.id}
              style={{
                pointerEvents: 'auto',
                position: 'absolute',
                left: `${positions[i]?.x}%`,
                top: `${positions[i]?.y}%`,
                transition: 'all 2800ms ease-in-out',
                cursor: 'pointer',
                zIndex: 30,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-24px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#181818',
                  border: '1px solid #FFA827',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  whiteSpace: 'nowrap',
                  boxShadow: '2px 2px 0px #000',
                  color: '#FFA827',
                }}
              >
                <span style={{ fontWeight: 800 }}>{cat.name}</span>: {cat.desc}
              </div>

              <div style={{ width: '3.5rem', height: '3.5rem' }}>
                <img
                  src={cat.awakeSprite}
                  alt={cat.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    filter: 'drop-shadow(0 0 8px rgba(255,168,39,0.35))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
