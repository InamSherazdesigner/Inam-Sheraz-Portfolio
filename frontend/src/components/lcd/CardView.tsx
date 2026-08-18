/**
 * STAGE 3 — THE INFO CARD.
 *
 * Still on the amber LCD. Title, the short description, a counter, and the
 * prompt to commit. This is the preview step before opening the real thing.
 * BUILD_SPEC §7.
 */

import { emphasise } from '../blocks/RichText';
import type { ChannelItem } from '@/content/types';

interface CardViewProps {
  item: ChannelItem;
  position: number;
  total: number;
}

export function CardView({ item, position, total }: CardViewProps) {
  return (
    <div className="card">
      <div className="card__head">
        <span>– INFO CARD –</span>
        <span>
          {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <h2 className="card__title">{item.title}</h2>
      {item.subtitle ? <p className="card__sub">{item.subtitle}</p> : null}

      {/* The copy file marks emphasis with *asterisks*. `emphasise` escapes
          first, then converts the pairs, so the output is safe by construction. */}
      <p className="card__body" dangerouslySetInnerHTML={{ __html: emphasise(item.card) }} />

      <div className="card__prompt">
        <span>▸</span> A VIEW FULL WORK
      </div>
    </div>
  );
}
