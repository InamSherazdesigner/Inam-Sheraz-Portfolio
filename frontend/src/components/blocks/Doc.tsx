'use client';

/**
 * THE DOCUMENT RENDERER.
 *
 * One block list in, the full view out. Both routes into the work — the
 * console's stage and the one-page view — render through this component and
 * nothing else, so the two cannot drift out of step. The original build made
 * the same guarantee by sharing a function; here it is a shared component.
 */

import dynamic from 'next/dynamic';
import type { Block, ChannelItem, Gate } from '@/content/types';
import { hasLinks, isProject } from '@/content/types';
import { RichText } from './RichText';
import { Plate } from './Plate';
import { CatGate } from './CatGate';
import { ContentNote, RevealProvider, useReveal } from './ContentNote';
import { ContactLinks } from '../contact/ContactLinks';
import { ContactForm } from '../contact/ContactForm';

/**
 * The voice widget pulls in the ElevenLabs client and the WebRTC/WebSocket
 * machinery behind it. It appears on exactly one project, so it is split out
 * of the main bundle and fetched only when that project is opened. `ssr:false`
 * because it touches navigator.mediaDevices, which does not exist on a server.
 */
const VoiceAgent = dynamic(() => import('../voice/VoiceAgent').then((m) => m.VoiceAgent), {
  ssr: false,
  loading: () => (
    <div className="voice" data-state="idle">
      <div className="voice__head">
        <span className="voice__lamp" />
        VOICE AGENT
      </div>
      <p className="voice__status">Loading…</p>
    </div>
  ),
});

interface DocProps {
  item: ChannelItem;
  /** The one-page view renders eleven documents; only the first gets priority. */
  priority?: boolean;
}

export function Doc({ item, priority = false }: DocProps) {
  const gate: Gate | undefined = isProject(item) ? item.gate : undefined;
  const mat = isProject(item) && Boolean(item.artworkMat);

  return (
    <RevealProvider>
      {item.page.map((block, index) => (
        <BlockView
          key={`${block.t}-${index}`}
          block={block}
          gate={gate}
          mat={mat}
          priority={priority && index < 4}
        />
      ))}
      {hasLinks(item) ? (
        <>
          <ContactLinks links={item.links} />
          <ContactForm />
        </>
      ) : null}
    </RevealProvider>
  );
}

function BlockView({
  block,
  gate,
  mat,
  priority,
}: {
  block: Block;
  gate: Gate | undefined;
  mat: boolean;
  priority: boolean;
}) {
  const { revealed } = useReveal();

  switch (block.t) {
    case 'p':
      return <RichText html={block.x} />;

    case 'h3':
      return <RichText html={block.x} as="h3" />;

    case 'lead':
      return <RichText html={block.x} className="lead" />;

    case 'credit':
      return <RichText html={block.x} className="credit" />;

    case 'rule':
      return <hr className="rule" />;

    case 'note':
      return <ContentNote kind={block.kind} text={block.x} gates={block.gates} />;

    case 'img':
      return <Plate item={block} mat={mat} priority={priority} />;

    case 'grid': {
      // A gated grid is not rendered at all until the note is acknowledged.
      if (block.gated && !revealed) return null;
      return (
        <>
          {block.label ? <p className="plates__label">{block.label}</p> : null}
          <div className="plates">
            {block.items.map((plate, i) => (
              <Plate key={plate.src} item={plate} mat={mat} priority={priority && i === 0} />
            ))}
          </div>
        </>
      );
    }

    /**
     * The three tree projections. Three squares, side by side, playing at the
     * same time. Showing them one after another destroys the argument — the
     * camera is identical in all three and only the ground changes, so seeing
     * them together IS the point. BUILD_SPEC §8a.
     */
    case 'triptych':
      return (
        <div className="triptych">
          {block.items.map((plate) => (
            <Plate key={plate.src} item={plate} mat={mat} />
          ))}
        </div>
      );

    /**
     * Anything with sound: a play button, never autoplay. preload="none" so
     * nothing downloads until the visitor presses play — BUILD_SPEC §11.
     */
    case 'video':
      return (
        <div className="media">
          {block.label ? <p className="media__label">{block.label}</p> : null}
          <figure
            className={`${mat ? 'plate plate--mat' : 'plate'}${block.ground ? ' plate--work-bg' : ''}`}
            style={block.ground ? ({ ['--media-ground' as string]: block.ground } as React.CSSProperties) : undefined}
            data-artwork-bg={block.backgroundColor}
          >
            <video src={block.src} controls preload="none" playsInline />
          </figure>
          {block.note ? <p className="media__note">{block.note}</p> : null}
        </div>
      );

    case 'mediaSlot':
      return (
        <div className={`media media--ambient media--slot-${block.id}`}>
          {block.label ? <p className="media__label">{block.label}</p> : null}
          <figure className={mat ? 'plate plate--mat' : 'plate'}>
            {block.src ? (
              <video src={block.src} muted loop autoPlay playsInline preload="auto" aria-label={block.label} />
            ) : (
              <div
                className="media__slot"
                data-slot={block.id}
                role="status"
                style={{
                  width: '100%',
                  minHeight: 'clamp(14rem, 40vw, 24rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  border: '1px dashed var(--ink-38)',
                  borderRadius: '4px',
                  padding: '2rem 1.5rem',
                  gap: '0.65rem',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--ink-75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    opacity: 0.85,
                  }}
                >
                  ▶
                </div>
                <span style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.95rem)', fontWeight: 700, letterSpacing: '0.14em' }}>
                  {block.label}
                </span>
                <small style={{ fontSize: 'var(--t-micro)', opacity: 0.75, letterSpacing: '0.12em' }}>
                  [ LOOPING VIDEO PLACEHOLDER · .mp4 / .webm ]
                </small>
              </div>
            )}
          </figure>
          {block.note ? <p className="media__note">{block.note}</p> : null}
        </div>
      );

    case 'audio':
      return (
        <div className="media">
          <p className="media__label">{block.label}</p>
          {/* His parents' real voices. Permission granted, clearly labelled,
              and never autoplayed. BUILD_SPEC §10. */}
          <audio src={block.src} controls preload="none" />
        </div>
      );

    case 'timeline':
      return (
        <ul className="timeline">
          {block.items.map((row) => (
            <li key={row.y}>
              <b>{row.y}</b>
              <span>{row.x}</span>
            </li>
          ))}
        </ul>
      );

    case 'gate':
      return gate ? <CatGate gate={gate} mat={mat} /> : null;

    case 'voiceAgent':
      return <VoiceAgent label={block.label} note={block.note} />;

    default:
      return null;
  }
}
