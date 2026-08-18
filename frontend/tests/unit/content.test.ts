/**
 * CONTENT INTEGRITY.
 *
 * These are the tests that catch a broken portfolio before a visitor does.
 * Every one of them encodes a rule from BUILD_SPEC that a careless edit to the
 * content file could silently break — a missing alt attribute, an artwork
 * pointing at a file that is not there, an autoplaying video with sound.
 */

import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS } from '@/content/projects';
import { ABOUT, CONTACT, CHANNELS } from '@/content/channels';
import type { Block, Plate } from '@/content/types';

const PUBLIC = join(process.cwd(), 'public');

/** Every media reference in a block list, flattened. */
function mediaIn(page: Block[]): Plate[] {
  const found: Plate[] = [];
  for (const block of page) {
    if (block.t === 'img') found.push({ src: block.src, alt: block.alt });
    if (block.t === 'grid' || block.t === 'triptych') found.push(...block.items);
    if (block.t === 'video') found.push({ src: block.src, alt: block.label ?? '' });
    if (block.t === 'audio') found.push({ src: block.src, alt: block.label });
  }
  return found;
}

describe('the eleven projects', () => {
  it('is exactly eleven, in order', () => {
    expect(PROJECTS).toHaveLength(11);
    expect(PROJECTS.map((p) => p.id)).toEqual([
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
    ]);
  });

  it('has a unique slug per project', () => {
    const slugs = PROJECTS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every project a title, subtitle, year and card', () => {
    for (const project of PROJECTS) {
      expect(project.title.length, project.slug).toBeGreaterThan(0);
      expect(project.subtitle.length, project.slug).toBeGreaterThan(0);
      expect(project.year.length, project.slug).toBeGreaterThan(0);
      expect(project.card.length, project.slug).toBeGreaterThan(20);
      expect(project.page.length, project.slug).toBeGreaterThan(0);
    }
  });
});

