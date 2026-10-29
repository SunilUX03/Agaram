import type { ReactNode } from 'react';
export const Tag = ({ children }: { children: ReactNode }) => (
  <span className="tag">{children}</span>
);
