/* ==========================================================================
   DATA — every word on this site.

   All prose is transcribed VERBATIM from PORTFOLIO_COPY.md.
   Do not rewrite, summarise or improve it. BUILD_SPEC.md §9, §13.

   Block types used in `page`:
     p       paragraph
     h3      sub-heading
     lead    a standalone line that lands (rendered larger, still ink)
     note    an editorial / permission / content note shown as a marked callout
     credit  attribution line
     rule    divider between sub-works
     img     one artwork on a mat
     grid    several artworks on mats
     video   one video   (mode: 'button' = has sound, never autoplays
                          mode: 'ambient' = silent, muted, autoplay, loop)
     triptych  the three tree projections, side by side, playing together
     audio   an audio piece, play button only
   ========================================================================== */

const A = '../assets/';          /* shipping artwork  */
const V = '../assets/video/';    /* video and audio   */
const S = '../sprites/';         /* 1-bit LCD sprites */

/* Projects 02 and 03 have no sprite drawn yet. They fall back to this so the
   build is complete today; drop a real file in and swap the path. */
const SPRITE_TBD = null;

export const PROJECTS = [

  /* ---------------------------------------------------------------- 01 --- */
  {
    id: '01',
    slug: 'moodiyan-ton-agge',
    title: 'MOODIYAN TON AGGE',
    subtitle: 'Thesis · 2026',
    sprite: S + '01-thesis-moodiyan-ton-agge-SIMPLE.png',
    card: 'Punjabi for *beyond the shoulders*. About who in a family actually pays for everyone else’s better life. I recorded my parents separately and they reached for the same image without knowing it.',
    page: [
      { t: 'p', x: 'Every generation makes sacrifices. But not everyone in that generation carries it. Usually there’s one specific person who gives up their whole life so the next lot can have a better one.' },
      { t: 'p', x: 'That’s what this is about.' },
      { t: 'img', src: A + '01-thesis-01-logo.webp', alt: 'Moodiyan Ton Agge logo, set in Urdu lettering.' },
      { t: 'p', x: 'The title is Punjabi for <em>beyond the shoulders</em>, and it isn’t mine — it’s from my father’s own recording. A mother lifts a child into her lap so the child sees as far as she does. A father puts the child on his shoulders so the child sees further than he ever will.' },
      { t: 'p', x: 'In 2007 he left Pakistan on a ten-day visa. He was aiming for England and got to Germany. My mother stayed and raised three sons on her own. I was five.' },
      { t: 'p', x: 'Now, you might be thinking every parent does that. They do. Yours probably did too, and I’m not claiming mine are special. I used my own family because it’s the version I can tell honestly. It’s a doorway, not a destination.' },

      { t: 'h3', x: 'Here’s the part I didn’t plan' },
      { t: 'p', x: 'I recorded both of my parents separately. Neither of them heard what the other said.' },
      { t: 'p', x: 'He described planting: every parent puts a seed in the ground and doesn’t water it — they water it with their own blood.' },
      { t: 'p', x: 'She described harvest: the next generation only sees the crop already standing there. What they don’t see is the blood and tears that went into the ground it grew out of.' },
      { t: 'lead', x: 'Blood as water. From both of them. Unprompted, and neither knew the other had said it. His looking forward, hers looking back.' },
      { t: 'p', x: 'I didn’t find that. It found me. Everything else in this thesis is built outward from it.' },

      { t: 'h3', x: 'Lahoo Naal Sinjeya Boota — the three projections' },
      { t: 'p', x: 'The installation projects these onto three boxes at the same time. The camera position is identical in all three and only the ground changes. Seeing them together is the argument.' },
      { t: 'triptych', items: [
        { src: V + '01-thesis-projection-01.webm', alt: 'Projection one — a barren plain where he plants the seed.' },
        { src: V + '01-thesis-projection-02.webm', alt: 'Projection two — a sapling with a cloth tied to it.' },
        { src: V + '01-thesis-projection-03.webm', alt: 'Projection three — a mature tree whose shade he stops at the edge of.' }
      ]},

      { t: 'h3', x: 'What’s in it' },
      { t: 'p', x: 'Nine recordings — seven with my father, two with my mother. Transcribed exactly as spoken. Nothing smoothed, nothing corrected, contradictions left where they were.' },
      { t: 'img', src: A + '01-thesis-02-diary-cover.webp', alt: 'Cover of the forty-page illustrated diary.' },
      { t: 'p', x: 'Out of that: a forty-page illustrated diary. Three tree projections called <em>Lahoo Naal Sinjeya Boota</em>, the seed watered with blood. An AI agent trained on the research that talks in my cloned voice and plays my parents’ real recordings instead of pretending to be them. A background audio piece built from those same recordings, so their actual voices are in the room with you. And a wall of 182 family photographs.' },

      { t: 'grid', label: 'Characters', items: [
        { src: A + '01-thesis-char-01.webp', alt: 'Thesis character study one.' },
        { src: A + '01-thesis-char-02.webp', alt: 'Thesis character study two.' },
        { src: A + '01-thesis-char-03.webp', alt: 'Thesis character study three.' },
        { src: A + '01-thesis-char-04.webp', alt: 'Thesis character study four.' },
        { src: A + '01-thesis-char-05.webp', alt: 'Thesis character study five.' },
        { src: A + '01-thesis-char-06.webp', alt: 'Thesis character study six.' },
        { src: A + '01-thesis-char-07.webp', alt: 'Thesis character study seven.' }
      ]},
      { t: 'grid', label: 'Scenes from the diary', items: Array.from({ length: 12 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { src: A + '01-thesis-scene-' + n + '.webp', alt: 'Diary scene ' + n + '.' };
      })},

      { t: 'h3', x: 'The agent' },
      { t: 'p', x: 'Trained on the research. It speaks in my cloned voice, and when it is asked about my parents it plays their real recordings rather than impersonating them.' },
      { t: 'video', src: V + '01-thesis-ai-agent-demo.mp4', mode: 'button',
        label: 'Screen recording of the live agent',
        note: 'The agent itself is not hosted here. It holds API keys client-side, so publishing it would expose them.' },

      { t: 'h3', x: 'Their voices' },
      { t: 'audio', src: V + '01-thesis-audio.mp3',
        label: 'These are the actual recordings of my parents, over music. Permission granted.' },

      { t: 'p', x: 'I didn’t make this for grades. I’ve never worked for grades, and I didn’t get the ones this deserved.' },
      { t: 'lead', x: 'My parents cried when they saw it. That was the point.' }
    ]
  },

  /* ---------------------------------------------------------------- 02 --- */
  {
    id: '02',
    slug: 'dlea-awards',
    title: 'DLEA AWARDS 2025',
    subtitle: 'Freelance commission — Dubizzle Labs · 2025',
    sprite: SPRITE_TBD,
    card: 'A technology company throws itself an awards night. I built everything that moved on the screens — the opening, and the four loops that hold the room between segments.',
    page: [
      { t: 'p', x: 'Dubizzle Labs run an awards night every year. Over a hundred promotions, long-service milestones, the whole company in one room. They hired me to build the motion for it.' },
      { t: 'p', x: 'Here’s the bit people get wrong about event motion: it has two completely different jobs, and one piece of work can’t do both.' },

      { t: 'h3', x: 'Announcing' },
      { t: 'p', x: 'Three stages of the identity in motion. An opening sting — orchestral, particles pulling out of red bokeh and converging into the mark. Then a tighter version in gold and silver on pure black, the mark now a leaf carrying the year.' },
      { t: 'p', x: 'Then a nineteen-second hold with no reveal in it at all.' },
      /* The three stages must read in order, as a progression. BUILD_SPEC §11. */
      { t: 'video', src: V + 'dlea-intro-1.webm', mode: 'button', label: 'Stage one — the opening sting' },
      { t: 'video', src: V + 'dlea-draft-1.webm', mode: 'button', label: 'Stage two — the tighter gold and silver reveal' },
      { t: 'video', src: V + 'dlea-draft-2.webm', mode: 'button', label: 'Stage three — the nineteen-second ambient hold, no reveal' },
      { t: 'p', x: 'That third one is the decision I’d defend. It isn’t a shorter cut of the others — it’s doing something else. It sits on screen while people are getting up, walking to the front, sitting back down. It can’t keep announcing something every nine seconds. It has to be there without asking for anything.' },

      { t: 'h3', x: 'Holding' },
      { t: 'p', x: 'Four ambient visuals for the ceremony screens, all built in the event’s red-on-black. Particle fields with real depth in them. Squares rotating outward until they become an optical tunnel. Line waves. Fluid marble drift. Each one scored, each one long enough to hold a room without stealing it.' },
      { t: 'grid', variant: 'video', items: [
        { src: V + 'visual-1.webm', alt: 'Ambient ceremony screen one.' },
        { src: V + 'visual-2.webm', alt: 'Ambient ceremony screen two.' },
        { src: V + 'visual-3.webm', alt: 'Ambient ceremony screen three.' },
        { src: V + 'visual-4.webm', alt: 'Ambient ceremony screen four.' }
      ]},
      { t: 'lead', x: 'Designed for a room, not for a reel.' },
      { t: 'credit', x: 'Freelance commission, Dubizzle Labs.' }
    ]
  },

  /* ---------------------------------------------------------------- 03 --- */
  {
    id: '03',
    slug: 'the-kings-hand',
    title: 'THE KING’S HAND',
    subtitle: 'When power deals crime · Self-initiated · 2025',
    sprite: SPRITE_TBD,
    card: 'A playing card where the King is a police officer and the Jester is the man he’s paying. Four suits, four real cases. Forced to play, framed to fall.',
    page: [
      { t: 'p', x: 'We’re told crime comes from the street.' },
      { t: 'p', x: 'Fine. But what happens when it starts inside the uniform that was sent to stop it?' },
      { t: 'img', src: A + '03-kings-hand-01-poster.webp', alt: 'The King’s Hand poster, built as a playing card with the two mirrored figures.' },
      { t: 'p', x: 'The poster is a playing card. K in one corner, J in the other, the two figures mirrored the way court cards always are. The King is a police officer — masked, decorated, completely at ease. The Jester is the man on the other end of the handshake. Grey, downturned, taking money he never asked for.' },
      { t: 'lead', x: 'Only one of them is enjoying the game.' },
      { t: 'p', x: 'I used a deck because a deck already contains everything this needed. Hierarchy. Strategy. Sacrifice. Pieces that get used and then discarded. Corruption feels like a game to the people playing it. The cost gets paid by whoever’s dealt.' },
      { t: 'p', x: 'The figures stay geometric and abstract on purpose. The second they become portraits, it’s about two men. I wanted it to be about two roles.' },

      { t: 'h3', x: 'The deck' },
      { t: 'img', src: A + '03-kings-hand-02-cards.webp', alt: 'The four suit cards, each carrying a documented case on the back.' },
      { t: 'p', x: 'Four cards, one per suit, each with a documented Pakistani case on the back — <em>The King’s Kill List</em>, <em>The Family That Folded</em>, <em>The Silenced Jokers</em>, <em>Burnt for a Price</em>.' },
      { t: 'p', x: 'That’s where the metaphor stops being decorative. The cards are the argument.' },
      { t: 'note', kind: 'editorial', x: 'Every case description must attribute its claims — “investigations alleged”, “a court found”, “police were accused of”. Verify current legal status before publishing.' },

      { t: 'h3', x: 'The prototype' },
      { t: 'p', x: 'A mobile version. The suits get dealt one at a time, the four cards fan out, and you choose one to open its case.' },
      { t: 'p', x: 'You pick without knowing what’s on the back. Which is the entire experience the work is about.' },

      { t: 'h3', x: 'The animation' },
      { t: 'p', x: 'Watch the diamonds between the two figures. They move — not down from the King, but up from the Jester.' },
      { t: 'p', x: 'The still image shows a payment. The loop shows who’s actually being paid.' },
      { t: 'p', x: 'Flat mid-century vector, no rendering, olive and grey on aged card stock. It reads as something collectible before it reads as something wrong. That delay is deliberate. You should want it on your wall for about three seconds.' },
      { t: 'lead', x: 'Forced to play. Framed to fall.' },
      { t: 'credit', x: 'Self-initiated. Proposed for Justice Project Pakistan.' }
    ]
  },

  /* ---------------------------------------------------------------- 04 --- */
  {
    id: '04',
    slug: 'liminal',
    title: 'LIMINAL',
    subtitle: 'Mini thesis · Late 2025',
    sprite: S + '04-liminal-SIMPLE.png',
    /* Black and white by its own stated design rule. The amber ground would
       break that rule, so this project overrides it. BUILD_SPEC §7. */
    ground: '#F7F7F6',
    card: 'Three states — Settle, Breathe, Pause. Not a picture of stillness. An attempt to slow down the act of looking itself.',
    page: [
      { t: 'p', x: 'Your attention hasn’t rested all day. It’s been pulled, scanned, interrupted, redirected, over and over, and you probably didn’t notice any of it happening.' },
      { t: 'p', x: 'LIMINAL lives in the gap between those demands.' },
      { t: 'img', src: A + '04-liminal-01-logo.webp', alt: 'LIMINAL logo.' },
      { t: 'p', x: 'The idea is that inner silence doesn’t arrive when everything around you gets removed. It starts when things stop asking so much of you.' },
      { t: 'p', x: 'Three states, each with its own metaphor and its own behaviour.' },

      { t: 'img', src: A + '04-liminal-02-poster-01-settle.webp', alt: 'Settle — poster one.' },
      { t: 'p', x: '<strong>Settle</strong> — water. The movement is still there. It just stops asking to be solved.' },
      { t: 'img', src: A + '04-liminal-03-poster-02-breath.webp', alt: 'Breathe — poster two.' },
      { t: 'p', x: '<strong>Breathe</strong> — expansion and contraction. A cycle with no beginning and no end, projected onto the printed poster so the paper turns into something that holds time.' },
      { t: 'img', src: A + '04-liminal-04-poster-03-pause.webp', alt: 'Pause — poster three, a sphere built from thin isolines.' },
      { t: 'p', x: '<strong>Pause</strong> — a sphere built entirely out of thin isolines, three-dimensional through line density alone. There’s nowhere for your eye to land. So it stays.' },

      { t: 'p', x: 'Black and white throughout. Thin line, controlled repetition, negative space treated as an active thing rather than as leftover room. Each phase asks less of you than the one before it.' },
      { t: 'p', x: 'Every decision got tested against one question: does this add another demand for attention, or take one away?' },
      { t: 'lead', x: 'If it added one, it didn’t make it in.' },

      { t: 'h3', x: 'Manual for Inner Silence' },
      { t: 'grid', items: [
        { src: A + '04-liminal-05-manual-01.webp', alt: 'Manual for Inner Silence, spread one.' },
        { src: A + '04-liminal-06-manual-02.webp', alt: 'Manual for Inner Silence, spread two.' }
      ]},
      { t: 'p', x: 'A folded publication that turns the three states into something you hold. Halftone spheres, dot fields, concentric rings — the same system at a smaller scale, with the fold doing the work of the transitions.' },

      { t: 'h3', x: 'Sound' },
      { t: 'p', x: 'An ambient piece running under the whole space.' }
    ]
  },

  /* ---------------------------------------------------------------- 05 --- */
  {
    id: '05',
    slug: 'scents-by-amman',
    title: 'SCENTS BY AMMAN',
    subtitle: 'Brand identity · Late 2025',
    sprite: S + '02-scents-by-amman.png',
    card: 'A Pakistani fragrance house built on memory instead of price. Everyone else asks what perfume you like. This one asks what you remember.',
    page: [
      { t: 'p', x: 'Amman had been selling perfume for a year on word of mouth alone. No brand, no website, just people telling other people. My job was to turn that into something.' },
      { t: 'p', x: 'The market here runs on two looks. Black-and-gold luxury pastiche, or discount impression store. Neither one fitted, because the real difference was never the price.' },
      { t: 'lead', x: 'It’s this: someone tells you about their nani’s dressing table, or rain in Lahore, or the smell of their grandmother’s house — and you make it into something they can wear.' },
      { t: 'grid', label: 'Logo and wordmark', items: [
        { src: A + '05-scents-01-logo-primary.webp', alt: 'Scents by Amman primary logo.' },
        { src: A + '05-scents-02-logo-black.webp', alt: 'Logo, black.' },
        { src: A + '05-scents-03-logo-white.webp', alt: 'Logo, white.' },
        { src: A + '05-scents-04-logo-transparent.webp', alt: 'Logo, transparent.' }
      ]},
      { t: 'p', x: 'So the identity had to feel like a small scent studio, not a shop. Quiet, editorial, something you’d want to hold. Warm ivory and espresso, sage and stone, with muted gold used sparingly and never as decoration. An organic botanical mark built out of leaf and smoke shapes and the space between them, sat next to a wide-tracked serif wordmark. Minimal labels on heavy fluted 50ml glass with a black cap.' },
      { t: 'lead', x: 'The object should look considered. Not dressed up.' },
      { t: 'grid', items: [
        { src: A + '05-scents-05-business-card.webp', alt: 'Business card.' },
        { src: A + '05-scents-06-scent-profile-card.webp', alt: '10ml scent-profile card carrying the notes and the formula.' }
      ]},
      { t: 'p', x: '<strong>Delivered</strong> — logo and wordmark, business card, a 10ml scent-profile card carrying the notes and the formula, and the launch collateral.' },

      { t: 'h3', x: 'Then they took a stall at an anime convention' },
      { t: 'p', x: 'Which needed the exact opposite of everything above. Loud, character-led, built to stop someone from across a hall.' },
      { t: 'img', src: A + '05-scents-07-standee.webp', alt: 'Convention standee.' },
      { t: 'grid', label: 'Sticker series', items: [
        { src: A + '05-scents-08-stickers-01.webp', alt: 'Sticker sheet one.' },
        { src: A + '05-scents-09-stickers-02.webp', alt: 'Sticker sheet two.' },
        { src: A + '05-scents-10-stickers-03.webp', alt: 'Sticker sheet three.' }
      ]},
      { t: 'p', x: 'A sticker series and a standee, drawn in that audience’s language instead of the brand’s.' },
      { t: 'lead', x: 'Same house. Different room.' }
    ]
  },

  /* ---------------------------------------------------------------- 06 --- */
  {
    id: '06',
    slug: 'posters',
    title: 'POSTERS',
    subtitle: '2024–2025',
    sprite: S + '03-posters.png',
    card: 'Four pieces. A hospital drawn as a dream that won’t resolve, a fusion argued through stitching, a fan poster, and a pair about what a marriage promises versus what it delivers.',
    page: [
      { t: 'h3', x: 'Healthcare’s Paradox' },
      { t: 'p', x: 'I wanted to treat a real problem as surrealism. So I wrote the dream first, before drawing anything.' },
      { t: 'p', x: 'In it, a hospital corridor melts like wax off a candle. Equipment floats overhead, twisted out of shape. The staff have clocks for faces and the hands are moving too fast. Patients flicker in and out, half transparent. Somewhere past them a queue winds through a building with no exit, stretching beyond the horizon.' },
      { t: 'img', src: A + '06-poster-03-healthcares-paradox.webp', alt: 'Healthcare’s Paradox poster.' },
      { t: 'p', x: 'The poster holds one frame of that. A clock tower dissolving into the building underneath it. An ambulance falling out of the sky. A car that’s already crashed. A figure half-submerged in the same current carrying everything else along.' },
      { t: 'p', x: 'Teal and orange run through the whole thing as one unbroken ribbon. What’s holding the hospital up is the same thing pulling it under.' },
      { t: 'p', x: 'That’s the paradox, in one shape.' },
      { t: 'lead', x: 'Floating hopes, sinking realities.' },
      { t: 'credit', x: 'Self-initiated.' },

      { t: 'rule' },

      { t: 'h3', x: 'Khaadi' },
      { t: 'p', x: 'The brief was a fusion of modern trends and timeless tradition. I could have written that in the copy and put a nice garment next to it. Instead I made the type do it.' },
      { t: 'img', src: A + '06-poster-01-khaadi.webp', alt: 'Khaadi poster — geometric Urdu letterforms stitched in orange on black crumpled fabric.' },
      { t: 'p', x: 'The letterforms filling the page are Urdu, built geometrically — clean, modern, cropped hard by the edges so you read them as structure before you read them as words. Running along their contours are stitch marks in Khaadi’s orange. The loose running stitch you’d find on woven cloth.' },
      { t: 'p', x: '<em>Khaadi</em> means handwoven fabric. So the letters are sewn, not printed. The brand’s meaning is in how the type is made.' },
      { t: 'p', x: 'Then cutting across the middle, small and completely unhurried, a line of nastaliq — <span lang="ur" dir="rtl">ہر رنگ، ہر روپ میں خوبصورت</span>. That’s the other half. The traditional script sitting inside the modern one, at a totally different scale and speed.' },
      { t: 'p', x: 'The ground is black crumpled fabric, so the whole poster sits on cloth. Orange does everything else.' },
      { t: 'credit', x: 'Self-initiated. Not commissioned by Khaadi.' },

      { t: 'rule' },

      { t: 'h3', x: 'Stranger Things' },
      { t: 'p', x: 'A fan poster, and the hard part isn’t finding imagery. That show’s visual language is so fixed that anyone can list it. The hard part is arranging it so it isn’t just familiar things sitting next to each other.' },
      { t: 'img', src: A + '06-poster-02-stranger-things.webp', alt: 'Stranger Things fan poster, read vertically as a descent.' },
      { t: 'p', x: 'So I made it vertical. It reads top to bottom as a descent — red sky and tendrils, the house with its windows lit, the wall of letters strung with lights, and underneath all of it the forest where the other world begins.' },
      { t: 'p', x: 'Hawkins and the Upside Down share one frame instead of sitting side by side. One continuous space that’s been infected, rather than two scenes stitched together.' },
      { t: 'p', x: 'Red carries it. Everything else is pulled down to near-black so the light sources do the work.' },
      { t: 'credit', x: 'Unofficial. Personal work, not commissioned.' },

      { t: 'rule' },

      { t: 'h3', x: '<span lang="ur" dir="rtl">خوشی یا مجبوری؟</span> — Khushi Ya Majboori' },
      /* Content note must appear ABOVE the images, before they are visible.
         BUILD_SPEC §10. The images below are gated behind it. */
      { t: 'note', kind: 'content', x: 'This work depicts domestic violence.', gates: true },
      { t: 'p', x: 'A bride is told her life is starting. What arrives afterwards is often a different life entirely — unpaid labour, control, and violence inside the house she was promised to.' },
      { t: 'p', x: 'Two posters. Same woman, same crop, same distance from the camera. Nothing changes except her.' },
      { t: 'grid', gated: true, items: [
        { src: A + '06-poster-04-kushi-01.webp', alt: 'Khushi Ya Majboori, first poster — bridal red and gold, warm light.' },
        { src: A + '06-poster-05-kushi-02.webp', alt: 'Khushi Ya Majboori, second poster — cold light, worn clothes, eroded type.' }
      ]},
      { t: 'p', x: 'In the first she’s in bridal red and gold, hands holding the dupatta at her shoulders, warm light, looking straight down the lens. In the second the light has gone cold, the clothes are worn through, there are marks on her face, and her hands have moved from arranging the dupatta to gripping her own head.' },
      { t: 'lead', x: 'Now look at the title.' },
      { t: 'p', x: 'Both posters carry the same words — <em>khushi ya majboori</em>. Happiness or compulsion. In the second one the type is eroded. <em>Khushi</em> has broken apart almost past reading. <em>Majboori</em> is still standing.' },
      { t: 'p', x: 'The question the first poster asks gets answered by its own headline falling apart. No caption needed.' },
      { t: 'p', x: 'The couplet does the same thing. The first ends with <span lang="ur" dir="rtl">عشق سے سجایا تھا خود کو اُس دن</span> — I adorned myself with love that day. In the second, that line survives only as a ghost behind a new one: <span lang="ur" dir="rtl">پر نفرت نے آئینہ بھی موڑ دیا</span> — but hatred turned even the mirror away.' },
      { t: 'lead', x: 'The promise doesn’t get deleted. It stays underneath, faded. Which is closer to how it actually works.' },
      { t: 'credit', x: 'Photographed, styled and retouched as a set. Self-initiated. Proposed for Bedari, who work on gender-based violence and women’s rights in Pakistan.' }
    ]
  },

  /* ---------------------------------------------------------------- 07 --- */
  {
    id: '07',
    slug: 'motion-graphics',
    title: 'MOTION GRAPHICS',
    subtitle: '2024–2025',
    sprite: S + '05-motion-graphics.png',
    card: 'Hand-drawn character animation and kinetic logo work. One idea each, and the punchline is always a sound.',
    page: [
      { t: 'h3', x: 'Short story' },
      { t: 'p', x: 'Hand-drawn, rough charcoal linework, kept deliberately shaky because clean lines would have killed it.' },
      { t: 'video', src: V + 'animation-final.mp4', mode: 'button', label: 'The hand-drawn short story — has music' },
      { t: 'p', x: 'It opens POV — running down a stark white hallway, hand reaching toward the camera in wide-angle distortion. Then it breaks into a multi-panel comic grid: a door knob, a crack of light, a pair of eyes, feet in sandals. Then it opens out completely into a watercolour sky with kites.' },
      { t: 'lead', x: 'Cinematic, then comic, then unbound.' },

      { t: 'rule' },

      { t: 'h3', x: 'Chick-fil-A' },
      { t: 'video', src: V + 'logo-animation-1.mp4', mode: 'button', label: 'Chick-fil-A — rooster crow on the last beat' },
      { t: 'p', x: 'A single white feather crosses a crimson field, leaving a trail behind it. The trail becomes the wordmark. The feather settles into place as the icon.' },
      { t: 'p', x: 'Then a rooster crows.' },
      { t: 'p', x: 'The mark writes itself, using something that already belonged to the brand’s own story.' },

      { t: 'rule' },

      { t: 'h3', x: 'Chocolate' },
      { t: 'video', src: V + 'logo-animation-2.mp4', mode: 'button', label: 'Chocolate — crunch on the bite' },
      { t: 'p', x: 'Black letter fragments tumble in and lock onto a baseline. The two O’s resolve into cocoa beans. The word snaps together — and then the corner of the E gets bitten off, three crumbs fall out of frame, and you hear the crunch.' },
      { t: 'p', x: 'Both of those end on a sound effect instead of a music swell. That’s not an accident. A swell tells you something impressive happened. A crunch makes you smile.' },
      { t: 'credit', x: 'Self-initiated.' }
    ]
  },

  /* ---------------------------------------------------------------- 08 --- */
  {
    id: '08',
    slug: 'magazine-layouts',
    title: 'MAGAZINE LAYOUTS',
    subtitle: 'University work · 2025',
    sprite: S + '06-magazine-layouts.png',
    card: 'Two magazines, same obsession — type at architectural scale, interacting with the photograph instead of politely sitting next to it.',
    page: [
      { t: 'h3', x: 'The Timeless' },
      { t: 'p', x: 'A fashion title about what survives when trends don’t. Forest green, near-black, pale celadon, and black-and-white photography carrying heavy film grain.' },
      { t: 'grid', items: Array.from({ length: 6 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { src: A + '08-magazine-timeless-' + n + '.webp', alt: 'The Timeless, page ' + n + '.' };
      })},
      { t: 'p', x: 'The typography is deliberately mixed — a high-contrast Didone for the masthead and pull-quotes, a heavy grotesque for display, a squared techno face for section heads. Three voices in one magazine, which shouldn’t work and does.' },
      { t: 'p', x: 'The letterforms get used as containers. A giant <strong>C</strong> with the model standing inside its counter. <strong>URE</strong> running behind a figure at full page height. <strong>All.</strong> filling half a spread.' },
      { t: 'lead', x: 'The words hold the images. They don’t caption them.' },

      { t: 'rule' },

      { t: 'h3', x: 'AutoGear' },
      { t: 'p', x: 'An automotive title built on one restraint: near-black grounds, a single red, and photography supplying every other colour in the magazine.' },
      { t: 'grid', items: Array.from({ length: 6 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { src: A + '08-magazine-autogear-' + n + '.webp', alt: 'AutoGear, page ' + n + '.' };
      })},
      { t: 'p', x: 'The cover splits a car straight down its centre line into black and blue halves. Headlines are squared, mechanical, cropped hard by the spine. Statistics sit in small circular badges along the foot of the page like instrument dials.' },
      { t: 'p', x: 'Two spreads pair on purpose — the interior set left-aligned, the exterior silhouette set right-aligned across three columns. The layout mirrors the subject.' }
    ]
  },

  /* ---------------------------------------------------------------- 09 --- */
  {
    id: '09',
    slug: 'cat-illustrations',
    title: 'CAT ILLUSTRATIONS',
    subtitle: 'Freelance commission · 2025',
    sprite: S + '07-cat-illustrations.png',
    /* Password gated. A client-side password is a deterrent, not security,
       and the UI must not claim otherwise. BUILD_SPEC §10. */
    gate: {
      password: 'apperception',
      preview: [
        { src: A + '09-cat-01.webp', alt: 'CAT illustration, detail one.' },
        { src: A + '09-cat-04.webp', alt: 'CAT illustration, detail two.' },
        { src: A + '09-cat-07.webp', alt: 'CAT illustration, detail three.' }
      ],
      full: Array.from({ length: 10 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { src: A + '09-cat-' + n + '.webp', alt: 'CAT illustration ' + n + '.' };
      })
    },
    card: 'Illustrations for a psychology study. The Children’s Apperception Test, redrawn so a Pakistani child recognises the world inside it.',
    page: [
      { t: 'note', kind: 'access', x: 'Password-protected. Details only, watermarked, low resolution. Full set on request.' },
      { t: 'p', x: 'The Children’s Apperception Test works like this. You show a child a picture of animals in some situation, the child tells you a story about it, and a psychologist reads that story for what the child is actually working through.' },
      { t: 'p', x: 'It was made in America in 1949. So the houses are American. The clothes, the rooms, the furniture, all of it.' },
      { t: 'p', x: 'A Master’s researcher in psychology brought me in to redraw the set for a study asking whether those cards still do their job for Pakistani children — or whether a child spends their attention decoding an unfamiliar world instead of responding to the situation in it.' },
      { t: 'p', x: 'And that constraint is the whole brief. The composition, the animals, the emotional situation — all of it had to stay close to the originals, or the comparison would be worthless. Everything else had to change. The rooms. The objects. The light. Every detail a child would actually recognise.' },
      { t: 'lead', x: 'Illustration working for something other than itself. I liked that.' },
      { t: 'gate' },
      { t: 'note', kind: 'access', x: 'Only a few details are shown here. The test depends on children not having seen the cards before, so the full set stays unpublished.' },
      { t: 'credit', x: 'Freelance commission.' }
    ]
  },

  /* ---------------------------------------------------------------- 10 --- */
  {
    id: '10',
    slug: 'juno',
    title: 'JUNO',
    subtitle: 'Character design · University work · 2024',
    sprite: S + '08-character-design-juno-SIMPLE.png',
    card: 'A goddess of beauty. In a cardigan. The only divine thing about her is a halo made of cherries.',
    page: [
      { t: 'p', x: 'Juno, built from scratch.' },
      { t: 'img', src: A + '10-juno-01-character-sheet.webp', alt: 'Juno character sheet with turnarounds and expressions.' },
      { t: 'p', x: 'Very long dark hair, round wire glasses, an open black cardigan over a plain tee, baggy trousers, sneakers. Deliberately ordinary clothes for a deity — she’d disappear in a queue.' },
      { t: 'p', x: 'The divinity is carried by exactly one thing: an arc of leaves and cherries sitting behind her head like a halo, echoed again in a small cherry pendant at her collar.' },
      { t: 'lead', x: 'That’s it. That’s the idea. Nothing about her reads as classical except the halo, and the halo is made of something you could eat.' },
      { t: 'p', x: 'Full character sheet with turnarounds and expressions.' },
      { t: 'grid', label: 'Moodboards', items: [
        { src: A + '10-moodboard-01.webp', alt: 'Juno moodboard one.' },
        { src: A + '10-moodboard-02.webp', alt: 'Juno moodboard two.' },
        { src: A + '10-moodboard-03.webp', alt: 'Juno moodboard three.' }
      ]}
    ]
  },

  /* ---------------------------------------------------------------- 11 --- */
  {
    id: '11',
    slug: 'e-wallet-app',
    title: 'E-WALLET APP',
    subtitle: 'UI / UX · University work · 2024',
    sprite: S + '09-ewallet-app.png',
    card: 'Every card in your wallet, minus the wallet.',
    page: [
      { t: 'p', x: 'An app that carries your physical cards as digital ones and lets you pay straight from them.' },
      { t: 'grid', items: [
        { src: A + '11-ewallet-01.webp', alt: 'E-Wallet screens — onboarding.' },
        { src: A + '11-ewallet-02.webp', alt: 'E-Wallet screens — home and transfer.' },
        { src: A + '11-ewallet-03.webp', alt: 'E-Wallet — the flow map.' }
      ]},
      { t: 'p', x: 'Onboarding, home, transfer, and the flow map connecting them.' }
    ]
  }
];

