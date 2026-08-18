import { TetrisBackground } from '@/components/TetrisBackground';

/** Dev preview route for the Tetris background canvas. */
export default function TetrisTestPage() {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: '#F2A626',
      }}
    >
      <div style={{ width: 'min(280px, 90vw)' }}>
        <TetrisBackground />
      </div>
    </main>
  );
}
