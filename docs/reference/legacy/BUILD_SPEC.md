# BUILD SPEC — Inam Sheraz Portfolio Website

**Read this whole file before writing any code.**

---

## HOW TO USE THIS FILE

Open **`D:\DESKTOP\Portfolio (Basic)\Portfolio Web\`** as the working folder in Claude Code.
Everything referenced below already exists inside it. Nothing needs uploading.

| What | Where |
|---|---|
| This spec | `BUILD_SPEC.md` |
| All website copy | `PORTFOLIO_COPY.md` |
| All artwork, 74 files | `assets/` |
| Sprites | `sprites/` |
| Video and audio, 14 files | `assets/video/` |
| Locked console reference image | `sprites/00-console-locked-reference.png` |
| Locked character reference | `sprites/00-character-locked-reference.png` |

Build the site into `Portfolio Web/site/` so the tools and source folders stay separate.

---

## 1. WHAT WE ARE MAKING

A portfolio website for **Inam Sheraz**, a graphic designer and illustrator graduating in 2026 from the Institute for Art & Culture, Lahore. He is applying to design studios and agencies.

The site is **not a scrolling page of work**. It is a **handheld games console** that the visitor operates. The console is the navigation. Selecting a project opens it full-screen.

The console form is fixed and already designed — see `sprites/00-console-locked-reference.png`. A compact charcoal brick-game console with an amber LCD screen, a D-pad on the left, two round buttons on the right, a small always-lit power LED, and a START button. **Match that object.** Do not redesign it.

---

## 2. THE REFERENCE

**https://areebali.com** — study this before building. It is the interaction model.

It presents itself as a handheld device. Its interface contains:
- A `POWER` control and a `BACK` control
- A version number, `V2.1.1`, treated as interface furniture
- Tabbed channels — `WORK`, `AI FILMS`, `PLAYGROUND` — with an item count, `8 ITEMS`
- A numbered list of projects with years, and the instruction `tap a line to open`
- `PRESS POWER` as a prompt

**The single most important thing to copy from it:** the full project list is visible as readable text immediately on load. The device frames an index; it does not hide one. An earlier version of this project hid the list behind a thumbnail and it failed for exactly that reason.

Secondary references for tone: `imsaud.me` (keyboard-driven menu, keycap hints), `s0animation.com/design` (thin top bar, active item in a solid highlight box), `k95.it/en/works` (extreme restraint).

---

## 3. PALETTE AND TYPE

```
--room        #0B0B0C   page ground, around the console
--body-1      #2A2B2E   console shell, light edge
--body-2      #1C1D20   console shell
--body-3      #121315   console shell, shadow edge
--bezel       #0A0A0B   screen surround
--amber       #E8A13C   THE LCD FIELD — the screen is amber
--ink         #17120A   pixels and type ON the amber screen
--accent      #C7401F   vermilion — selection, action, links. One accent only.
--lamp        #4FA06B   power LED only
```

**The LCD is dark pixels on an amber field**, not amber pixels on black. This was tested and chosen deliberately: it holds fine detail better, and it echoes ink on paper, which is what the artwork is.

Type: a monospace face for all interface text (DM Mono or similar). A serif for headings inside project pages (Fraunces or similar). No corporate sans anywhere.

**No Urdu in the interface.** No Urdu UI labels, no language toggle. Urdu appears only where it is part of the artwork itself — the thesis logo, the Khaadi poster, the Kushi Ya Majboori titles.

---

## 4. THE ORGANISING PRINCIPLE

Everything moves along one axis: **low resolution → full resolution.**

The console is memory. The work is the real thing. Going deeper always means gaining resolution. Every animation obeys this. Nothing in the site should contradict it.

---

## 5. CONTROLS

| Control | Does |
|---|---|
| **D-pad up / down** | Move through the list |
| **D-pad left / right** | Contextual — on the menu, change channel. Inside an open project, previous / next image. |
| **A** | Open, or go deeper |
| **B** | Back out one level |
| **START** | Boot / shut down the console |
| **Power LED** | Lamp only, always lit. There is no power button. |

There is **no SELECT button.**

Keyboard equivalents: arrows, `A` / `Enter`, `B` / `Escape`, `S` for start.

**The escape hatch lives OUTSIDE the console** as an always-visible text link beneath it:

> `VIEW EVERYTHING AS ONE PAGE →`

It opens every section as one plain scroll. It must be reachable without learning any control. This is not optional — it is how a hiring manager with thirty seconds gets to the work.

---

## 6. CHANNELS

Three channels, flicked between with D-pad left / right. The channel name shows in the LCD header with an item count.

- **WORK** — the eleven projects
- **ABOUT** — the bio
- **CONTACT** — links

About and Contact are **not** items in the work list.

---

## 7. THE FLOW WHEN A PROJECT OPENS

> **Visual reference for every stage below: `UI/state-1` through `UI/state-5`.**
> These are approved mockups of each state. Look at them before building. They show the intended
> proportions, spacing and hierarchy. The lettering inside them is AI-generated nonsense — ignore
> the words, read the layout.

**Stage 1 — The menu.** → `UI/state-1-menu-list.png`
The channel name and item count in a header row, then the numbered project list, one row highlighted as a solid vermilion bar, a thin footer hint.

**Stage 2 — Loading.** → `UI/state-2-loading-tetris.png`
A 1-bit sprite specific to that project appears on the LCD. Beneath it, a loading bar made of falling blocks that stack up, Tetris-style.

**Stage 3 — Card.** → `UI/state-3-info-card.png`
Still on the amber LCD. Project title, three or four lines of description, a counter such as `02 / 11`, and the prompt `▸ A — VIEW FULL WORK`. This is the preview step before committing.

**Stage 4 — Transition.** → `UI/state-4-transition-dissolve.png`
The stacked blocks complete a line and flash white — a line-clear. That flash is the cut. The sprite's pixels resolve into a chunky pixelated version of the real artwork, then sharpen in two steps to full resolution. The reference image shows the mid-dissolve moment: chunky blocks on one side resolving into sharp artwork on the other, with the white flash bleeding through the seam.

**Stage 5 — Full view.** → `UI/state-5-colour-stage.png`

> **THE FULL VIEW SITS ON THE AMBER LCD FIELD.**
> The background of the full-screen project view is the same amber as the console screen, carrying the same faint pixel-grid texture. The artwork is placed on top of that amber ground. The visitor has not left the screen — the screen has become the whole window.

Interface text in the full view stays in the pixel/mono font, small, in ink. The vermilion accent marks links and active states. A slim console bar remains pinned at the top so the object is still present.

`B` backs out one stage at a time. Exiting runs the transition in reverse.

**Motion discipline:** full ceremony the first time a project is opened; an abbreviated version on subsequent opens in the same session. Holding `B` or pressing `START` skips straight through. `prefers-reduced-motion` cuts instantly with no animation.

> **One flag on the amber full view.** It suits the thesis, Scents, the posters, the magazines and Juno — all warm work. It fights **LIMINAL**, which is black and white by its own stated design rule. Build the amber ground as a CSS variable that can be overridden per project, and set LIMINAL's to a near-white so its own rule is not broken.

---

## 8. THE PROJECTS

Eleven, in this order. Numbering is already baked into the asset filenames.

| # | Project | Assets | Notes |
|---|---|---|---|
| 01 | Moodiyan Ton Agge — thesis | `01-thesis-*` (21 images + video + audio) | Hero project. See section 8a below — it has more parts than any other. |
| 02 | DLEA Awards — Dubizzle Labs | video only | Freelance commission. Most valuable credential — must be visible early. |
| 03 | The King's Hand | `03-kings-hand-*` (2) | Poster, card deck, prototype, animation. |
| 04 | LIMINAL | `04-liminal-*` (6) | Logo, 3 posters, 2 manual spreads. **Black and white — override the amber ground.** |
| 05 | Scents by Amman | `05-scents-*` (10) | 4 logos, business card, scent card, standee, 3 sticker sheets. |
| 06 | Posters | `06-poster-*` (5) | Khaadi, Stranger Things, Healthcare's Paradox, Kushi Ya Majboori pair. |
| 07 | Motion Graphics | video only | Short story, Chick-fil-A, Chocolate. |
| 08 | Magazine Layouts | `08-magazine-*` (12) | AutoGear 6 pages, Timeless 6 pages. |
| 09 | CAT Illustrations | `09-cat-*` (10) | **PASSWORD PROTECTED — see section 10.** |
| 10 | Juno + moodboards | `10-juno-*`, `10-moodboard-*` (4) | Character sheet plus 3 moodboard sheets. |
| 11 | E-Wallet App | `11-ewallet-*` (3) | Three composed screen sheets. |

**Mockups are not part of the website.** They are for Behance only. Do not build any mockup sections.

---

## 8a. THE THESIS — FULL PARTS LIST

This project has more components than the others and they need laying out deliberately.

**Images** — `01-thesis-01-logo`, `01-thesis-02-diary-cover`, `01-thesis-char-01` to `07`, `01-thesis-scene-01` to `12`.

**The three tree projections** — `01-thesis-projection-01/02/03.mp4`

> **Lay these out as three squares side by side, playing at the same time.** Not stacked, not a carousel.
>
> The installation projects them simultaneously onto three boxes. The camera position is identical in all three and only the ground changes — Box 1 a barren plain where he plants the seed, Box 2 a sapling with a cloth tied to it, Box 3 a mature tree whose shade he stops at the edge of and never enters. Seeing them together *is* the argument. Showing them one after another destroys it.
>
> Silent, muted, autoplay, looping.

**The AI agent** — `01-thesis-ai-agent-demo.mp4`

A screen recording of the live agent running. **Do not attempt to host the agent itself.** It holds API keys client-side and publishing it would expose them. Present the video with a short description of what the agent does — trained on the research, speaks in his cloned voice, plays his parents' real recordings rather than impersonating them. Play button, never autoplay.

**The background audio** — `01-thesis-audio.mp3`

His parents' real voices over music. Permission granted for public use. **Play button only, never autoplay.** Label clearly that these are the actual recordings.

---

## 9. COPY

**All text lives in `PORTFOLIO_COPY.md`. Use it verbatim. Do not rewrite, summarise or improve it.**

Each project has:
- a **CARD** — the short text, shown on the amber LCD at stage 2
- a **PAGE** — the long text, shown in the full view at stage 4

The file also contains the About text, the timeline, and voice rules.

Copy must be **real HTML text**, not baked into images — selectable, searchable, readable on a phone.

---

## 10. SPECIAL HANDLING

**CAT Illustrations — password gated.** The full view sits behind a password prompt. Show only three or four watermarked details at low resolution, with a line saying the full set is available on request.

> Reason to state plainly in the build: the Children's Apperception Test depends on children not having seen the cards before. Publishing the complete set would compromise the research it was made for. A client-side password is not real security — it is a deterrent, and that is all it is meant to be. Do not claim otherwise in the UI.

**Kushi Ya Majboori — content note.** Display this above the images, before they are visible:
> This work depicts domestic violence.

**Thesis audio.** Permission has been granted. Clearly labelled as the real recordings. **Never autoplay.** A play button the visitor presses.

**The King's Hand case descriptions** must attribute every claim — *investigations alleged*, *a court found*, *police were accused of*. Never assert guilt a court did not find.

**Credit lines that must appear:**
- Khaadi, Stranger Things, Healthcare's Paradox, Kushi Ya Majboori, The King's Hand, the logo animations — *self-initiated*
- The King's Hand — *proposed for Justice Project Pakistan*
- Kushi Ya Majboori — *proposed for Bedari*
- Stranger Things — *unofficial, not commissioned*
- DLEA — *freelance commission, Dubizzle Labs*
- CAT — *freelance commission*

---

## 11. VIDEO AND AUDIO

Self-hosted from the repository. **No YouTube, no Vimeo.**

- `preload="none"` with a poster frame — nothing downloads until the visitor presses play
- Silent ambient loops may autoplay muted; anything with sound must not
- GitHub Pages allows 100 MB per file and 1 GB per site; the compressed set is around 25 MB total, so this is comfortable

**All fourteen files live in `assets/video/`. This list is complete — nothing is outstanding.**

| File | Project | Behaviour |
|---|---|---|
| `01-thesis-projection-01.webm` | Thesis | **Three squares side by side, playing simultaneously.** Silent, autoplay muted, loop. |
| `01-thesis-projection-02.webm` | Thesis | ↑ |
| `01-thesis-projection-03.webm` | Thesis | ↑ |
| `01-thesis-ai-agent-demo.mp4` | Thesis | Screen recording of the live agent. Play button. |
| `01-thesis-audio.mp3` | Thesis | Parents' real voices over music. **Play button only, never autoplay.** Label as the real recordings. |
| `dlea-intro-1.webm` | DLEA | Stage one — the opening sting. Has audio, play button. |
| `dlea-draft-1.webm` | DLEA | Stage two — the tighter gold and silver reveal. |
| `dlea-draft-2.webm` | DLEA | Stage three — the nineteen-second ambient hold, no reveal. |
| `visual-1.webm` … `visual-4.webm` | DLEA | Ambient ceremony screens. Silent, autoplay muted, loop. |
| `animation-final.mp4` | Motion | The hand-drawn short story. Has music. |
| `logo-animation-1.mp4` | Motion | Chick-fil-A. Rooster crow on the last beat. |
| `logo-animation-2.mp4` | Motion | Chocolate. Crunch on the bite. |

The three DLEA stages must be presented **in order, as a progression** — announcement, tighter announcement, then ambient hold. That sequence is the argument of the entry.

---

## 12. HARD REQUIREMENTS

- Must survive a **30-second skim**. An art director should grasp the range and quality immediately.
- The container must never compete with the work.
- Desktop-first, but it must work properly on a phone. Most people will open this on a phone.
- Fast. No heavy animation libraries. CSS and vanilla JS.
- The console is **340px wide** in the reference build. Verify it on a 13-inch laptop before calling it done.

---

## 13. DO NOT

- Do not hide the project list behind a thumbnail or a power-on gesture.
- Do not put Urdu in the interface.
- Do not autoplay audio.
- Do not build mockup sections.
- Do not rewrite the copy.
- Do not add a cover that says the word PORTFOLIO.
- Do not use a clean corporate sans as the display face.
- Do not claim the password gate is secure.

---

## 14. STILL OUTSTANDING

**Assets are complete.** All 74 images, 13 videos and 1 audio file are named, compressed and in place. Nothing is missing. You can build now.

Two things still needed before the site goes live, neither of which blocks building:

- [ ] **Contact details** — email, Instagram, Behance, LinkedIn, whether a CV PDF is wanted. Build the contact channel with clearly marked placeholders.
- [ ] **Domain and hosting** — GitHub Pages assumed.

**Settled, no action needed:**
- AI agent — not hosted, screen recording used instead
- Thesis audio — permission granted, file in place
- CAT — researcher's permission granted, staying password-gated
- King's Hand legal check — reviewed and closed by Inam
- All video compressed, renamed and consolidated into `assets/video/`
