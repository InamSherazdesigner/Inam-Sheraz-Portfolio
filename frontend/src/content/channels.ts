/**
 * ABOUT, CONTACT, and the three channels.
 *
 * About and Contact are channels of their own, not items in the work list.
 * BUILD_SPEC §6.
 */

import type { AboutEntry, Channel, ContactEntry } from './types';
import { PROJECTS } from './projects';

const S = '/sprites/';

export const ABOUT: AboutEntry = {
  slug: 'about',
  title: 'ABOUT',
  sprite: `${S}10-about-waving-SIMPLE.png`,
  card: 'Graphic designer and illustrator. Lahore. Five years in, most of them freelance. Motion is where I want to go, and I’m already doing it.',
  page: [
    { t: 'p', x: 'Alright. Let’s do this properly.' },
    {
      t: 'p',
      x: 'My name is Inam Sheraz. I nearly ended up doing something else entirely, then took three months at Hazim Solutions in 2021 as an intern — my first real design work, before university had even started — and that was that. Five years later I’m still here, and I’ve been freelancing most of them. You can probably guess the rest.',
    },
    {
      t: 'p',
      x: 'Except you can’t, because it’s a fairly strange list. An annual awards night for a technology company. A perfume brand’s launch. Illustrations for a psychology study. A project built to slow down the act of looking. And a thesis about my own parents.',
    },
    {
      t: 'p',
      x: 'Here’s the thing about me: I learn fast. Give me a tool I’ve never opened and I’ll be doing real work in it within a week — that’s how I got most of what I know. Illustrator, Photoshop, InDesign, After Effects, Premiere Pro, Figma, and whatever comes next.',
    },
    {
      t: 'p',
      x: 'Motion is where I want to go, and I’m already doing it. I built the full motion package for the DLEA Awards at Dubizzle Labs — the opening sting, the ambient screens, all of it, delivered for a real night with a real audience.',
    },
    {
      t: 'p',
      x: 'Every idea here is mine. I use AI constantly and I’m good at it, but never for thinking — only for speed, once I already know what I’m making.',
    },
    {
      t: 'p',
      x: 'Give me a project I can build out of my own head and I’ll lose an entire day to it without noticing. That part hasn’t changed since I was seventeen.',
    },
    { t: 'lead', x: 'Available for studio and agency work.' },
    {
      t: 'timeline',
      items: [
        { y: '2021', x: 'Graphic design internship, Hazim Solutions' },
        { y: '2022–2026', x: 'Bachelors in Graphic Design, Institute for Art & Culture, Lahore' },
        { y: '2024', x: 'Posters · Juno · E-Wallet · Logo animations' },
        {
          y: '2025',
          x: 'CAT Illustrations · Magazines · The King’s Hand · Short story animation · DLEA Awards',
        },
        { y: 'Late 2025', x: 'Scents by Amman · LIMINAL' },
        { y: '2026', x: 'Moodiyan Ton Agge' },
      ],
    },
  ],
};

/**
 * CONTACT.
 *
 * Every link is deliberately still a null placeholder, and the UI renders
 * those loudly in the accent colour. That is not an oversight left in by
 * accident — it is the mechanism that stops an unfinished contact channel
 * shipping unnoticed. Fill a value and its href in, and the placeholder
 * disappears on its own.
 */
export const CONTACT: ContactEntry = {
  slug: 'contact',
  title: 'CONTACT',
  sprite: `${S}11-contact-call-SIMPLE.png`,
  card: 'Available for studio and agency work. Lahore, Pakistan.',
  links: [
    { label: 'EMAIL', value: 'inamsherazdesigner@gmail.com', href: 'mailto:inamsherazdesigner@gmail.com' },
    { label: 'INSTAGRAM', value: '@nomnomies.sys ↗', href: 'https://www.instagram.com/nomnomies.sys/' },
    { label: 'BEHANCE', value: 'Coming soon', href: null },
    { label: 'LINKEDIN', value: 'Coming soon', href: null },
    { label: 'CV', value: 'M.Inam Sheraz.pdf (Download ↗)', href: '/M.Inam Sheraz.pdf' },
  ],
  page: [
    { t: 'lead', x: 'Available for studio and agency work.' },
    { t: 'p', x: 'Lahore, Pakistan.' },
  ],
};

/** Flicked between with D-pad left / right. BUILD_SPEC §6. */
export const CHANNELS: Channel[] = [
  { id: 'work', label: 'WORK', items: PROJECTS },
  { id: 'about', label: 'ABOUT', items: [ABOUT] },
  { id: 'contact', label: 'CONTACT', items: [CONTACT] },
];
