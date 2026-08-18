'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const BLOCK = '#1A1A20';
const GRID = 'rgba(26, 26, 32, 0.1)';
const DROP_MS = 520;
const BOT_STEP_MS = 90;

type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

type Cell = readonly [number, number];

/** Each piece rotation is a list of [x, y] offsets from the piece origin. */
const SHAPES: Record<PieceType, readonly (readonly Cell[])[]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [[[0, 0], [1, 0], [0, 1], [1, 1]]],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};

const SPAWN_X: Record<PieceType, number> = {
  I: 3,
  O: 4,
  T: 3,
  S: 3,
  Z: 3,
  J: 3,
  L: 3,
};

interface ActivePiece {
  type: PieceType;
  rotation: number;
  x: number;
  y: number;
}

interface BotPlan {
  column: number;
  rotation: number;
}

interface GameState {
  board: number[][];
  piece: ActivePiece | null;
  bot: boolean;
  dropCounter: number;
  botCounter: number;
  plan: BotPlan | null;
}

function emptyBoard(): number[][] {
  return Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
}

function randomPiece(): PieceType {
  const types = Object.keys(SHAPES) as PieceType[];
  return types[Math.floor(Math.random() * types.length)]!;
}

function cells(type: PieceType, rotation: number): readonly Cell[] {
  const rotations = SHAPES[type];
  return rotations[rotation % rotations.length]!;
}

function collides(board: number[][], piece: ActivePiece, offsetX = 0, offsetY = 0, rotation = piece.rotation) {
  for (const [cx, cy] of cells(piece.type, rotation)) {
    const x = piece.x + cx + offsetX;
    const y = piece.y + cy + offsetY;
    if (x < 0 || x >= COLS || y >= ROWS) return true;
    if (y >= 0 && board[y]![x]) return true;
  }
  return false;
}

function merge(board: number[][], piece: ActivePiece): number[][] {
  const next = board.map((row) => [...row]);
  for (const [cx, cy] of cells(piece.type, piece.rotation)) {
    const x = piece.x + cx;
    const y = piece.y + cy;
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) next[y]![x] = 1;
  }
  return next;
}

function clearLines(board: number[][]): number[][] {
  const kept = board.filter((row) => row.some((cell) => cell === 0));
  const cleared = ROWS - kept.length;
  if (cleared === 0) return board;
  const fresh = Array.from({ length: cleared }, () => Array<number>(COLS).fill(0));
  return [...fresh, ...kept];
}

function ghostY(board: number[][], piece: ActivePiece): number {
  let y = piece.y;
  while (!collides(board, { ...piece, y: y + 1 })) y += 1;
  return y;
}

function simulateLanding(board: number[][], type: PieceType, rotation: number, column: number) {
  const piece: ActivePiece = { type, rotation, x: column, y: 0 };
  if (collides(board, piece)) return null;
  const y = ghostY(board, piece);
  const landed: ActivePiece = { ...piece, y };
  const merged = clearLines(merge(board, landed));
  return merged;
}

function scoreBoard(board: number[][]) {
  let height = 0;
  let holes = 0;
  const heights = Array<number>(COLS).fill(0);

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (board[y]![x]) {
        heights[x] = ROWS - y;
        height = Math.max(height, heights[x]!);
      }
    }
  }

  for (let x = 0; x < COLS; x += 1) {
    let seen = false;
    for (let y = 0; y < ROWS; y += 1) {
      if (board[y]![x]) seen = true;
      else if (seen) holes += 1;
    }
  }

  return height * -8 - holes * 4;
}

function planBotMove(board: number[][], type: PieceType): BotPlan {
  let best: BotPlan = { column: SPAWN_X[type], rotation: 0 };
  let bestScore = -Infinity;

  const rotations = SHAPES[type].length;
  for (let rotation = 0; rotation < rotations; rotation += 1) {
    for (let column = -2; column < COLS; column += 1) {
      const landed = simulateLanding(board, type, rotation, column);
      if (!landed) continue;
      const score = scoreBoard(landed);
      if (score > bestScore) {
        bestScore = score;
        best = { column, rotation };
      }
    }
  }

  return best;
}

function spawnPiece(board: number[][], type = randomPiece()): ActivePiece | null {
  const piece: ActivePiece = { type, rotation: 0, x: SPAWN_X[type], y: 0 };
  return collides(board, piece) ? null : piece;
}

