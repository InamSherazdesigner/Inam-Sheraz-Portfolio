/**
 * ONE PROJECT, ON ITS OWN URL.
 *
 * ADDED IN THIS BUILD. The original had no route to a single project — the
 * only ways in were the console and the one-page scroll, so there was nothing
 * to send someone. A portfolio whose work cannot be linked to is missing the
 * thing portfolios are for: an art director pastes a URL into a message and
 * the person on the other end lands on that project.
 *
 * It is purely additive. The console is untouched, and this renders through
 * exactly the same block components, so nothing here can drift from what the
 * console shows.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Doc } from '@/components/blocks/Doc';
import { PROJECTS, projectBySlug } from '@/content/projects';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Every project is known at build time, so all eleven are prerendered. */
export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

/** Nothing outside these eleven exists. Anything else is a 404, not a render. */
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) return {};

  // The card copy is the short description, written to be read cold. It is
  // exactly what a link preview needs.
  const description = project.card.replace(/\*/g, '');

  return {
    title: project.title,
    description,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      type: 'article',
      title: `${project.title} — Inam Sheraz`,
      description,
      url: `/work/${project.slug}`,
    },
  };
}

export default async function ProjectPage({ params }: PageProps) {
  const { slug } = await params;
  const project = projectBySlug(slug);
  if (!project) notFound();

  return (
    <div
      className={`solo solo--${project.slug}`}
      style={
        project.ground ? ({ ['--ground' as string]: project.ground } as React.CSSProperties) : undefined
      }
    >
      <header className="stage__bar">
        <span className="stage__lamp" />
        <span className="stage__id">{project.id}</span>
        <span className="stage__now">{project.title}</span>
        <Link className="stage__back" href="/">
          ← THE CONSOLE
        </Link>
      </header>

      <article className="stage__doc">
        <p className="stage__eyebrow">{project.subtitle}</p>
        <h1 className="stage__title">{project.title}</h1>
        <Doc item={project} priority />
      </article>
    </div>
  );
}
