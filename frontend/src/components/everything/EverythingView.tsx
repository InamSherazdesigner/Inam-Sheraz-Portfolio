'use client';

import { useEffect } from 'react';
import { Doc } from '@/components/blocks/Doc';
import { InterfaceLink } from '@/components/system/InterfaceLink';
import { SoundToggle } from '@/components/system/SoundToggle';
import { PROJECTS } from '@/content/projects';
import { ABOUT, CONTACT } from '@/content/channels';
import { isProject, type ChannelItem } from '@/content/types';

const ALL: ChannelItem[] = [...PROJECTS, ABOUT, CONTACT];

export function EverythingView() {
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll<HTMLElement>('.every__sec');
      const middle = window.innerHeight / 2;

      sections.forEach((sec) => {
        const plates = [...sec.querySelectorAll<HTMLElement>('[data-artwork-bg]')].filter(
          (p) => p.offsetParent !== null
        );
        const defaultGround = sec.dataset.defaultGround;

        if (plates.length === 0) {
          if (defaultGround) sec.style.setProperty('--ground', defaultGround);
          return;
        }

        let best: HTMLElement | null = null;
        let bestDist = Infinity;

        for (const plate of plates) {
          const rect = plate.getBoundingClientRect();
          const plateCenter = rect.top + rect.height / 2;
          const dist = Math.abs(plateCenter - middle);
          if (dist < bestDist && rect.top < window.innerHeight && rect.bottom > 0) {
            bestDist = dist;
            best = plate;
          }
        }

        const next = best?.dataset.artworkBg ?? defaultGround;
        if (next) sec.style.setProperty('--ground', next);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="every">
      <header className="every__bar">
        <span className="stage__lamp" />
        <span className="every__who">INAM SHERAZ</span>
        <InterfaceLink className="stage__back" href="/">
          ← BACK TO THE CONSOLE
        </InterfaceLink>
        <SoundToggle />
      </header>

      <main id="all">
        {/**
         * A plain index at the top, so the whole list is readable before any
         * scrolling happens. Same principle as the LCD: frame the index,
         * never hide it.
         */}
        <nav className="every__index" aria-label="Projects">
          <p className="every__index-label">ELEVEN PROJECTS</p>
          <ol>
            {PROJECTS.map((project) => (
              <li key={project.slug}>
                <InterfaceLink href={`#${project.slug}`}>
                  <span>{project.id}</span>
                  <span>{project.title}</span>
                  <span>{project.year}</span>
                </InterfaceLink>
              </li>
            ))}
            <li>
              <InterfaceLink href="#about">
                <span>—</span>
                <span>ABOUT</span>
                <span />
              </InterfaceLink>
            </li>
            <li>
              <InterfaceLink href="#contact">
                <span>—</span>
                <span>CONTACT</span>
                <span />
              </InterfaceLink>
            </li>
          </ol>
        </nav>

        {ALL.map((item, index) => (
          <section
            key={item.slug}
            className={`every__sec every__sec--${item.slug}`}
            id={item.slug}
            data-default-ground={isProject(item) ? item.ground : undefined}
            style={
              isProject(item) && item.ground
                ? ({ ['--ground' as string]: item.ground } as React.CSSProperties)
                : undefined
            }
          >
            <div className="stage__doc">
              {item.subtitle ? <p className="stage__eyebrow">{item.subtitle}</p> : null}
              <h2 className="stage__title">
                {isProject(item) ? <span className="every__no">{item.id}</span> : null}
                {item.title}
              </h2>
              <Doc item={item} priority={index === 0} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
