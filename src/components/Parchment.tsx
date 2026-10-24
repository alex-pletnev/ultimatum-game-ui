import type { ReactNode } from 'react';

export function Parchment({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`game-card min-w-0 rounded-card border border-brass-500/20 bg-parchment-100 p-5 text-ink-900 shadow-parchment sm:p-8 ${className}`}
    >
      {children}
    </div>
  );
}
