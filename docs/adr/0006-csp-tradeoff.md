# ADR 0006 — Allow inline scripts in CSP, keep every route static

**Status:** accepted · **Date:** 2026-08-15 · **Deciders:** security engineer,
architect

## Context

The frontend shipped with `script-src 'self'`. It broke the site.

Next's App Router hydrates through inline `<script>` tags carrying the RSC
payload. Under `script-src 'self'` the browser blocks them, React throws error
#412, and the console never boots past its splash. An E2E test caught it in the
production build — nothing in unit tests, type checking or `next build` would
have, because the failure only exists in a real browser enforcing a real header.

That is worth recording on its own: the strictest-looking header was also a
total outage.

## Options

**A. Per-request nonce from middleware.** The textbook answer, and strictly the
better CSP. But reading the nonce in the layout forces every route to render
dynamically. All 17 routes are currently static HTML a CDN serves without ever
waking a server — that is most of the performance and cost story of this site.

**B. Allow inline scripts, and remove what `'unsafe-inline'` protects against.**

**C. Hash the inline scripts.** Their content changes with every build and with
the RSC payload of each route. Not maintainable.

## Decision

**Option B.** `script-src 'self' 'unsafe-inline'` in production.

The reasoning is specific to this site, not general:

`'unsafe-inline'` matters when an attacker can get a string into the page. Here
there is no such string. Every value rendered is a compile-time constant from
`src/content/`. There is no CMS, no user-generated content, no search parameter
that reaches the DOM, no third-party embed, and no API response rendered as
markup. The one component that sets HTML directly — `RichText` — documents that
constraint as its precondition and states what must change if it stops holding.

Everything else in the policy stays locked, so the usual escalation paths are
closed regardless:

```
default-src 'self'          object-src 'none'
base-uri 'self'             frame-ancestors 'none'
form-action 'self'          connect-src 'self' <api> https://api.elevenlabs.io wss://api.elevenlabs.io
```

`connect-src` is the one that earns its keep. Even if something on the page were
compromised, it could not exfiltrate anywhere but our own API and ElevenLabs.

`style-src` also carries `'unsafe-inline'`: Next injects critical CSS inline and
there is no nonce-free alternative.

## Consequences

**Good** — 17 static routes, CDN-servable, no server on the render path. The
policy that remains is genuinely tight.

**Bad** — an injected script would execute if one could ever be injected. The
site's structure is what prevents that, rather than the header, which means the
protection is a property of how the code is written rather than something the
browser enforces. That is a weaker guarantee and it is why the revisit conditions
below are written down rather than left to judgement.

## Revisit — any one of these is sufficient

- A CMS, comment, form echo, or any content the site did not compile.
- A query parameter or route parameter rendered into markup.
- A third-party script or embed.
- `RichText` being used for anything not authored in this repository.

At that point Option A becomes worth its cost, and this ADR is superseded rather
than amended.
