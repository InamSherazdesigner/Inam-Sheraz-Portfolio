# Gate 6 — Security

**Owner:** Security Engineer · **Status:** approved · **Date:** 2026-08-15

---

## 1. Threat model

A public portfolio with no user accounts, no payments and no personal data beyond
a contact form. The assets actually worth protecting are short:

| Asset | Value to an attacker | Protection |
|---|---|---|
| **ElevenLabs API key** | Full account access — voice cloning, every agent, every credit | Server-only, one file, never in a response, log or database |
| ElevenLabs credit balance | Free voice minutes | Per-IP limit, global limit, origin check, mic-prompt-first |
| Contact messages | Personal data | Length caps, TTL, no HTML rendering, hashed client |
| CAT illustration set | Research integrity | Deterrent gate, honestly labelled (ADR 0004) |
| The site itself | Defacement, SEO spam | Static build, no CMS, no write path to content |

**Not in the model:** no authentication, no authorisation, no sessions, no
payments, no file uploads, no admin surface. Gates for RBAC, ABAC, JWT, OAuth,
SSO and MFA are **N/A** — there is nothing to log into.

---

## 2. The credential

The one property this whole architecture exists to provide:

> `ELEVENLABS_API_KEY` is read by exactly one file, on the server, and never
> appears in anything the browser receives.

| Layer | Guard |
|---|---|
| Source | Only `backend/src/modules/voice/providers/elevenlabs.provider.js` reads it |
| Config | `env.js` refuses to boot with `VOICE_PROVIDER=elevenlabs` and no key; refuses to boot in production with `mock` |
| Response | `voice.controller.js` allowlists fields — a provider leaking a key into its own return value still could not get it out |
| Logs | pino redacts `xi-api-key`, `authorization`, `apiKey`, `signedUrl`; the service never passes the URL to the logger at all |
| Database | `voiceSession` stores outcome, latency, hashed client. Never the token |
| Transport | `Cache-Control: no-store` on the session response — a caching proxy would otherwise hand one visitor's token to the next caller |
| Repo | `.env*` gitignored except `.env.example`; CI secret scan |
| Test | `voice.test.js`, `elevenlabs.provider.test.js`, `portfolio.spec.ts` all assert it, every run |

---

## 3. OWASP Top 10 (2021)

| # | Risk | Status | Notes |
|---|---|---|---|
| A01 | Broken access control | **N/A / addressed** | No accounts. Origin check + rate limits on cost-bearing endpoints. CAT gate is a documented deterrent (ADR 0004) |
| A02 | Cryptographic failures | **Addressed** | No secrets at rest beyond env. IPs hashed with a per-boot salt. HSTS. Password compared with `timingSafeEqual` |
| A03 | Injection | **Addressed** | No SQL. Mongoose with `strictQuery`, schema-typed fields, zod validation stripping unknown keys — no mass assignment. No shell execution. No `eval` |
| A04 | Insecure design | **Addressed** | Cost controls designed in, not bolted on. Fail-safe boot. Graceful degradation on both dependencies |
| A05 | Security misconfiguration | **Addressed** | Env validated at boot and frozen. helmet. `x-powered-by` off. Stack traces gated on `NODE_ENV`, not a flag |
| A06 | Vulnerable components | **Addressed** | `npm audit`: **0 vulnerabilities**, dev and prod. Next 15 → 16 specifically to clear postcss and sharp advisories. CI fails on high |
| A07 | Auth failures | **N/A** | No authentication exists |
| A08 | Integrity failures | **Addressed** | Lockfile committed. No dynamic remote code. CSP `connect-src` names two hosts |
| A09 | Logging failures | **Addressed** | Structured logs, correlation IDs, audit rows, redaction. Health and metrics endpoints |
| A10 | SSRF | **Addressed** | One outbound host, from a validated base URL. No user input reaches a URL |

### The rest of the checklist

| Risk | Status |
|---|---|
| XSS | No user input renders. `RichText` documents its precondition. Everything variable goes through JSX escaping |
| CSRF | **N/A** — no cookies, no sessions, `credentials: 'omit'`. Nothing to ride |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| Command injection | No shell execution anywhere |
| Path traversal | No filesystem access from a request |
| File upload | **N/A** — no upload exists |
| Open redirect | No redirect takes a parameter |
| Log injection | `x-request-id` filtered to `[A-Za-z0-9._-]{1,64}` before it reaches a log |
| Prototype pollution | zod builds fresh objects; no deep merge of request data |

---

## 4. Headers

**Frontend** (`next.config.mjs`)

```
Content-Security-Policy      default-src 'self'; object-src 'none';
                             frame-ancestors 'none'; base-uri 'self';
                             form-action 'self';
                             connect-src 'self' <api> https://api.elevenlabs.io
                                                     wss://api.elevenlabs.io
X-Content-Type-Options       nosniff
X-Frame-Options              DENY
Referrer-Policy              strict-origin-when-cross-origin
Strict-Transport-Security    max-age=15552000; includeSubDomains
Permissions-Policy           camera=() geolocation=() payment=() usb=()
                             interest-cohort=() microphone=(self)
```

