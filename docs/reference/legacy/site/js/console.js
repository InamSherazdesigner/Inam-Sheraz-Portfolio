/* ==========================================================================
   THE CONSOLE — state machine and input.

   One axis governs everything: low resolution -> full resolution.
   Going deeper always means gaining resolution. BUILD_SPEC §4.

   States:  off -> boot -> menu -> load -> card -> full
   B backs out one stage at a time. Exiting runs the transition in reverse.
   ========================================================================== */

import { CHANNELS } from './data.js';
import { openStage, closeStage, stageIsOpen, stepImage } from './stage.js';

const lcd    = document.getElementById('lcd');
const screen = document.getElementById('screen');

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const S = {
  power: true,      /* the lamp is separate — this is the screen */
  view: 'menu',     /* menu | load | card | full */
  ch: 0,            /* channel index */
  i: 0,             /* selection index within the channel */
  seen: new Set(),  /* projects opened this session — drives ceremony length */
  skip: false       /* B held or START pressed during a transition */
};

const channel = () => CHANNELS[S.ch];
const items   = () => channel().items;
const current = () => items()[S.i];

/* --- Text helpers --------------------------------------------------------
   The copy file uses *asterisks* for emphasis. Convert, never rewrite. */
const em = (s) => s.replace(/\*([^*]+)\*/g, '<em>$1</em>');

const esc = (s) => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const wait = (ms) => new Promise(r => setTimeout(r, REDUCED ? 0 : ms));

/* ==========================================================================
   RENDER
   ========================================================================== */

function render() {
  if (!S.power) { screen.innerHTML = ''; return; }
  if (S.view === 'menu') return renderMenu();
  if (S.view === 'card') return renderCard();
}

/* Stage 1 — the menu. The full list is readable text, immediately. */
function renderMenu() {
  const list = items();
  const atFirst = S.ch === 0;
  const atLast  = S.ch === CHANNELS.length - 1;

  const rows = list.map((it, n) => `
    <li class="lcd__row" role="option" data-i="${n}"
        aria-selected="${n === S.i}">
      <span class="lcd__row-no">${it.id ? esc(it.id) : '--'}</span>
      <span class="lcd__row-name">${esc(it.title)}</span>
      <span class="lcd__row-year">${it.year ? esc(it.year) : ''}</span>
    </li>`).join('');

  screen.innerHTML = `
    <div class="lcd__head">
      <span class="lcd__channel">
        <span class="lcd__chev" style="opacity:${atFirst ? 0.2 : 0.45}">&lt;</span>
        ${esc(channel().label)}
        <span class="lcd__chev" style="opacity:${atLast ? 0.2 : 0.45}">&gt;</span>
      </span>
      <span class="lcd__count">${String(list.length).padStart(2, '0')} ITEMS</span>
    </div>
    <ul class="lcd__list" role="listbox" aria-label="${esc(channel().label)}">${rows}</ul>
    <div class="lcd__foot">&#9650;&#9660; MOVE &nbsp;&#9664;&#9654; CHAN &nbsp;A OPEN</div>`;
}

/* Stage 2 — loading. Sprite, then blocks stacking up. */
function renderLoad(item) {
  const BLOCKS = 22;
  const sprite = item.sprite
    ? `<img class="load__sprite" src="${item.sprite}" alt="">`
    : `<div class="load__sprite load__sprite--tbd">SPRITE<br>TO&nbsp;COME</div>`;

  screen.innerHTML = `
    <div class="load">
      ${sprite}
      <div class="load__bar" id="bar">
        ${'<i class="load__blk"></i>'.repeat(BLOCKS)}
      </div>
      <div class="load__label">LOADING&hellip;</div>
    </div>`;
  return BLOCKS;
}

/* Stage 3 — the info card. The preview step, before committing. */
function renderCard() {
  const it = current();
  const total = String(items().length).padStart(2, '0');
  const pos   = String(S.i + 1).padStart(2, '0');

  screen.innerHTML = `
    <div class="card">
      <div class="card__head">
        <span>&ndash; INFO CARD &ndash;</span>
        <span>${pos} / ${total}</span>
      </div>
      <h2 class="card__title">${esc(it.title)}</h2>
      ${it.subtitle ? `<p class="card__sub">${esc(it.subtitle)}</p>` : ''}
      <p class="card__body">${em(esc(it.card))}</p>
      <div class="card__prompt"><span>&#9656;</span> A &mdash; VIEW FULL WORK</div>
    </div>`;
}

/* ==========================================================================
   TRANSITIONS
   ========================================================================== */

