/**
 * ROOT LAYOUT.
 *
 * The fonts are self-hosted through next/font rather than fetched from
 * fonts.googleapis.com as the original build did. Three reasons, all of them
 * user-facing: it removes a render-blocking request to a third-party origin,
 * it removes the layout shift that arrives with a late webfont, and it stops
 * every visitor's IP being handed to Google to read a portfolio. The
 * typefaces are identical — DM Mono for interface, Fraunces for headings, as
 * BUILD_SPEC §3 specifies.
 */

import type { Metadata, Viewport } from 'next';
import { DM_Mono, Fraunces } from 'next/font/google';

import '@/styles/tokens.css';
import '@/styles/console.css';
import '@/styles/lcd.css';
import '@/styles/stage.css';
import '@/styles/everything.css';
import '@/styles/voice.css';
import '@/styles/app.css';

import { OfflineNotice } from '@/components/system/OfflineNotice';

const mono = DM_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-mono',
  // swap: the interface must be readable immediately. A blocking web font on
  // a device UI is the worst of both — an invisible screen, then a jump.
  display: 'swap',
});

const serif = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-serif',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Inam Sheraz — Graphic Designer & Illustrator',
    template: '%s — Inam Sheraz',
  },
  description:
    'Portfolio of Inam Sheraz, graphic designer and illustrator based in Lahore. Thesis work, brand identity, motion graphics, illustration and editorial design.',
  keywords: [
    'graphic design',
    'illustration',
    'motion graphics',
    'brand identity',
    'editorial design',
    'Lahore',
    'Pakistan',
    'Inam Sheraz',
  ],
  authors: [{ name: 'Inam Sheraz' }],
  creator: 'Inam Sheraz',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: 'Inam Sheraz',
    title: 'Inam Sheraz — Graphic Designer & Illustrator',
    description:
      'Eleven projects, framed by a handheld console you operate. Thesis work, brand identity, motion graphics, illustration and editorial design.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Inam Sheraz — Graphic Designer & Illustrator',
    description: 'Eleven projects, framed by a handheld console you operate.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The room around the console. Matches --room so the phone's chrome does not
  // sit in a different colour to the page.
  themeColor: '#0B0B0C',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${mono.variable} ${serif.variable}`}>
      <body>
        {/* First in the tab order. The console is an application widget, so a
            keyboard visitor needs a documented way straight past it. */}
        <a className="skip" href="/everything">
          Skip the console — view everything as one page
        </a>
        {children}
        <OfflineNotice />
      </body>
    </html>
  );
}
