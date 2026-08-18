/**
 * THE ESCAPE HATCH — every section as one plain scroll.
 *
 * No console, no controls, no ceremony. This is how someone with thirty
 * seconds gets to the work, and it must be reachable without learning any
 * control. BUILD_SPEC §5 — not optional.
 *
 * It renders from the same block components as the console's full view, so
 * the two routes cannot drift out of step.
 */

import type { Metadata } from 'next';
import { EverythingView } from '@/components/everything/EverythingView';

export const metadata: Metadata = {
  title: 'Everything, one page',
  description:
    'The complete work of Inam Sheraz, graphic designer and illustrator in Lahore, as one plain scrolling page.',
  alternates: { canonical: '/everything' },
};

export default function EverythingPage() {
  return <EverythingView />;
}