/* Stage 2 -> 3 -> 4. Full ceremony the first time a project is opened,
   abbreviated on later opens in the same session. BUILD_SPEC §7. */
async function open(item) {
  const key   = item.slug || item.title;
  const first = !S.seen.has(key);
  S.seen.add(key);
  S.skip = false;

  S.view = 'load';
  const blocks = renderLoad(item);
  const bar = document.getElementById('bar');
  const step = (first ? 1400 : 520) / blocks;

  for (let n = 0; n < blocks; n++) {
    if (S.skip) break;
    bar.children[n].dataset.filled = 'true';
    await wait(step);
  }
  if (S.view !== 'load') return;          /* backed out mid-load */

  /* The completed bar flashes white. That flash is the cut. */
  lcd.dataset.clearing = 'true';
  await wait(220);
  delete lcd.dataset.clearing;
  if (S.view !== 'load') return;

  S.view = 'card';
  render();
}

/* Stage 5 — the screen becomes the whole window. */
function goFull() {
  S.view = 'full';
  openStage(current(), { first: true, onExit: backToCard });
}

function backToCard() {
  S.view = 'card';
  render();
}

/* ==========================================================================
   INPUT
   ========================================================================== */

function move(d) {
  const n = items().length;
  S.i = (S.i + d + n) % n;
  render();
}

function flick(d) {
  const next = S.ch + d;
  if (next < 0 || next >= CHANNELS.length) return;
  S.ch = next;
  S.i = 0;
  render();
}

function press(key) {
  /* The full view owns its own input while it is open. */
  if (stageIsOpen()) {
    if (key === 'b') closeStage();
    if (key === 'left')  stepImage(-1);
    if (key === 'right') stepImage(1);
    return;
  }

  if (!S.power) {
    if (key === 'start') boot();
    return;
  }

  switch (key) {
    case 'up':    if (S.view === 'menu') move(-1); break;
    case 'down':  if (S.view === 'menu') move(1);  break;

    case 'left':
      if (S.view === 'menu') flick(-1);
      else if (S.view === 'card') { move(-1); renderCard(); }
      break;
    case 'right':
      if (S.view === 'menu') flick(1);
      else if (S.view === 'card') { move(1); renderCard(); }
      break;

    case 'a':
      if (S.view === 'menu') open(current());
      else if (S.view === 'card') goFull();
      break;

    case 'b':
      S.skip = true;
      if (S.view === 'card' || S.view === 'load') { S.view = 'menu'; render(); }
      break;

    case 'start':
      if (S.view === 'load') { S.skip = true; break; }   /* skip the ceremony */
      shutdown();
      break;
  }
}

/* --- Power --------------------------------------------------------------- */

async function boot() {
  S.power = true;
  lcd.dataset.power = 'on';
  screen.innerHTML = `<div class="boot">INAM SHERAZ<br>&#9679;&#9679;&#9679;</div>`;
  await wait(620);
  S.view = 'menu';
  render();
}

function shutdown() {
  S.power = false;
  S.view = 'menu';
  lcd.dataset.power = 'off';
  screen.innerHTML = '';
}

/* --- Wiring -------------------------------------------------------------- */

/* Buttons on the object. Pointer and touch both land here. */
document.querySelectorAll('[data-key]').forEach(btn => {
  btn.addEventListener('click', () => press(btn.dataset.key));
});

/* Rows are directly clickable — a visitor should never be forced to learn the
   D-pad to reach the work. */
screen.addEventListener('click', (e) => {
  const row = e.target.closest('.lcd__row');
  if (!row) return;
  S.i = Number(row.dataset.i);
  render();
  open(current());
});

/* Keyboard equivalents: arrows, A / Enter, B / Escape, S for start. */
const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  a: 'a', A: 'a', Enter: 'a',
  b: 'b', B: 'b', Escape: 'b',
  s: 'start', S: 'start'
};

addEventListener('keydown', (e) => {
  const key = KEYS[e.key];
  if (!key) return;
  /* Never hijack a text field — the CAT password lives in one. */
  if (e.target instanceof Element && e.target.closest('input, textarea')) return;
  e.preventDefault();
  press(key);

  const btn = document.querySelector(`[data-key="${key}"]`);
  if (btn) {
    btn.dataset.held = 'true';
    setTimeout(() => delete btn.dataset.held, 110);
  }
});

/* Holding B skips straight through a transition. */
addEventListener('keydown', (e) => { if (e.key === 'b' || e.key === 'B') S.skip = true; });

boot();
