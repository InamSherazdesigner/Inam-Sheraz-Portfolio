/**
 * Reusable 1-bit loading sprite. Pixelated, stepped motion, and disabled when
 * the visitor prefers reduced motion.
 */

interface LoadingSpriteProps {
  slug: string;
  src: string;
}

export function LoadingSprite({ slug, src }: LoadingSpriteProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={`load__sprite load__sprite--${slug}`} src={src} alt="" />
  );
}
