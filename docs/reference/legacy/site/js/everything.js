/* ==========================================================================
   THE ESCAPE HATCH — every section as one plain scroll.

   No console, no controls, no ceremony. This is how someone with thirty
   seconds gets to the work. BUILD_SPEC §5.

   It renders from the same blocks as the full view, so the two can never
   drift out of step.
   ========================================================================== */

import { PROJECTS, ABOUT, CONTACT } from './data.js';
import { renderDoc, wireDoc } from './stage.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function section(item, i) {
  /* LIMINAL keeps its own ground here too — its rule is black and white. */
  const ground = item.ground ? ` style="--ground:${item.ground}"` : '';
  return `
    <section class="every__sec" id="${esc(item.slug || item.title.toLowerCase())}"${ground}>
      <div class="stage__doc">
        ${item.subtitle ? `<p class="stage__eyebrow">${esc(item.subtitle)}</p>` : ''}
        <h2 class="stage__title">
          ${item.id ? `<span class="every__no">${esc(item.id)}</span>` : ''}${esc(item.title)}
        </h2>
        ${renderDoc(item)}
      </div>
    </section>`;
}

const all = document.getElementById('all');

/* Work first, then about, then contact — the order the channels sit in. */
all.innerHTML = [...PROJECTS, ABOUT, CONTACT].map(section).join('');

wireDoc(all, PROJECTS.find(p => p.gate)?.gate.password);

/* A plain index at the top, so the whole list is readable before any scrolling
   happens. Same principle as the LCD: frame the index, never hide it. */
const index = document.createElement('nav');
index.className = 'every__index';
index.innerHTML = `
  <p class="every__index-label">ELEVEN PROJECTS</p>
  <ol>${PROJECTS.map(p => `
    <li><a href="#${esc(p.slug)}">
      <span>${esc(p.id)}</span>
      <span>${esc(p.title)}</span>
      <span>${esc(p.year || '')}</span>
    </a></li>`).join('')}
    <li><a href="#about"><span>&mdash;</span><span>ABOUT</span><span></span></a></li>
    <li><a href="#contact"><span>&mdash;</span><span>CONTACT</span><span></span></a></li>
  </ol>`;
all.prepend(index);