/* ==========================================================================
   ABOUT — its own channel. Not an item in the work list. BUILD_SPEC §6.
   ========================================================================== */

export const ABOUT = {
  title: 'ABOUT',
  sprite: S + '10-about-waving-SIMPLE.png',
  card: 'Graphic designer and illustrator. Lahore. Five years in, most of them freelance. Motion is where I want to go, and I’m already doing it.',
  page: [
    { t: 'p', x: 'Alright. Let’s do this properly.' },
    { t: 'p', x: 'My name is Inam Sheraz. I nearly ended up doing something else entirely, then took three months at Hazim Solutions in 2021 as an intern — my first real design work, before university had even started — and that was that. Five years later I’m still here, and I’ve been freelancing most of them. You can probably guess the rest.' },
    { t: 'p', x: 'Except you can’t, because it’s a fairly strange list. An annual awards night for a technology company. A perfume brand’s launch. Illustrations for a psychology study. A project built to slow down the act of looking. And a thesis about my own parents.' },
    { t: 'p', x: 'Here’s the thing about me: I learn fast. Give me a tool I’ve never opened and I’ll be doing real work in it within a week — that’s how I got most of what I know. Illustrator, Photoshop, InDesign, After Effects, Premiere Pro, Figma, and whatever comes next.' },
    { t: 'p', x: 'Motion is where I want to go, and I’m already doing it. I built the full motion package for the DLEA Awards at Dubizzle Labs — the opening sting, the ambient screens, all of it, delivered for a real night with a real audience.' },
    { t: 'p', x: 'Every idea here is mine. I use AI constantly and I’m good at it, but never for thinking — only for speed, once I already know what I’m making.' },
    { t: 'p', x: 'Give me a project I can build out of my own head and I’ll lose an entire day to it without noticing. That part hasn’t changed since I was seventeen.' },
    { t: 'lead', x: 'Available for studio and agency work.' },
    { t: 'timeline', items: [
      { y: '2021',      x: 'Graphic design internship, Hazim Solutions' },
      { y: '2022–2026', x: 'Bachelors in Graphic Design, Institute for Art & Culture, Lahore' },
      { y: '2024',      x: 'Posters · Juno · E-Wallet · Logo animations' },
      { y: '2025',      x: 'CAT Illustrations · Magazines · The King’s Hand · Short story animation · DLEA Awards' },
      { y: 'Late 2025', x: 'Scents by Amman · LIMINAL' },
      { y: '2026',      x: 'Moodiyan Ton Agge' }
    ]}
  ]
};

