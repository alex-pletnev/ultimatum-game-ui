import type { ReactNode } from 'react';

/*
 * Пергамент — базовая «карта / свиток» настолки.
 * Тёплый бежевый фон с eлegal edge-vignette,
 * тень как у листа под свечой на столе.
 */
type Props = {
  children: ReactNode;
  className?: string;
};

export function Parchment({ children, className = '' }: Props) {
  return (
    <div
      className={`relative rounded-card bg-parchment-100 px-10 py-12 text-ink-900 ${className}`}
      style={{
        boxShadow: 'var(--shadow-parchment), var(--shadow-candlelit)',
        backgroundImage: [
          // Внешнее «затемнение краёв» — как у старого листа
          'radial-gradient(ellipse at center, transparent 55%, rgba(90, 60, 20, 0.18) 100%)',
          // Тонкий шум-мазок (два наложенных gradient'а)
          'linear-gradient(115deg, rgba(210, 160, 90, 0.06) 0%, transparent 40%, rgba(60, 30, 10, 0.05) 100%)',
        ].join(', '),
      }}
    >
      {/* Декоративная brass-рамка по внутреннему краю */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-inset border border-brass-500/40"
      />
      {children}
    </div>
  );
}
