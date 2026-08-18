import type { MetadataRoute } from 'next';
import { PROJECTS } from '@/content/projects';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : 'https://inamsheraz.vercel.app'));

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'monthly', priority: 1 },
    {
      url: `${SITE_URL}/everything`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...PROJECTS.map((project) => ({
      url: `${SITE_URL}/work/${project.slug}`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.8,
    })),
  ];
}