/* ==========================================================================
   CONTACT — details still outstanding. Placeholders are deliberately visible
   so they cannot ship unnoticed. PORTFOLIO_COPY.md, OUTSTANDING.
   ========================================================================== */

export const CONTACT = {
  title: 'CONTACT',
  sprite: S + '11-contact-call-SIMPLE.png',
  card: 'Available for studio and agency work. Lahore, Pakistan.',
  links: [
    { label: 'EMAIL',     value: null, href: null },
    { label: 'INSTAGRAM', value: null, href: null },
    { label: 'BEHANCE',   value: null, href: null },
    { label: 'LINKEDIN',  value: null, href: null },
    { label: 'CV',        value: null, href: null }
  ],
  page: [
    { t: 'lead', x: 'Available for studio and agency work.' },
    { t: 'p', x: 'Lahore, Pakistan.' }
  ]
};

/* The year column in the LCD list. Kept apart from the prose so the copy file
   stays the single source for anything a reader actually reads. */
const YEARS = {
  '01': '2026', '02': '2025', '03': '2025', '04': '2025', '05': '2025',
  '06': '24–25', '07': '24–25', '08': '2025', '09': '2025', '10': '2024',
  '11': '2024'
};
PROJECTS.forEach(p => { p.year = YEARS[p.id]; });

/* ==========================================================================
   CHANNELS — flicked between with D-pad left / right. BUILD_SPEC §6.
   ========================================================================== */

export const CHANNELS = [
  { id: 'work',    label: 'WORK',    items: PROJECTS },
  { id: 'about',   label: 'ABOUT',   items: [ABOUT] },
  { id: 'contact', label: 'CONTACT', items: [CONTACT] }
];