export function TetrisBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const stateRef = useRef<GameState>({
    board: emptyBoard(),
    piece: spawnPiece(emptyBoard())!,
    bot: true,
    dropCounter: 0,
    botCounter: 0,
    plan: null,
  });
  const userControlRef = useRef(false);
  const [userControl, setUserControl] = useState(false);

  const takeControl = useCallback(() => {
    if (userControlRef.current) return;
    userControlRef.current = true;
    stateRef.current.bot = false;
    stateRef.current.plan = null;
    setUserControl(true);
  }, []);

  const resize = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = width * 2;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cell = width / COLS;
    const { board, piece } = stateRef.current;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x += 1) {
      ctx.beginPath();
      ctx.moveTo(x * cell + 0.5, 0);
      ctx.lineTo(x * cell + 0.5, height);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y += 1) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell + 0.5);
      ctx.lineTo(width, y * cell + 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = BLOCK;
    for (let y = 0; y < ROWS; y += 1) {
      for (let x = 0; x < COLS; x += 1) {
        if (board[y]![x]) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }

    if (piece) {
      for (const [cx, cy] of cells(piece.type, piece.rotation)) {
        const x = piece.x + cx;
        const y = piece.y + cy;
        if (y >= 0) ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }, []);

  const lockPiece = useCallback(() => {
    const state = stateRef.current;
    if (!state.piece) return;

    let board = clearLines(merge(state.board, state.piece));
    let piece = spawnPiece(board);

    if (!piece) {
      board = emptyBoard();
      piece = spawnPiece(board);
    }

    state.board = board;
    state.piece = piece;
    state.plan = state.bot && piece ? planBotMove(board, piece.type) : null;
    state.dropCounter = 0;
    state.botCounter = 0;
  }, []);

  const tryMove = useCallback((dx: number, dy: number) => {
    const state = stateRef.current;
    if (!state.piece) return false;
    if (collides(state.board, state.piece, dx, dy)) return false;
    state.piece = { ...state.piece, x: state.piece.x + dx, y: state.piece.y + dy };
    return true;
  }, []);

  const tryRotate = useCallback(() => {
    const state = stateRef.current;
    if (!state.piece) return false;
    const next = (state.piece.rotation + 1) % SHAPES[state.piece.type].length;
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collides(state.board, state.piece, kick, 0, next)) {
        state.piece = { ...state.piece, rotation: next, x: state.piece.x + kick };
        return true;
      }
    }
    return false;
  }, []);

  const runBot = useCallback(() => {
    const state = stateRef.current;
    if (!state.bot || !state.piece) return;

    if (!state.plan) state.plan = planBotMove(state.board, state.piece.type);

    const { column, rotation } = state.plan;
    const piece = state.piece;

    if (piece.rotation !== rotation) {
      tryRotate();
      return;
    }

    if (piece.x < column) {
      tryMove(1, 0);
      return;
    }
    if (piece.x > column) {
      tryMove(-1, 0);
      return;
    }

    if (!tryMove(0, 1)) lockPiece();
  }, [lockPiece, tryMove, tryRotate]);

  useEffect(() => {
    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);

    let last = performance.now();

    const tick = (now: number) => {
      const delta = now - last;
      last = now;
      const state = stateRef.current;

      state.botCounter += delta;
      if (state.bot && state.botCounter >= BOT_STEP_MS) {
        state.botCounter = 0;
        runBot();
      }

      state.dropCounter += delta;
      if (state.dropCounter >= DROP_MS) {
        state.dropCounter = 0;
        if (!tryMove(0, 1)) lockPiece();
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameRef.current);
    };
  }, [draw, lockPiece, resize, runBot, tryMove]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      event.preventDefault();
      takeControl();

      if (event.key === 'ArrowLeft') tryMove(-1, 0);
      if (event.key === 'ArrowRight') tryMove(1, 0);
      if (event.key === 'ArrowDown') {
        if (!tryMove(0, 1)) lockPiece();
        stateRef.current.dropCounter = 0;
      }
      if (event.key === 'ArrowUp') tryRotate();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lockPiece, takeControl, tryMove, tryRotate]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 2',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Tetris background. Click or use arrow keys to play."
        onClick={takeControl}
        onKeyDown={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
            event.preventDefault();
            takeControl();
          }
        }}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          background: 'transparent',
          cursor: userControl ? 'default' : 'pointer',
        }}
      />
      {!userControl ? (
        <p
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            margin: 0,
            padding: '0 1rem',
            pointerEvents: 'none',
            textAlign: 'center',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'clamp(0.55rem, 2.4vw, 0.75rem)',
            letterSpacing: '0.14em',
            color: 'rgba(26, 26, 32, 0.38)',
            userSelect: 'none',
          }}
        >
          Click or Press Arrows to Play
        </p>
      ) : null}
    </div>
  );
}
