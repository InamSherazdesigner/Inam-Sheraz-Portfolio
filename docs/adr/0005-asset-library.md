# ADR 0005 — Copy the full 1.4 GB archive, but keep it out of what ships

**Status:** accepted · **Date:** 2026-08-15 · **Decided with:** the owner

## Context

The original project folder is 1.4 GB. The website serves about 82 MB of it:

| | Size | Serves the site |
|---|---|---|
| `assets/*.webp` | 65 MB, 73 files | yes |
| `assets/video/` | 51 MB, 15 files | yes |
| `sprites/` | 17 MB | yes |
| `assets/_source/` | **1.4 GB** | **no** |

`_source/` is the working archive — raw PSD/AI exports, print PDFs, full-resolution
PNGs. The website references none of it.

The instruction was to copy all of it: *"We will use the assets later in the
website."*

## Decision

Copy everything, and split it by whether the web server should ever see it.

```
frontend/public/assets/     65 MB   served, committed, CDN-cached immutable
frontend/public/assets/video/ 51 MB served, committed
frontend/public/sprites/    17 MB   served, committed
asset-library/_source/     1.4 GB   present, NOT served, NOT committed
```

`asset-library/` sits at the repository root, beside the code, one `cd` away. It
is in `.gitignore`.

## Why not put `_source/` in `public/`

Next serves `public/` verbatim, so it would work — and would be wrong in three
ways:

1. **Every deploy would push 1.4 GB.** Build and deploy times go from seconds to
   many minutes, on every change.
2. **Git would be unusable.** 1.4 GB of binaries with no LFS makes clone, fetch
   and history operations painful permanently, and it cannot be undone later
   without rewriting history.
3. **It would be publicly downloadable.** Layered PSDs and print-ready PDFs of
   client work would be at guessable URLs, indexed by search engines. Nobody
   asked for that, and it is the kind of exposure that is noticed long after.

## Consequences

**Good** — nothing is lost; the archive is right there for future work. The
repository stays around 130 MB, which git handles fine. Deploys stay fast. No
source file is exposed.

**Bad** — `asset-library/` is not backed up by git. It is a copy of what is still
in the original `Portfolio Web/assets/_source/`, so there are two copies today,
but neither is versioned. `docs/04-runbook.md` §7 lists it as operator-managed
backup.

## To use an archived asset later

1. Export a web-ready `.webp` from `asset-library/_source/…`
2. Put it in `frontend/public/assets/` following the existing `NN-project-NN-name.webp` convention
3. Reference it in `frontend/src/content/projects.ts`

The content test then verifies the path resolves, so a typo fails the build
rather than showing a broken image on the portfolio.
