# ADR 0001 — Next.js App Router, with the design system ported as global CSS

**Status:** accepted · **Date:** 2026-08-15

## Context

The original build is hand-written HTML, CSS and ES modules, and its CSS is
meticulous: the console is a physical object drawn in CSS at locked pixel
dimensions (`--console-w: 340px`, `--bezel-w: 287px`, `--lcd-w: 204px`), with
palette and type fixed by BUILD_SPEC §3. The brief was an exact replica in
React and Next.js.

## Decision

**Next.js 16, App Router, TypeScript strict.** The console is a client
component; everything else renders on the server or at build time. All 17 routes
prerender to static HTML.

**The stylesheets are ported verbatim as global CSS, not converted to CSS
Modules.**

CSS Modules would have hashed every class name, which means rewriting `.console`,
`.lcd__row`, `.plate`, `.stage__doc` and ~180 others by hand across five files —
a large mechanical diff over pixel-locked values, with no benefit and a real
chance of a transcription error that nobody notices until a bezel is 3px wrong.

The scoping argument does not apply here either. This is a single-purpose site
with one design system and no component library to collide with. The class names
are already namespaced BEM. Global is what they were designed to be.

So `tokens.css`, `console.css`, `lcd.css`, `stage.css` and `everything.css` are
byte-for-byte ports. Anything this framework needs that the static build did not
lives in a separate `app.css`, where it reads as an addition rather than hiding
as a diff.

## Alternatives considered

| Option | Rejected because |
|---|---|
| CSS Modules | ~180 class renames across locked pixel values, for scoping this project does not need |
| Tailwind | Would discard the design system entirely and re-derive it in utilities. The palette is locked; this is exactly the wrong tool |
| styled-components / emotion | Runtime cost on a site whose whole argument is speed, plus the same rewrite |
| Pages Router | No reason to start on the older router |

## Consequences

**Good** — pixel fidelity is provable by diff against the original. Static
prerendering keeps the site CDN-servable. Server components mean the artwork
markup, metadata and JSON-LD exist without JavaScript.

**Bad** — global CSS has no build-time collision guard. Accepted: one design
system, BEM names, and a `docs/reference/legacy/site/` copy to diff against.

Two later exceptions were made to the "ported verbatim" rule, both for measured
WCAG AA failures and both with the owner's explicit approval — see ADR 0007.
Every change is annotated in place with the measurement that prompted it.
