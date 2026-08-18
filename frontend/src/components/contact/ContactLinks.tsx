/**
 * CONTACT LINKS.
 *
 * Unfilled details render as loud, accent-coloured placeholders. That is not
 * an unfinished state left in by accident — it is the mechanism that stops an
 * empty contact channel shipping unnoticed. Fill `value` and `href` in
 * src/content/channels.ts and the placeholder disappears on its own.
 */

import type { ContactLink } from '@/content/types';

const isExternal = (href: string) => /^https?:/i.test(href) || /\.pdf$/i.test(href);

export function ContactLinks({ links }: { links: ContactLink[] }) {
  return (
    <ul className="contact">
      {links.map((link) => (
        <li key={link.label}>
          <span>{link.label}</span>
          <span>
            {link.value && link.href ? (
              <a
                href={link.href}
                // noreferrer alongside noopener: without it the destination
                // learns which page sent the visitor, and the tabnabbing
                // protection is only half applied.
                {...(isExternal(link.href)
                  ? { target: '_blank', rel: 'noopener noreferrer' }
                  : {})}
                {...(link.href.endsWith('.pdf') ? { download: 'M.Inam Sheraz.pdf' } : {})}
              >
                {link.value}
              </a>
            ) : link.value ? (
              <span>{link.value}</span>
            ) : (
              <span className="contact__tbd">— still to add —</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
