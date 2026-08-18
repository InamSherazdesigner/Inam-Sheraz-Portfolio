/**
 * STAGE 1 — THE MENU.
 *
 * The single most important rule in the whole build: the full project list is
 * readable text the moment the page loads. The device frames an index; it does
 * not hide one. An earlier version of this project hid the list behind a
 * thumbnail and failed for exactly that reason. BUILD_SPEC §2.
 */

import type { Channel, ChannelItem } from '@/content/types';
import { isProject } from '@/content/types';

interface MenuViewProps {
  channel: Channel;
  items: ChannelItem[];
  index: number;
  atFirstChannel: boolean;
  atLastChannel: boolean;
  onSelect: (index: number) => void;
}

export function MenuView({
  channel,
  items,
  index,
  atFirstChannel,
  atLastChannel,
  onSelect,
}: MenuViewProps) {
  return (
    <>
      <div className="lcd__head">
        <span className="lcd__channel">
          {/* The chevrons say the channel can be flicked. They dim at the ends. */}
          <span className="lcd__chev" style={{ opacity: atFirstChannel ? 0.2 : 0.45 }}>
            &lt;
          </span>
          {channel.label}
          <span className="lcd__chev" style={{ opacity: atLastChannel ? 0.2 : 0.45 }}>
            &gt;
          </span>
        </span>
        <span className="lcd__count">{String(items.length).padStart(2, '0')} ITEMS</span>
      </div>

      <ul className="lcd__list" role="listbox" aria-label={channel.label} tabIndex={-1}>
        {items.map((item, n) => (
          <li
            key={item.slug}
            className="lcd__row"
            role="option"
            aria-selected={n === index}
            onClick={() => onSelect(n)}
          >
            <span className="lcd__row-no">{isProject(item) ? item.id : '--'}</span>
            <span className="lcd__row-name">{item.title}</span>
            <span className="lcd__row-year">{isProject(item) ? item.year : ''}</span>
          </li>
        ))}
      </ul>

      <div className="lcd__foot">▲▼ MOVE &nbsp;◀▶ CHAN &nbsp;A OPEN</div>
    </>
  );
}
