import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="crash">
      <h1>Nothing on this channel</h1>
      <p>
        That address does not match anything here. The console has eleven projects on it, and the
        one-page view has all of them at once.
      </p>
      <div className="crash__actions">
        <Link href="/">THE CONSOLE</Link>
        <Link href="/everything">VIEW EVERYTHING</Link>
      </div>
    </div>
  );
}