`script-src` carries `'unsafe-inline'`. That is a deliberate, documented
trade-off — ADR 0006 states why, and the exact conditions under which it must be
revisited.

`microphone=(self)` is the only capability granted, and the only one the site
needs.

**Backend** — it renders no HTML, so it takes the strictest policy available:
`default-src 'none'`, `frame-ancestors 'none'`, `Referrer-Policy: no-referrer`,
`Cross-Origin-Resource-Policy: same-site`.

Both header sets are asserted by tests (`app.test.js`, `portfolio.spec.ts`).

---

## 5. Rate limits

| Endpoint | Per IP | Global | Why |
|---|---|---|---|
| `POST /voice/session` | 10 / 15 min | 120 / 15 min | **Cost.** Each session bills per minute |
| `POST /contact/messages` | 5 / hour | — | Spam |
| `POST /gate/cat/verify` | 20 / 15 min | — | Slows guessing |
| everything | 300 / min | — | Blunt backstop |

Health endpoints are exempt: a throttled probe reads as an outage and can trigger
a pointless restart loop.

**Known limitation.** In-memory, therefore per-process. Correct for the
single-instance deployment in the runbook. At N instances the limit becomes N×
looser and the cost ceiling multiplies — move to a Redis store before scaling
out. Flagged in `docs/04-runbook.md` §8.

---

## 6. Least privilege

- Container runs as the unprivileged `node` user, never root.
- Production image carries production dependencies only — no compilers, no test tooling.
- CORS allowlists origins from config; wildcards are impossible by construction.
- `trust proxy` is `1`, not `true`. Trusting every hop would let a caller forge `X-Forwarded-For` and walk straight past the rate limits.
- MongoDB user needs read/write on two collections. Nothing else.
- The ElevenLabs key should be scoped to Conversational AI if the plan allows.

---

## 7. Secrets

| | |
|---|---|
| Storage | Env vars only. `.env` gitignored; `.env.example` documents shape with no values |
| Validation | Parsed and frozen at boot. Missing or malformed = refuse to start, with a readable message |
| Rotation | Replace the env var and restart. Nothing caches a credential |
| Frontend | **`frontend/.env.example` states in its header that every value there is public.** `NEXT_PUBLIC_*` is inlined into the bundle. There is no key there and there must never be one |
| CI | Secret scan on every push |

---

## 8. Data governance

| | |
|---|---|
| Classification | Contact messages — *confidential*. Voice audit rows — *internal*. Everything else — *public* |
| Personal data | Contact form only: name, email, message |
| IP addresses | **Never stored.** SHA-256 with a per-boot salt, truncated. Correlatable within a run, not across a restart, and not reversible |
| Retention | Messages 2 years; voice audit 90 days. Both enforced by MongoDB TTL indexes, built by `npm run seed` — not by a cron nobody runs |
| Right to erasure | `db.messages.deleteMany({ email: "<address>" })`. Voice rows contain nothing identifying, so nothing to erase there |
| Third-party processing | Conversation audio goes browser → ElevenLabs directly, under their terms. This site never receives, proxies or stores it — and the widget tells the visitor so before they start |
| Tracking | None. No analytics, no cookies, no fingerprinting. Fonts are self-hosted, so not even a font CDN sees a visitor's IP |
| Cross-border transfer | ElevenLabs processes in their regions. To be reviewed against the operator's jurisdiction before launch — `docs/08-delivery-report.md` §7 |

---

## 9. What was found and fixed during this build

| Finding | Severity | Resolution |
|---|---|---|
| `script-src 'self'` blocked hydration — total outage in production | **Critical** | Diagnosed via E2E, fixed and documented in ADR 0006 |
| Next 15 pulled vulnerable postcss and sharp | High | Upgraded to Next 16. Audit now clean |
| 119 WCAG AA contrast failures inherited from the palette | Serious | 84 fixed inside the palette's alpha system; 35 by two owner-approved shades. ADR 0007 |
| Keyboard handler swallowed Enter on the skip link | Serious (a11y) | Scoped to activating keys only |
| A too-broad fix then broke B on the focused Back button | Moderate | Narrowed to Enter and Space; both directions now have tests |
| Inline `opacity: 0.6` on a form label dropped it to 2.51:1 | Moderate | Removed |

Each was caught by a gate rather than by a visitor, which is the point of having
them.

---

## 10. Residual risk, accepted

1. **The CAT set is downloadable.** By design — the gate is a deterrent and says so (ADR 0004).
2. **A signed URL is a bearer token for one conversation.** ~45s life, rate-limited, never logged or stored. Low impact, accepted (ADR 0002).
3. **`'unsafe-inline'` on script-src.** Mitigated by the absence of any injection surface; revisit conditions written into ADR 0006.
4. **Rate limits assume one instance.** Correct today, must change before scaling out.
