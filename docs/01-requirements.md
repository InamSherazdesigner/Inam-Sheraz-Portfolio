# Gate 1 — Requirements & Discovery

**Owner:** System Architect · **Status:** approved · **Date:** 2026-08-15

---

## 1. What this is

A rebuild of the Inam Sheraz portfolio, previously a static HTML/CSS/vanilla-JS
site, as a Next.js frontend with an Express/MongoDB backend.

The visual and interaction design is **not** being redesigned. `BUILD_SPEC.md`
locks the console form, the palette, the type, the interaction model and the copy,
and this build treats that spec as the requirement document it is. A verbatim copy
is kept at `docs/reference/legacy/BUILD_SPEC.md`.

---

## 2. Functional requirements

### Carried over, unchanged

| # | Requirement | Source |
|---|---|---|
| F1 | A handheld console frames the work. Its form matches the locked reference | §1, §5 |
| F2 | The full project list is readable text immediately on load | §2 — the most important rule in the build |
| F3 | Three channels — WORK (11), ABOUT, CONTACT — flicked with D-pad left/right | §6 |
| F4 | D-pad up/down moves; A opens; B backs out one stage; START boots and shuts down | §5 |
| F5 | No SELECT button. No POWER button. The lamp is a lamp | §5 |
| F6 | Keyboard equivalents: arrows, A/Enter, B/Escape, S | §5 |
| F7 | Five stages: menu → load (sprite + Tetris bar) → card → line-clear flash → full view | §7 |
| F8 | Full ceremony on first open, abbreviated after, skippable, instant under `prefers-reduced-motion` | §7 |
| F9 | The full view sits on the amber LCD field, overridable per project | §7 |
| F10 | `VIEW EVERYTHING AS ONE PAGE` is always visible outside the console | §5 — not optional |
| F11 | Eleven projects in a fixed order with fixed content | §8 |
| F12 | The three tree projections play side by side, simultaneously | §8a |
| F13 | CAT set password-gated; only watermarked details shown; gate never claimed as security | §10 |
| F14 | Khushi Ya Majboori images hidden behind a content note | §10 |
| F15 | Thesis audio labelled as the real recordings; never autoplays | §10 |
| F16 | Every required credit line appears | §10 |
| F17 | Self-hosted media. `preload="none"`. Silent loops may autoplay muted; nothing with sound does | §11 |
| F18 | No Urdu in interface copy; Urdu only where it is part of the artwork | §3 |
| F19 | Copy is real HTML text — selectable, searchable, readable on a phone | §9 |

### New in this build

| # | Requirement | Why |
|---|---|---|
| F20 | **The thesis voice agent runs live, and the API key never reaches the browser** | The user's explicit request. §8a previously forbade hosting it for exactly this reason |
| F21 | The CAT password is verified server-side | Takes it out of the JS bundle. Still a deterrent — see ADR 0004 |
| F22 | A working contact form | Every contact link is still an unfilled placeholder, so the site otherwise ships with no way to reach anyone |
| F23 | Each project has its own URL, `/work/[slug]` | A portfolio whose work cannot be linked to is missing the point. Purely additive |
| F24 | Sitemap, robots, structured data, per-project OpenGraph | The console is a JS application; a crawler reading raw HTML would see a shell |

---

## 3. Non-functional requirements

| Area | Requirement | Verified by |
|---|---|---|
| Performance | Survives a 30-second skim; static-first; no heavy animation libraries | All 17 routes prerendered; CSS + vanilla state machine only |
| Responsive | 320px to 4K. Desktop-first, but must work properly on a phone — most visitors are on one | Playwright runs the full suite on Pixel 7 as well as desktop |
| Accessibility | WCAG 2.1 AA | axe-core on five states × two viewports, zero violations |
| Security | No credential in the client. OWASP Top 10 reviewed | `docs/05-security.md`; asserted by test on every run |
| Availability | The portfolio renders with the backend **and** the database down | Content is compiled into the frontend — ADR 0003 |
| Observability | Structured logs, correlation IDs, health endpoints, cost counters | `docs/02-architecture.md` §7 |
| Cost | Under $10/month excluding voice usage | `docs/08-delivery-report.md` §5 |
| Browser support | Evergreen Chrome, Firefox, Safari, Edge. Voice agent needs a secure origin | Widget detects and degrades to the screen recording |

---

## 4. Acceptance criteria

Each maps to at least one automated test.

1. The eleven project titles are readable text within one second of load, with no interaction. → `console.test.tsx`, `portfolio.spec.ts`
2. Every artwork path resolves to a file that exists. → `content.test.ts` (checks all 100+)
3. `POST /api/v1/voice/session` returns a signed `wss://` URL and no credential, in any form. → `voice.test.js`, `elevenlabs.provider.test.js`
4. The built bundle contains no string matching an API key pattern. → `portfolio.spec.ts`
5. Khushi Ya Majboori images are absent from the DOM until the note is acknowledged. → `portfolio.spec.ts`
6. Nothing with sound autoplays. → `content.test.ts`, `portfolio.spec.ts`
7. Zero axe violations at AA on the console, one-page view, project page, open full view, and contact form. → `accessibility.spec.ts`
8. `prefers-reduced-motion` cuts the ceremony to under 600ms. → `accessibility.spec.ts`
9. A keyboard visitor reaches the work from the first Tab. → `portfolio.spec.ts`
10. Every required credit line is present. → `content.test.ts`

