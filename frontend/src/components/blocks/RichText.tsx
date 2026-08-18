/**
 * AUTHORED INLINE MARKUP.
 *
 * The prose in src/content carries deliberate inline markup that has to
 * survive to the page: <em>, <strong>, and the Urdu runs written as
 * <span lang="ur" dir="rtl">…</span>. Those spans are not decoration — they
 * set the text direction and tell a screen reader which language it is
 * reading. Escaping them would break both.
 *
 * WHY THIS IS NOT AN XSS HOLE, stated explicitly so nobody has to re-derive it
 * when they touch this file:
 *
 *   - Every string reaching `html` originates in src/content/*.ts, which is
 *     source code in this repository, reviewed like any other source code.
 *   - No user input, no query parameter, no API response and no CMS field is
 *     ever routed through this component. There is no code path that could
 *     put one here.
 *   - Anything that IS variable — alt text, captions, labels, form values,
 *     API error messages — goes through normal JSX interpolation, which React
 *     escapes. See Plate, ContentNote and the voice widget.
 *
 * If a future change introduces content from outside the repository, this
 * component must be replaced with a sanitiser. That is the condition under
 * which the reasoning above stops holding.
 */

import type { JSX } from 'react';

interface RichTextProps {
  html: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  lang?: string;
}

export function RichText({ html, as: Tag = 'p', className }: RichTextProps) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/**
 * The copy file marks emphasis with *asterisks*. The LCD card text is the only
 * place that convention survives, so it is converted here rather than in the
 * content — the content stays as written.
 *
 * Returns escaped HTML: the input is escaped first, then the asterisk pairs
 * are turned into <em>. Order matters. Escaping after the substitution would
 * escape the tags we just added.
 */
export function emphasise(text: string): string {
  const escaped = text.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string
  );
  return escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
