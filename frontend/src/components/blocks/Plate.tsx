/**
 * ONE ARTWORK ON A MAT.
 *
 * The mat is the only thing that touches the amber ground. The work sits on
 * the mat, the way a print sits inside a mount, so the saturated ground cannot
 * shift how the work reads.
 *
 * Nothing here ever applies a blend mode, filter or tint to an artwork. The
 * only overlay in the build is the CAT watermark, which BUILD_SPEC §10
 * requires and which is drawn by CSS on .plate--marked.
 */

import Image from 'next/image';
import type { Plate as PlateData } from '@/content/types';

const isVideo = (src: string) => /\.(webm|mp4|mov)$/i.test(src);

interface PlateProps {
  item: PlateData;
  marked?: boolean;
  mat?: boolean;
  /** The first artwork in a project is its LCP element and must not be lazy. */
  priority?: boolean;
}

export function Plate({ item, marked = false, mat = false, priority = false }: PlateProps) {
  return (
    <figure
      className={`plate${marked ? ' plate--marked' : ''}${mat || item.mat ? ' plate--mat' : ''}${item.ground ? ' plate--work-bg' : ''}`}
      style={item.ground ? ({ ['--media-ground' as string]: item.ground } as React.CSSProperties) : undefined}
      data-artwork-bg={item.backgroundColor}
    >
      <div style={{ position: 'relative', width: '100%', lineHeight: 0, overflow: 'hidden' }}>
        {isVideo(item.src) ? (
          /**
           * Silent ambient loops may autoplay muted. Nothing else autoplays —
           * BUILD_SPEC §11, §13. `playsInline` is what stops iOS taking a muted
           * loop fullscreen.
           */
          <video
            src={item.src}
            muted
            loop
            autoPlay
            playsInline
            preload="none"
            aria-label={item.alt}
          />
        ) : (
          /**
           * width/height are nominal. The CSS drives the real size; these exist
           * so the browser reserves the right space and the page does not shift
           * as artwork arrives. `sizes` keeps Next from serving a 2560px source
           * into a 300px grid cell on a phone.
           */
          <Image
            src={item.src}
            alt={item.alt}
            width={1600}
            height={1200}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 620px"
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            decoding="async"
            quality={90}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}

        {item.overlayVideo ? (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              aspectRatio: '1 / 1',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mixBlendMode: 'multiply',
            }}
          >
            <video
              src={item.overlayVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : null}
      </div>

      {item.cap ? <figcaption className="plate__cap">{item.cap}</figcaption> : null}
    </figure>
  );
}
