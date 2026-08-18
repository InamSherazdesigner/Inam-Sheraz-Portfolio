/* ==========================================================================
   STAGE 5 — rendering the full view.

   The artwork sits on neutral mats. Nothing here ever applies a blend mode,
   filter or tint to an artwork. The only overlay in the build is the CAT
   watermark, which BUILD_SPEC §10 requires.
   ========================================================================== */

const stage = document.getElementById('stage');
let onExitCb = null;
let gatePassword = '';

export const stageIsOpen = () => !stage.hidden;

const esc = (s) => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Prose in data.js already carries deliberate inline markup (<em>, <strong>,
   and the Urdu <span lang> runs). It is authored content, not input, so it is
   passed through. Alt text and labels are escaped. */
const prose = (s) => s;

/* ==========================================================================
   BLOCKS
   ========================================================================== */

function plate(item, { marked = false, cap = null } = {}) {
  const isVideo = /\.(webm|mp4)$/.test(item.src);
  const media = isVideo
    /* Silent ambient loops may autoplay muted. Nothing else autoplays. */
    ? `<video src="${item.src}" muted loop autoplay playsinline preload="metadata"
              aria-label="${esc(item.alt || '')}"></video>`
    : `<img src="${item.src}" alt="${esc(item.alt || '')}" loading="lazy" decoding="async">`;
  return `<figure class="plate${marked ? ' plate--marked' : ''}">
            ${media}
            ${cap ? `<figcaption class="plate__cap">${esc(cap)}</figcaption>` : ''}
          </figure>`;
}

function block(b, ctx) {
  switch (b.t) {

    case 'p':      return `<p>${prose(b.x)}</p>`;
    case 'h3':     return `<h3>${prose(b.x)}</h3>`;
    case 'lead':   return `<p class="lead">${prose(b.x)}</p>`;
    case 'credit': return `<p class="credit">${prose(b.x)}</p>`;
    case 'rule':   return `<hr class="rule">`;

    case 'note': {
      const kind = { content: 'CONTENT NOTE', editorial: 'BEFORE PUBLISHING', access: 'ACCESS' }[b.kind] || 'NOTE';
      /* A content note must be read before the images it covers are visible. */
      const reveal = b.gates
        ? `<button class="note__reveal" data-reveal="1">SHOW THE IMAGES</button>` : '';
      return `<aside class="note note--${b.kind}">
                <span class="note__kind">${kind}</span>${prose(b.x)}${reveal}
              </aside>`;
    }

    case 'img': return plate(b, { cap: b.cap });

    case 'grid': {
      const label = b.label ? `<p class="plates__label">${esc(b.label)}</p>` : '';
      const hide  = b.gated ? ' hidden data-gated="1"' : '';
      return `${label}<div class="plates"${hide}>${b.items.map(i => plate(i)).join('')}</div>`;
    }

    /* Three squares, side by side, playing at the same time. Silent, muted,
       autoplay, looping. Showing them one after another destroys the point. */
    case 'triptych':
      return `<div class="triptych">${b.items.map(i => plate(i)).join('')}</div>`;

    /* Anything with sound: play button, never autoplay. preload="none" so
       nothing downloads until the visitor presses play. */
    case 'video':
      return `<div class="media">
                ${b.label ? `<p class="media__label">${esc(b.label)}</p>` : ''}
                <figure class="plate">
                  <video src="${b.src}" controls preload="none" playsinline></video>
                </figure>
                ${b.note ? `<p class="media__note">${esc(b.note)}</p>` : ''}
              </div>`;

    case 'audio':
      return `<div class="media">
                <p class="media__label">${esc(b.label || '')}</p>
                <audio src="${b.src}" controls preload="none"></audio>
              </div>`;

    case 'timeline':
      return `<ul class="timeline">${b.items.map(i =>
        `<li><b>${esc(i.y)}</b><span>${prose(i.x)}</span></li>`).join('')}</ul>`;

    case 'gate': return gateBlock(ctx);

    default: return '';
  }
}

/* --- The CAT gate --------------------------------------------------------
   The preview details are always visible and watermarked. The full set sits
   behind a password. The copy states what this is and does not overstate it. */

function gateBlock(ctx) {
  const g = ctx.gate;
  if (!g) return '';
  return `
    <div class="plates">${g.preview.map(i => plate(i, { marked: true })).join('')}</div>
    <div class="gate" data-gate="1">
      <p style="margin:0">The full set is password-protected at the researcher’s
      request. This is a deterrent held in the page, not security — anyone
      determined can read past it. Ask and I will send the set.</p>
      <form class="gate__form">
        <input class="gate__input" type="password" placeholder="PASSWORD"
               aria-label="Password for the full CAT set" autocomplete="off">
        <button class="gate__go" type="submit">UNLOCK</button>
      </form>
      <p class="gate__msg" role="status"></p>
    </div>
    <div class="plates" data-gate-full="1" hidden>
      ${g.full.map(i => plate(i)).join('')}
    </div>`;
}

