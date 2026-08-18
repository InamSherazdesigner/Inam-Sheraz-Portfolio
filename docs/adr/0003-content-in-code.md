# ADR 0003 — Site content stays in code; MongoDB holds only what changes

**Status:** accepted · **Date:** 2026-08-15 · **Decided with:** the owner

## Context

"MERN" implies MongoDB, and the obvious reading is that the eleven projects live
in a `projects` collection. The original build has all of it hard-coded in
`data.js`.

## Decision

**Content stays in code**, as typed modules in `frontend/src/content/`. MongoDB
stores only what the site does not know at build time:

| Collection | Holds |
|---|---|
| `messages` | Contact enquiries. 2-year TTL |
| `voice_sessions` | One audit row per session: outcome, latency, hashed client. 90-day TTL |

## Why

**The content does not change.** It is eleven finished projects with copy the
spec forbids rewriting. Putting immutable text behind a database adds a network
hop, a failure mode and an admin UI to a problem that does not exist.

**Availability.** With content compiled in, a page render touches no database and
no network. Mongo can be down, the backend can be down, and the portfolio still
renders in full — every project, every image, every word. That is the single
biggest resilience property this site has, and a `projects` collection would
trade it away for nothing.

**Speed.** All 17 routes prerender to static HTML. A CDN serves them. No query on
the render path means no query to optimise, no N+1 to avoid, no cache to invalidate.

**Correctness.** Content in TypeScript is type-checked and testable.
`tests/unit/content.test.ts` verifies every one of 100+ artwork paths resolves to
a real file, that no image is missing alt text, that nothing with sound
autoplays, that the Khushi Ya Majboori note precedes the images it gates, and
that every credit line the spec requires is present. None of that is possible
against rows in a database that CI cannot see.

## Consequences

**Good** — the site survives both dependencies being down; zero database load on
the render path; content bugs fail the build rather than the visitor.

**Bad** — a copy change needs a commit and a deploy. Accepted: the owner is the
only author, works in the repository already, and a static rebuild takes under a
minute.

## Revisit when

Someone other than the owner needs to edit copy, or content needs to change
without a deploy. At that point the content modules become the seed for a real
collection, and the typed shape in `content/types.ts` becomes the schema — the
migration path is already the shape of the data.
