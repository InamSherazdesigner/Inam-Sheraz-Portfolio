/**
 * NEXT CONFIG.
 *
 * Two things matter here: the security headers, and the fact that the images
 * are pre-optimised .webp files that the Image component must not re-encode.
 */

/** The public API origin the browser will call. Needed in the CSP connect-src. */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL
  ? new URL(process.env.NEXT_PUBLIC_API_URL).origin
  : 'http://localhost:4000';

/**
 * Content Security Policy.
 *
 * `connect-src` is the line that matters most here: the browser must reach our
 * own API (to ask for a voice session) and then ElevenLabs directly over
 * wss:// (to carry the audio). Both hosts are named explicitly, so even if
 * something on this page were compromised it could not exfiltrate anywhere
 * else — including to whoever compromised it.
 *
 * ---------------------------------------------------------------------------
 * WHY `'unsafe-inline'` IS ON script-src, stated plainly rather than buried.
 *
 * Next's App Router hydrates through inline <script> tags carrying the RSC
 * payload. Under `script-src 'self'` the browser blocks them, React throws
 * error #412, and the console never boots — an E2E test caught exactly that
 * during this build, which is why it is written down here.
 *
 * The two ways out:
 *
 *   1. A per-request nonce from middleware. Strictly better CSP, but reading
 *      the nonce in the layout forces every route to render dynamically. All
 *      17 routes here are currently static HTML that a CDN serves without ever
 *      waking a server. That is most of the performance and cost story of this
 *      site, and trading it away is a real loss.
 *
 *   2. Allow inline scripts, and remove the thing `'unsafe-inline'` protects
 *      against instead.
 *
 * Option 2 is what this build does, and it is defensible here specifically
 * because the injection surface is empty: every string rendered into the page
 * is a compile-time constant from src/content, there is no CMS, no query
 * parameter and no API response that reaches the DOM, and the one component
 * that sets HTML directly (RichText) documents that constraint as its
 * precondition. `object-src`, `base-uri`, `form-action` and `frame-ancestors`
 * stay locked so the usual escalation paths are closed regardless.
 *
 * REVISIT THIS if the site ever renders content it did not compile: a CMS, a
 * comment, a search parameter, a third-party embed. At that point the nonce
 * approach becomes worth its cost and this comment becomes wrong.
 * See docs/adr/0006-csp-tradeoff.md.
 * ---------------------------------------------------------------------------
 */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "font-src 'self' data:",
  // Next injects critical CSS inline; there is no nonce-free alternative.
  "style-src 'self' 'unsafe-inline'",
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline'",
  `connect-src 'self' ${apiOrigin} https://api.elevenlabs.io wss://api.elevenlabs.io`,
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=15552000; includeSubDomains' },
  // The site needs a microphone for the voice agent and nothing else. Every
  // other capability is switched off at the browser level.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(), payment=(), usb=(), interest-cohort=(), microphone=(self)',
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // Emits .next/standalone only when building for Docker container.
  // Harmless for `next start` and native Vercel deployments.
  ...(process.env.DOCKER_BUILD ? { output: 'standalone' } : {}),

  images: {
    // The artwork was already compressed to .webp by hand before this build
    // existed. Re-encoding it would cost CPU and lose quality for nothing.
    formats: ['image/webp'],
    deviceSizes: [360, 640, 828, 1080, 1280, 1920, 2560],
    imageSizes: [96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  experimental: {
    optimizePackageImports: ['@elevenlabs/client'],
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Artwork and video are content-addressed by filename and never
        // change under the same name, so they can be cached hard.
        source: '/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/sprites/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

export default nextConfig;
