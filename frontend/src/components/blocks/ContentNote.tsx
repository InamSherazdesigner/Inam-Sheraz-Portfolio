'use client';

/**
 * A NOTE, AND THE IMAGES IT COVERS.
 *
 * Three kinds, one treatment — they are warnings and disclosures, not
 * decoration, so they read as interface rather than as prose.
 *
 * The gating case is the one that matters. Khushi Ya Majboori depicts domestic
 * violence, and BUILD_SPEC §10 requires the note to be read *before* the
 * images are visible. The gated grid is therefore never rendered until the
 * visitor asks for it — not rendered-and-hidden, not opacity-zero, not
 * off-screen. Nothing arrives in the document that the visitor has not agreed
 * to see, which is the only version of this that survives someone reading the
 * DOM or turning off CSS.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

const KIND_LABEL = {
  content: 'CONTENT NOTE',
  editorial: 'BEFORE PUBLISHING',
  access: 'ACCESS',
} as const;

/**
 * The note and the grid it gates are siblings in a flat block list, so the
 * state has to be lifted to the document that renders both.
 */
const RevealContext = createContext<{ revealed: boolean; reveal: () => void }>({
  revealed: false,
  reveal: () => {},
});

export function RevealProvider({ children }: { children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <RevealContext.Provider value={{ revealed, reveal: () => setRevealed(true) }}>
      {children}
    </RevealContext.Provider>
  );
}

export const useReveal = () => useContext(RevealContext);

interface ContentNoteProps {
  kind: 'content' | 'editorial' | 'access';
  text: string;
  gates?: boolean;
}

export function ContentNote({ kind, text, gates = false }: ContentNoteProps) {
  const { revealed, reveal } = useReveal();

  return (
    <aside className={`note note--${kind}`}>
      <span className="note__kind">{KIND_LABEL[kind]}</span>
      {text}
      {gates && !revealed ? (
        <button type="button" className="note__reveal" onClick={reveal}>
          SHOW THE IMAGES
        </button>
      ) : null}
    </aside>
  );
}
