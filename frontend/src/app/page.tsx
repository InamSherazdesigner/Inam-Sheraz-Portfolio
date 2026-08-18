/**
 * THE CONSOLE ROUTE.
 *
 * A server component that renders one client component. Everything the
 * console does is stateful and input-driven, so it has to run in the browser —
 * but the JSON-LD below and the page's metadata are emitted on the server,
 * where a crawler will see them.
 */

import type { Metadata } from 'next';
import { IntroConsole } from '@/components/console/IntroConsole';
import { PROJECTS } from '@/content/projects';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

/**
 * Structured data. The console is a JavaScript application, so a search engine
 * reading the raw HTML would see a shell. This tells it what is actually here:
 * a person, and the eleven pieces of work they made.
 */
function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Inam Sheraz',
    jobTitle: 'Graphic Designer and Illustrator',
    address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressCountry: 'PK' },
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Institute for Art & Culture, Lahore',
    },
    knowsAbout: [
      'Graphic design',
      'Illustration',
      'Motion graphics',
      'Brand identity',
      'Editorial design',
    ],
    workExample: PROJECTS.map((project) => ({
      '@type': 'CreativeWork',
      name: project.title,
      url: `/work/${project.slug}`,
      dateCreated: project.year,
      abstract: project.card.replace(/\*/g, ''),
    })),
  };

  return (
    <script
      type="application/ld+json"
      // Static, built from repository content. No user input reaches it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function HomePage() {
  return (
    <main style={{ backgroundColor: '#0d0d0d', minHeight: '100vh' }}>
      <StructuredData />
      <IntroConsole />
    </main>
  );
}
