# Inam Sheraz — Portfolio

A portfolio that is not a scrolling page of work. It is a handheld games console
the visitor operates: the console is the navigation, and selecting a project
opens it full-screen.

Rebuilt from the original static site as a Next.js frontend and an Express /
MongoDB backend, so the thesis project's **voice agent can finally be hosted
without publishing an API key**.

```
Portfolio Web New/
├── frontend/          Next.js 16 · React 19 · TypeScript   → the website
├── backend/           Express 4 · MongoDB · Node 20+       → holds every credential
├── docs/              requirements, architecture, ADRs, runbook, QA
└── asset-library/     the 1.4 GB working archive (not served, not committed)
```

---

## The one thing this build exists to fix

The original site could not host the thesis AI agent. `BUILD_SPEC.md` §8a said so
plainly:

> Do not attempt to host the agent itself. It holds API keys client-side and
> publishing it would expose them.

It now runs, and the key never leaves the server:

```
  browser ──POST /api/v1/voice/session──▶ backend      no credential sent
                                          │ adds xi-api-key
                                          ▼
                                    ElevenLabs REST
                                          │
                        ◀── { signed_url }  expires ~45s
  browser ◀── { signedUrl, expiresAt } ────┘
  browser ──wss://…signed_url──▶ ElevenLabs           audio only, no key
```

The browser receives a signed WebSocket URL scoped to one agent and one
conversation. Audio flows straight from the visitor to ElevenLabs, so the server
is not in the media path and pays for no bandwidth. Grep the built bundle for the
key and it is not there — there is no code path that could put it there, and a
test asserts it on every run.

Full reasoning: [`docs/adr/0002-voice-proxy.md`](docs/adr/0002-voice-proxy.md).

---

## Running it

Prerequisites: **Node 20.11+**, and **MongoDB** if you want the contact form to
store anything (the site renders fine without it).

```bash
npm install

cp backend/.env.example  backend/.env
cp frontend/.env.example frontend/.env

npm run dev          # backend on :4000, frontend on :3000
```

Out of the box `VOICE_PROVIDER=elevenlabs`. To develop without credentials, set
`VOICE_PROVIDER=mock` in `backend/.env` — the widget then runs its whole state
machine against a fake session. The server refuses to boot in production with the
mock provider set, so it cannot leak into a deployment.

### Turning the real agent on

In `backend/.env` only. Never in `frontend/.env` — everything there is public.

```bash
VOICE_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=sk_…          # from elevenlabs.io → Profile → API Keys
ELEVENLABS_AGENT_ID=agent_…      # from Conversational AI → your agent
```

Then open <http://localhost:3000>, press ▶ on the WORK channel, open
**01 MOODIYAN TON AGGE**, and the agent is under "The agent".

---

## Commands

| Command | Does |
|---|---|
| `npm run dev` | Both services, watching |
| `npm run build` | Production build of the frontend |
| `npm test` | Unit and integration tests, both workspaces |
| `npm run test:e2e` | Playwright, desktop and mobile, against a production build |
| `npm run lint` | ESLint, both workspaces |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run verify` | Everything above, in the order CI runs it |
| `npm run seed` | Build MongoDB indexes, including the two TTL retention indexes |

---

## What is where

**Frontend** — `frontend/src/`

| Path | Holds |
|---|---|
| `app/` | Routes: `/` the console, `/everything` the one-page view, `/work/[slug]` one project |
| `components/console/` | The object: shell, D-pad, A/B, START, the LCD |
| `components/lcd/` | The four LCD states — boot, menu, load, card |
| `components/stage/` | The full view, stage 5 |
| `components/blocks/` | The shared document renderer both routes use |
| `components/voice/` | The voice agent widget |
| `content/` | **Every word on the site**, typed. Transcribed verbatim from `PORTFOLIO_COPY.md` |
| `hooks/useConsole.ts` | The state machine: `off → boot → menu → load → card → full` |
| `styles/` | The locked design system, ported from the original build |

**Backend** — `backend/src/`

| Path | Holds |
|---|---|
| `modules/voice/` | The session broker. `providers/elevenlabs.provider.js` is the only file that touches the key |
| `modules/contact/` | The contact form |
| `modules/gate/` | The CAT set password check |
| `modules/health/` | `live`, `ready`, `metrics` |
| `middleware/` | Request IDs, security headers, rate limits, validation, the one error handler |
| `lib/resilience.js` | Timeout, retry with jitter, circuit breaker |

---

## Documentation

| Document | Covers |
|---|---|
| [`docs/01-requirements.md`](docs/01-requirements.md) | What was built and why, edge cases, risks, out-of-scope |
| [`docs/02-architecture.md`](docs/02-architecture.md) | Diagrams, module boundaries, data flow, scaling |
| [`docs/03-api.md`](docs/03-api.md) | Every endpoint. Machine-readable at `/openapi.json` |
| [`docs/04-runbook.md`](docs/04-runbook.md) | Deploy, rollback, incidents, DR, on-call |
| [`docs/05-security.md`](docs/05-security.md) | Threat model, OWASP pass, secrets, data governance |
| [`docs/06-performance.md`](docs/06-performance.md) | Budgets, Core Web Vitals, caching |
| [`docs/07-qa.md`](docs/07-qa.md) | Test strategy, coverage, the manual checklist, WCAG results |
| [`docs/08-delivery-report.md`](docs/08-delivery-report.md) | Gate-by-gate sign-off, and what is deliberately outstanding |
| [`docs/adr/`](docs/adr/) | Seven decisions, with the reasoning and the conditions to revisit them |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | What changed from the original build |

The original spec and copy are preserved unmodified in
[`docs/reference/legacy/`](docs/reference/legacy/), along with the previous
site's source, so any claim in this build can be checked against what it was
asked to do.

---

## Still outstanding

Both are deliberate and visible in the UI, not forgotten:

- **Contact details.** Email, Instagram, Behance, LinkedIn and CV render as loud
  `— still to add —` placeholders. Fill them in
  `frontend/src/content/channels.ts`; the placeholder disappears on its own.
- **Loading sprites for 02 DLEA and 03 The King's Hand.** Their slot says
  `SPRITE TO COME` rather than faking one. Drop a 1-bit PNG in
  `frontend/public/sprites/` and set `sprite:` on the project.

---

## Licence

All artwork, photography, illustration and written copy © Inam Sheraz. Not
licensed for reuse. The `asset-library/` archive is excluded from version control.