describe('artwork', () => {
  /**
   * The single highest-value test here. A renamed or missing file produces a
   * broken image on a portfolio, which is worse than almost any bug — and it
   * is completely invisible to a type checker.
   */
  it('points every reference at a file that exists', () => {
    const missing: string[] = [];

    for (const item of [...PROJECTS, ABOUT, CONTACT]) {
      for (const media of mediaIn(item.page)) {
        if (!existsSync(join(PUBLIC, media.src))) missing.push(`${item.slug}: ${media.src}`);
      }
      if ('gate' in item && item.gate) {
        for (const plate of [...item.gate.preview, ...item.gate.full]) {
          if (!existsSync(join(PUBLIC, plate.src))) missing.push(`${item.slug}: ${plate.src}`);
        }
      }
      if (item.sprite && !existsSync(join(PUBLIC, item.sprite))) {
        missing.push(`${item.slug}: ${item.sprite}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it('gives every image a real alt text', () => {
    for (const item of [...PROJECTS, ABOUT, CONTACT]) {
      for (const block of item.page) {
        if (block.t === 'img') {
          expect(block.alt.length, `${item.slug}: ${block.src}`).toBeGreaterThan(5);
        }
        if (block.t === 'grid' || block.t === 'triptych') {
          for (const plate of block.items) {
            expect(plate.alt.length, `${item.slug}: ${plate.src}`).toBeGreaterThan(5);
          }
        }
      }
    }
  });
});

describe('rules from BUILD_SPEC', () => {
  it('keeps the three tree projections as one triptych, never a sequence', () => {
    const thesis = PROJECTS[0]!;
    const triptychs = thesis.page.filter((b) => b.t === 'triptych');
    expect(triptychs).toHaveLength(1);
    expect(triptychs[0]).toMatchObject({ t: 'triptych' });
    if (triptychs[0]?.t === 'triptych') {
      // Seeing them together is the argument. Three, always.
      expect(triptychs[0].items).toHaveLength(3);
    }
  });

  it('never autoplays anything that has sound', () => {
    for (const project of PROJECTS) {
      for (const block of project.page) {
        if (block.t === 'video') {
          // Every `video` block renders with controls and preload="none".
          // 'ambient' would autoplay, and no block with sound may use it.
          expect(block.mode, `${project.slug}: ${block.src}`).toBe('button');
        }
      }
    }
  });

  it('gates the Khushi Ya Majboori images behind a content note', () => {
    const posters = PROJECTS.find((p) => p.slug === 'posters')!;
    const note = posters.page.find((b) => b.t === 'note' && b.gates);
    const gatedGrid = posters.page.find((b) => b.t === 'grid' && b.gated);

    expect(note).toBeDefined();
    expect(gatedGrid).toBeDefined();
    if (note?.t === 'note') expect(note.x).toContain('domestic violence');

    // The note must come BEFORE the images it covers, or it is not a warning.
    expect(posters.page.indexOf(note!)).toBeLessThan(posters.page.indexOf(gatedGrid!));
  });

  it('keeps the CAT set gated, showing only watermarked details', () => {
    const cat = PROJECTS.find((p) => p.slug === 'cat-illustrations')!;
    expect(cat.gate).toBeDefined();
    expect(cat.gate!.preview).toHaveLength(3);
    expect(cat.gate!.full).toHaveLength(10);
    expect(cat.page.some((b) => b.t === 'gate')).toBe(true);
  });

  it('does not ship the CAT password in the bundle', async () => {
    // The check moved to the server. Nothing in the content may carry it.
    const serialised = JSON.stringify(PROJECTS);
    expect(serialised).not.toContain('apperception');
  });

  it('gives every full-view project its own ground, with LIMINAL remaining near-white', () => {
    const withGround = PROJECTS.filter((p) => p.ground);
    expect(withGround).toHaveLength(PROJECTS.length);
    expect(PROJECTS.find((project) => project.slug === 'liminal')!.ground).toBe('#F7F7F6');
  });

  it('keeps the two future animation positions named but asset-free', () => {
    const slots = PROJECTS.flatMap((project) => project.page.filter((block) => block.t === 'mediaSlot'));
    expect(slots).toHaveLength(2);
    expect(slots.every((slot) => slot.t === 'mediaSlot' && !slot.src)).toBe(true);
  });

  it('carries the credit lines the spec requires', () => {
    const creditFor = (slug: string) =>
      PROJECTS.find((p) => p.slug === slug)!
        .page.filter((b) => b.t === 'credit')
        .map((b) => (b.t === 'credit' ? b.x : ''))
        .join(' ');

    expect(creditFor('dlea-awards')).toMatch(/Dubizzle Labs/);
    expect(creditFor('the-kings-hand')).toMatch(/Justice Project Pakistan/);
    expect(creditFor('posters')).toMatch(/Bedari/);
    expect(creditFor('posters')).toMatch(/Not commissioned by Khaadi/i);
    expect(creditFor('posters')).toMatch(/Unofficial/);
    expect(creditFor('cat-illustrations')).toMatch(/Freelance commission/);
  });

  it('puts no Urdu in interface copy — only inside artwork descriptions', () => {
    const URDU = /[؀-ۿ]/;

    for (const project of PROJECTS) {
      // Titles, subtitles and card text are interface. They must be Latin.
      expect(URDU.test(project.title), project.slug).toBe(false);
      expect(URDU.test(project.subtitle), project.slug).toBe(false);
      expect(URDU.test(project.card), project.slug).toBe(false);
    }
    for (const channel of CHANNELS) {
      expect(URDU.test(channel.label)).toBe(false);
    }
  });

  it('marks every Urdu run in the prose with lang and dir', () => {
    const URDU = /[؀-ۿ]/;

    for (const project of PROJECTS) {
      for (const block of project.page) {
        if (!('x' in block) || typeof block.x !== 'string') continue;
        if (!URDU.test(block.x)) continue;
        // Screen readers switch voice on lang; the direction is what makes it
        // render correctly at all.
        expect(block.x, `${project.slug}`).toContain('lang="ur"');
        expect(block.x, `${project.slug}`).toContain('dir="rtl"');
      }
    }
  });
});

describe('channels', () => {
  it('keeps About and Contact out of the work list', () => {
    expect(CHANNELS.map((c) => c.id)).toEqual(['work', 'about', 'contact']);
    expect(CHANNELS[0]!.items).toHaveLength(11);
    expect(PROJECTS.some((p) => p.title === 'ABOUT')).toBe(false);
    expect(PROJECTS.some((p) => p.title === 'CONTACT')).toBe(false);
  });

  it('leaves every contact detail as a visible placeholder until it is filled', () => {
    // Deliberate. The UI renders these loudly, which is what stops an
    // unfinished contact channel shipping unnoticed.
    for (const link of CONTACT.links) {
      if (link.value === null) expect(link.href).toBeNull();
      if (link.href !== null) expect(link.value).not.toBeNull();
    }
  });
});
