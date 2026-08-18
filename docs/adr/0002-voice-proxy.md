# ADR 0002 — Broker the voice agent through a backend proxy

**Status:** accepted · **Date:** 2026-08-15 · **Deciders:** owner, architect,
security engineer

---

## Context

The thesis includes an AI agent trained on the research that speaks in Inam's
cloned voice and plays his parents' real recordings rather than impersonating
them. It is one of the strongest things in the portfolio.

The original site could not host it. `BUILD_SPEC.md` §8a:

> **Do not attempt to host the agent itself.** It holds API keys client-side and
> publishing it would expose them.

That was the correct call for a static site. An ElevenLabs API key in a browser
bundle is not partially exposed — it is published. Anyone can read it out of the
JavaScript, and it authorises the whole account: voice cloning, every agent,
every credit on the plan.

The requirement for this build is to host the agent **and** keep the key private.

---

## Decision

Introduce a backend whose primary job is to hold the credential, and give the
browser a short-lived, single-purpose token instead.

```
1. Browser  → POST /api/v1/voice/session          (sends no credential)
2. Backend  → ElevenLabs, with xi-api-key         (the only hop the key exists on)
3. Backend  ← { signed_url }                      (valid ~60s to OPEN the socket)
4. Browser  ← { signedUrl, expiresAt }            (Cache-Control: no-store)
5. Browser  → wss://…signed_url                   (audio only, no key)
```

What the browser ends up holding is a URL that is scoped to one agent and one
conversation, dies in about a minute, and is useless for anything else on the
account.

### Why not have the backend relay the audio too

Considered and rejected. It would have put a Node process in the media path for
every conversation: doubled latency, real bandwidth cost, and a WebSocket fan-out
problem to solve for no security benefit — the signed URL is already scoped.
Brokering the handshake and stepping aside is the right amount of backend.

### Why not OpenAI Realtime or a browser-side ephemeral token from another vendor

The agent speaks in Inam's *cloned* voice. That is ElevenLabs' capability and the
reason the thesis works. The provider was confirmed with the owner.

---

## Enforcement

The property is asserted, not assumed:

| Guard | Where |
|---|---|
| Only one file reads `ELEVENLABS_API_KEY` | `backend/src/modules/voice/providers/elevenlabs.provider.js` |
| The controller allowlists response fields | `voice.controller.js` — a provider leaking a key into its own return value still could not get it out |
| Response contains no key, in any form | `tests/voice.test.js`, asserted on every run |
| Key travels in the header and nowhere else | `tests/elevenlabs.provider.test.js` |
| Nothing key-shaped in the shipped bundle | `tests/e2e/portfolio.spec.ts` |
| The signed URL is never logged | pino redaction list, and the service never passes it to the logger at all |
| The signed URL is never persisted | `voiceSession.model.js` stores outcome and latency, not the token |

Belt and braces on purpose. The response allowlist alone would be enough; the
tests exist because "enough" is what people say before a refactor.

---

## Cost controls

A voice session bills per minute, so an unbounded endpoint is an unbounded
invoice. Three controls, cheapest first:

1. **Origin check** — refuses anything not sent by the portfolio. A deterrent
   against casual scraping, not authentication, and labelled as such in the code.
2. **Global limiter** — caps total sessions per window across all callers. The
   ceiling on the bill.
3. **Per-IP limiter** — caps one visitor looping.

And in the widget: the microphone prompt is raised **before** a session is
requested. The other order burns a billable session every time somebody presses
the button and then denies the mic.

---

## Consequences

**Good**

- The agent is live. The strongest piece of the thesis is now interactive rather than a video.
- The key is not in the bundle, the network response, the logs, or the database.
- Audio is peer-to-vendor: no latency tax, no bandwidth bill.
- The provider is swappable behind one interface.
- Every session is recorded, so a cost spike has an answer.

**Bad, and accepted**

- The site now needs a server, where it needed none. Mitigated: the portfolio
  renders in full with the backend down; only the agent and the form stop.
- The signed URL **is** a bearer token for one conversation. Anyone who reads it
  out of a visitor's tab could hold one conversation. Mitigated by its ~45s life,
  the rate limits, and never writing it down. Accepted as low impact.
- Rate limits are in-process, so they assume one instance. Flagged in the runbook.

---

## Revisit when

- ElevenLabs changes the signed-URL contract — a malformed 200 already fails
  loudly rather than reaching the browser, so this surfaces as an alert, not a
  silent break.
- The backend is scaled past one instance — move the limiters to Redis first, or
  the cost ceiling quietly multiplies.
- Voice spend exceeds the budget — tighten `VOICE_GLOBAL_LIMIT_MAX`, or set
  `VOICE_PROVIDER=mock` as the kill switch.

---

## One copy change this forced

`PORTFOLIO_COPY.md` is verbatim by rule (BUILD_SPEC §9, §13). One sentence was
removed anyway, because this decision made it false:

> ~~The agent itself is not hosted here. It holds API keys client-side, so
> publishing it would expose them.~~

It was true of the old site. Leaving it in place would have made it the only
false statement on the portfolio. The replacement states what is now true: the
session is live, the microphone is only on while the visitor holds it open, and
nothing said is stored by this site.
