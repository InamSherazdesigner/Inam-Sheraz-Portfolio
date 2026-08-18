# ADR 0004 — Move the CAT password to the server, and keep calling it a deterrent

**Status:** accepted · **Date:** 2026-08-15

## Context

The CAT Illustrations project redraws the Children's Apperception Test for a
psychology study. The test depends on children not having seen the cards before,
so publishing the complete set would compromise the research it was made for. The
researcher asked for it to stay unpublished.

`BUILD_SPEC.md` §10 is unusually direct about what the gate is:

> A client-side password is not real security — it is a deterrent, and that is
> all it is meant to be. **Do not claim otherwise in the UI.**

In the original build the password was a string in `data.js`. View source, ten
seconds, done.

## Decision

Verify the password **server-side** at `POST /api/v1/gate/cat/verify`, with a
constant-time comparison and a rate limit. Keep the images as static files at
their existing paths. Keep the UI copy that says this is a deterrent.

## What this buys, and what it does not

**Buys:** the password is no longer in the JavaScript bundle. Guessing is
rate-limited to 20 attempts per 15 minutes. The comparison is timing-safe.

**Does not buy:** anything at all against someone who reads the image URLs. They
are predictable (`/assets/09-cat-01.webp` … `-10`), and the preview details are
already three of the ten. Anyone who wants the set can have it.

## Why the images were not moved behind an authorising proxy

That would be real access control: images out of `public/`, served by the backend
only after a verified session.

Rejected, for reasons in this order:

1. **The spec asks for a deterrent, not security.** Building real access control
   would be solving a different problem than the one stated.
2. **It would make the site depend on the backend to render a project.** ADR 0003
   deliberately keeps the portfolio working with the backend down. Ten images
   behind an API would break that for one project.
3. **It would put ten large images on the Node process's bandwidth**, where every
   other artwork is served by a CDN.
4. **The threat model does not support it.** The realistic risk is a curious
   visitor clicking through, not a determined actor. A deterrent stops the first
   and nothing stops the second short of not publishing at all — which is why the
   full set is not in the preview.

## The honesty requirement

The UI says, verbatim and in the page:

> This is a deterrent held in the page, not security — anyone determined can read
> past it. Ask and I will send the set.

`tests/e2e/portfolio.spec.ts` asserts the phrase "not security" is visible on the
project page, so a future copy edit cannot quietly turn a deterrent into a
security claim.

## Consequences

- Password lives in `CAT_GATE_PASSWORD` (backend env), not in the bundle. Rotating it is an env change and a restart.
- One project's unlock needs the backend. If it is down, the preview details and the full explanation still render — only the unlock fails.
- The claim stays accurate, which was the actual requirement.
