/**
 * CONTENT MODEL.
 *
 * The site's words are data, not markup. One shape, rendered by one set of
 * block components, used by both routes into the work — the console's full
 * view and the one-page view — so the two can never drift out of step. That
 * guarantee was the reason the original build shared its renderer, and it is
 * preserved here in the type system rather than by convention.
 */

/** Artwork. A mat is opt-in so work normally sits directly on its own ground. */
export interface Plate {
  src: string;
  alt: string;
  cap?: string;
  mat?: boolean;
  /** Optional ground for an individual work inside a multi-work project. */
  ground?: string;
  /** Full-view backdrop tint while this artwork is in focus. */
  backgroundColor?: string;
  /** Looping projection video overlay (e.g. for Breathe poster) */
  overlayVideo?: string;
}

export type Block =
  /** Paragraph. May carry authored inline markup — see `prose` in RichText. */
  | { t: 'p'; x: string }
  | { t: 'h3'; x: string }
  /** A standalone line that lands. Larger, still ink, never a second accent. */
  | { t: 'lead'; x: string }
  /** Attribution. Required on several projects — see BUILD_SPEC §10. */
  | { t: 'credit'; x: string }
  | { t: 'rule' }
  /**
   * An editorial, permission or content note.
   * `gates: true` means the images that follow stay hidden until the visitor
   * acknowledges it. Used for Khushi Ya Majboori.
   */
  | { t: 'note'; kind: 'content' | 'editorial' | 'access'; x: string; gates?: boolean }
  | { t: 'img'; src: string; alt: string; cap?: string; ground?: string; backgroundColor?: string; overlayVideo?: string }
  | { t: 'grid'; label?: string; items: Plate[]; gated?: boolean; variant?: 'video' }
  /** The three tree projections. Side by side, playing together. Never stacked. */
  | { t: 'triptych'; items: Plate[] }
  /** `mode: 'button'` = has sound, never autoplays. */
  | {
      t: 'video';
      src: string;
      mode: 'button' | 'ambient';
      label?: string;
      note?: string;
      ground?: string;
      backgroundColor?: string;
    }
  /** An intentionally empty ambient-video position for an asset supplied later. */
  | { t: 'mediaSlot'; id: string; label: string; src?: string; note?: string }
  | { t: 'audio'; src: string; label: string }
  | { t: 'timeline'; items: Array<{ y: string; x: string }> }
  /** The CAT password gate. Renders from `Project.gate`. */
  | { t: 'gate' }
  /** The live voice agent. Renders the widget that talks to the backend proxy. */
  | { t: 'voiceAgent'; label: string; note?: string };

export interface Gate {
  /**
   * Always visible, watermarked, low resolution. What a visitor sees without
   * the password.
   */
  preview: Plate[];
  /** Revealed after the backend confirms the password. */
  full: Plate[];
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  year: string;
  /** 1-bit LCD sprite shown while loading. `null` where none is drawn yet. */
  sprite: string | null;
  /** The short text, on the amber LCD at stage 3. */
  card: string;
  /** The long text, in the full view at stage 5. */
  page: Block[];
  /**
   * Per-project override of the full view's ground colour. LIMINAL is black
   * and white by its own stated design rule, so amber would break it.
   */
  ground?: string;
  /** LIMINAL deliberately keeps a paper-like artwork mat. */
  artworkMat?: boolean;
  gate?: Gate;
}

export interface Channel {
  id: 'work' | 'about' | 'contact';
  label: string;
  items: ChannelItem[];
}

export interface AboutEntry {
  id?: undefined;
  slug: string;
  title: string;
  subtitle?: string;
  year?: undefined;
  sprite: string | null;
  card: string;
  page: Block[];
}

export interface ContactLink {
  label: string;
  value: string | null;
  href: string | null;
}

export interface ContactEntry extends AboutEntry {
  links: ContactLink[];
}

export type ChannelItem = Project | AboutEntry | ContactEntry;

export const hasLinks = (item: ChannelItem): item is ContactEntry =>
  Array.isArray((item as ContactEntry).links);

export const isProject = (item: ChannelItem): item is Project =>
  typeof (item as Project).id === 'string';