---

## 5. Edge cases identified

| Case | Handling |
|---|---|
| Backend unreachable | Portfolio renders in full. Voice and contact say so. |
| MongoDB unreachable | Site unaffected. Contact form returns an honest 503 rather than pretending to have saved. |
| ElevenLabs down | Circuit breaker opens after five failures; visitors get a fast, calm message instead of a ten-second hang. |
| ElevenLabs key wrong | Logged as an operator error; the visitor sees "not available right now", never "the key is invalid". |
| Microphone denied | Detected before a session is requested, so no billable session is burnt. |
| Insecure origin / old browser | Widget never offers a button that can only fail; points at the screen recording. |
| Visitor navigates away mid-call | `useEffect` cleanup ends the session — otherwise the mic stays live and billing continues. |
| Signed URL expires before use | 45s published against a ~60s real validity, so the widget refreshes before it dies. |
| Visitor backs out mid-load | The loading interval is cancelled by effect cleanup; it cannot land on a stale card. |
| Rate limit hit | 429 with `Retry-After`; the message says what to do. |
| Bot fills the contact form | Honeypot returns an ordinary success and stores nothing. |
| Two projects with no sprite | The slot says `SPRITE TO COME` rather than faking one. |
| Contact details unfilled | Loud accent-coloured placeholders. Cannot ship unnoticed. |
| Offline | A thin bar states what still works. The work is already in the page. |
| CRLF in `X-Request-Id` | Filtered to a safe character set before it reaches a log. |

---

## 6. Constraints

- **The design is locked.** Palette, type, console form and copy are fixed by BUILD_SPEC. Two contrast values were changed, both with the owner's explicit approval — ADR 0007.
- **Copy is verbatim.** One sentence changed, because this build made it untrue: ADR 0002 §5.
- The console is 340px wide at desktop.
- No YouTube, no Vimeo. Media is self-hosted.
- No heavy animation libraries.

---

## 7. Assumptions

1. ElevenLabs Conversational AI is the voice provider, and an agent already exists. *(Confirmed with the owner.)*
2. Site content stays in code; MongoDB holds messages and audit rows only. *(Confirmed — ADR 0003.)*
3. All contact details stay placeholders for now. *(Confirmed.)*
4. Single-instance backend deployment. Rate limits are in-process; horizontal scaling needs a shared store — flagged in the runbook.
5. Hosting is a Node host for the API and a static/CDN host for the frontend. Neither is chosen yet.

---

## 8. Dependencies

| Dependency | Used for | If it fails |
|---|---|---|
| ElevenLabs Conversational AI | The voice agent | Circuit breaker; visitor gets a message and the screen recording |
| MongoDB | Contact messages, audit rows | Site unaffected; contact form returns 503 |
| Next.js 16 / React 19 | Frontend | Build-time |
| Express 4 | API | Runtime |

Production dependency scan: **0 vulnerabilities** (`npm audit --omit=dev`).

---

## 9. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Voice usage runs up an unexpected bill | Medium | High | Per-IP **and** global rate limits; audit row per session; mic prompt before session; `docs/04-runbook.md` §6 covers the kill switch |
| R2 | A signed URL is scraped from a visitor's tab | Low | Low | Scoped to one agent and one conversation, ~45s life, never logged or persisted |
| R3 | ElevenLabs changes its API shape | Medium | Medium | Provider interface isolates it to one file; a malformed 200 fails loudly rather than reaching the browser |
| R4 | Someone commits a real `.env` | Low | Critical | `.env*` gitignored except `.env.example`; CI secret scan |
| R5 | The CAT set is downloaded despite the gate | Medium | Medium | Accepted. It is a deterrent by design and the UI says so — ADR 0004 |
| R6 | `'unsafe-inline'` on script-src is exploited | Low | High | No user-generated content reaches the DOM; every string is a compile-time constant. Conditions to revisit are written into ADR 0006 |
| R7 | Contact form used to send abuse | Medium | Low | Honeypot, rate limit, length caps, no HTML rendered from the body |

---

## 10. Out of scope

- Any redesign of the console, palette or type.
- Mockup sections — BUILD_SPEC §13 forbids them.
- A CMS or admin UI.
- Authentication. There are no user accounts.
- Hosting the AI agent's *training* pipeline. Only the conversation is hosted.
- Internationalisation. English only, deliberately — BUILD_SPEC §3 forbids Urdu UI. i18n marked **N/A** for Gate 18.
- Payments, analytics with personal data, newsletters.

---

## 11. Compliance and data

| Question | Answer |
|---|---|
| Personal data collected | Contact form: name, email, message. Nothing else. |
| Tracking / analytics | None. No cookies are set by this site. |
| Third-party data sharing | Voice audio goes browser → ElevenLabs directly, under their terms. The site never receives or stores it. |
| Data residency | Undecided until a host is chosen. MongoDB region is the operator's choice. |
| Retention | Messages 2 years, voice audit rows 90 days — both enforced by MongoDB TTL indexes, not by a cron nobody runs. |
| Right to erasure | Documented in `docs/05-security.md` §8. |
| IP addresses | Never stored. Hashed with a per-boot salt for rate-limit forensics only. |
| i18n | **N/A** — English-only interface is a stated design requirement. |
