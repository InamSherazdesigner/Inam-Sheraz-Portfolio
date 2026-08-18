import type { MetadataRoute } from 'next';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL?.trim() ? `https://${process.env.VERCEL_URL.trim()}` : 'https://inamsheraz.vercel.app'));

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
