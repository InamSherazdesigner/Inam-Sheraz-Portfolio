/**
 * ROUTE-LEVEL SKELETON.
 *
 * Shown while a segment streams in. It mirrors the shape of a project page —
 * eyebrow, title, prose, artwork — so the content lands into the space it was
 * already occupying instead of pushing the page around.
 */

export default function Loading() {
  return (
    <div className="solo">
      <div className="stage__bar">
        <span className="stage__lamp" />
        <span className="stage__now">LOADING…</span>
      </div>
      <div className="stage__doc" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading the work</span>
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" style={{ maxWidth: '32rem' }} />
        <div className="skeleton skeleton--line" style={{ maxWidth: '28rem' }} />
        <div className="skeleton skeleton--line" style={{ maxWidth: '30rem' }} />
        <div className="skeleton skeleton--plate" />
      </div>
    </div>
  );
}
