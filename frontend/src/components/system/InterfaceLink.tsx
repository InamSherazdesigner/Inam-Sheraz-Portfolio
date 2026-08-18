'use client';

import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { playInterfaceSound } from '@/lib/interfaceSound';

export function InterfaceLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode }) {
  return (
    <a
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) playInterfaceSound('open');
      }}
    >
      {children}
    </a>
  );
}
