# ADR 0007 — Two additions to a locked palette, to reach WCAG AA

**Status:** accepted · **Date:** 2026-08-15 · **Decided by:** the owner

## Context

Two requirements in the brief conflict directly.

`BUILD_SPEC.md` §3 locks the palette: nine colours, *"Do not introduce new
colours. One accent only."*

`BUILD_SPEC.md` §12 and SES Gate 5 require WCAG AA.

An axe-core scan of the ported design found **119 contrast violations** across
five states. The palette cannot meet AA as specified.

## What was measured

| Pair | Where | Ratio | AA needs |
|---|---|---|---|
| `--ink` @ 0.60 on amber | body captions, credits, labels — 83 elements | 3.62:1 | 4.5:1 |
| `--accent` #C7401F on amber | eyebrows, note labels, index label — 35 elements | **2.29:1** | 4.5:1 |
| `--amber` on `--accent` fill | selected row, A-prompt, skip link, button hovers | **2.29:1** | 4.5:1 |
| white @ 0.42 on bezel | the POWER label | 4.05:1 | 4.5:1 |
| amber @ 0.62 on bezel | the stage bar's project number | 4.02:1 | 4.5:1 |
| amber @ 0.34 border | the Back button outline | 1.97:1 | 3:1 (1.4.11) |

## Decision

### Fixed inside the existing system — no approval needed

Everything driven by an alpha was raised. These are not new colours; they are the
same nine colours with less ground showing through, which is exactly what the
palette's own "derived, not new colours" section already does.

```
--ink-60  0.60 → --ink-75  0.75      3.62:1 → 5.21:1
POWER label      0.42 → 0.50         4.05:1 → 5.30:1
stage__id        0.62 → 0.78         4.02:1 → 5.40:1
back button border 0.34 → 0.50       1.97:1 → 3.00:1
LCD row / count / footer alphas raised to 0.78–0.82
```

That cleared 84 of the 119.

### Required the owner's decision — two new values

The remaining 35 were the vermilion itself, and no alpha fixes a hue against a
ground. Both were put to the owner with measurements, and both were approved.

**`--accent-ink: #681E0E`** — the same vermilion, darker. Used **only** where the
accent is small text on a ground.

```
                  amber   ink-08 panel   LIMINAL   LIMINAL panel
  #C7401F         2.29      1.98          4.68        4.21     ✗
  #7A2412         4.59      3.98          9.38        8.43     ✗ panel
  #681E0E         5.39      4.67         11.00        9.89     ✓ all
```

The panel column is what settled it. Notes and the voice widget sit on
`--ink-08`, which darkens the amber beneath them to `#D79638`; a value chosen
against pure amber alone failed there. Measured, not guessed.

**`--on-accent: #FFFFFF`** — text *on* the vermilion fill. Amber on vermilion is
the same failing pair inverted (2.29:1), and it carries the selected row, the
A-prompt, the skip link and every button hover. Near-white takes it to 4.99:1.

The alternatives were measured too: `--mat` #F2EBDD reaches only 4.18:1, and a
lighter amber tint tops out around 4.33:1. White is the first value that clears
AA without changing the fill.

## What did not change

`--accent` #C7401F itself is untouched. It still carries every fill, border,
focus ring and the selection bar — the signature of the whole interface. The
console reads as designed; a real brick-game LCD inverts a selected row to the
lightest value it has, so the white text arguably sits closer to the object being
imitated, not further from it.

## Result

**119 violations → 0**, across the console, the one-page view, a project page,
the open full view and the contact form, on desktop and mobile. Verified by
`tests/e2e/accessibility.spec.ts` on every CI run.

## Note on a test artifact found in the same pass

An earlier scan reported contrast failures inside the full view that did not
exist. Entering a project runs `res-gain`, which holds the document at
`opacity: 0.55` for its first frames; axe was measuring every colour against a
half-transparent version of itself. The scan now waits for animations to settle
first. Recorded because it is the kind of false positive that gets "fixed" by
changing a colour that was never wrong.

## Consequence

The palette is now eleven values rather than nine. Both additions are shades of
colours already in it, both are documented at their definition with the
measurement that forced them, and both were approved by the designer. The rule
"one accent only" still holds in the sense that mattered: there is one accent
hue, at two lightnesses, chosen so people can read the site.