/* --- Contact -------------------------------------------------------------
   Unfilled details render as visible placeholders so they cannot ship unseen. */

function contactBlock(c) {
  return `<ul class="contact">${c.links.map(l => `
    <li>
      <span>${esc(l.label)}</span>
      <span>${l.value
        ? `<a href="${l.href}">${esc(l.value)}</a>`
        : `<span class="contact__tbd">— still to add —</span>`}</span>
    </li>`).join('')}</ul>`;
}

/* The body of one project, as HTML. Shared with the one-page view so both
   routes render from exactly the same blocks and neither can drift. */
export function renderDoc(item) {
  return (item.page || []).map(b => block(b, { gate: item.gate })).join('')
       + (item.links ? contactBlock(item) : '');
}

/* The one-page view needs the same interactions without the console around
   it: the content-note reveal and the password gate. */
export function wireDoc(root, password = '') {
  gatePassword = (password || '').toLowerCase();

  root.querySelectorAll('[data-reveal]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.note')?.parentElement
         ?.querySelectorAll('[data-gated]').forEach(el => { el.hidden = false; });
      root.querySelectorAll('[data-gated]').forEach(el => { el.hidden = false; });
      btn.remove();
    });
  });

  root.querySelectorAll('[data-gate]').forEach(gate => {
    const full = gate.parentElement.querySelector('[data-gate-full]');
    const msg  = gate.querySelector('.gate__msg');
    const form = gate.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const tried = gate.querySelector('input').value.trim().toLowerCase();
      if (gatePassword && tried === gatePassword) {
        if (full) full.hidden = false;
        form.remove();
        msg.textContent = 'Unlocked. Please do not circulate these.';
      } else {
        msg.textContent = 'That is not the password.';
      }
    });
  });
}

/* ==========================================================================
   OPEN / CLOSE
   ========================================================================== */

export function openStage(item, { onExit } = {}) {
  onExitCb = onExit || null;
  gatePassword = (item.gate?.password || '').toLowerCase();

  const ctx = { gate: item.gate };
  const body = (item.page || []).map(b => block(b, ctx)).join('')
             + (item.links ? contactBlock(item) : '');

  /* LIMINAL sets its own ground. Everything else stays on the amber field. */
  stage.style.setProperty('--ground', item.ground || 'var(--amber)');

  stage.innerHTML = `
    <div class="stage__bar">
      <span class="stage__lamp"></span>
      <span class="stage__id">${item.id ? esc(item.id) : '&mdash;'}</span>
      <span class="stage__now">${esc(item.title)}</span>
      <button class="stage__back" data-close="1">B &mdash; BACK</button>
    </div>
    <article class="stage__doc">
      ${item.subtitle ? `<p class="stage__eyebrow">${esc(item.subtitle)}</p>` : ''}
      <h1 class="stage__title">${esc(item.title)}</h1>
      ${body}
    </article>`;

  stage.hidden = false;
  stage.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  /* Resolution gain, applied once on entry. */
  stage.querySelector('.stage__doc')?.classList.add('res');

  stage.querySelector('.stage__back')?.focus();
  wire();
}

/* Inside an open project the D-pad left / right steps through the images,
   which is what the contextual control means at this depth. BUILD_SPEC §5. */
export function stepImage(dir) {
  const plates = [...stage.querySelectorAll('.plate')].filter(p => p.offsetParent !== null);
  if (!plates.length) return;

  const mid = stage.scrollTop + stage.clientHeight / 2;
  let idx = plates.findIndex(p => p.offsetTop + p.offsetHeight / 2 > mid);
  if (idx === -1) idx = plates.length - 1;

  const next = plates[Math.min(plates.length - 1, Math.max(0, idx + dir))];
  next.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function closeStage() {
  stage.hidden = true;
  stage.innerHTML = '';
  document.body.style.overflow = '';
  onExitCb?.();
}

/* --- Interactions inside the stage --------------------------------------- */

function wire() {
  stage.querySelector('[data-close]')?.addEventListener('click', closeStage);

  /* Content note: reveal the images it covers. */
  stage.querySelector('[data-reveal]')?.addEventListener('click', (e) => {
    stage.querySelectorAll('[data-gated]').forEach(el => { el.hidden = false; });
    e.target.remove();
  });

  /* Password gate. */
  const gate = stage.querySelector('[data-gate]');
  if (gate) {
    const full = stage.querySelector('[data-gate-full]');
    const msg  = gate.querySelector('.gate__msg');
    gate.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      const tried = gate.querySelector('input').value.trim().toLowerCase();
      if (gatePassword && tried === gatePassword) {
        full.hidden = false;
        gate.querySelector('form').remove();
        msg.textContent = 'Unlocked. Please do not circulate these.';
      } else {
        msg.textContent = 'That is not the password.';
      }
    });
  }
}
