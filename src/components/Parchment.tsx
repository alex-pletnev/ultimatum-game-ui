import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { easeSolemn } from '../lib/motion';

/*
 * Пергамент — базовая «карта / свиток» настолки.
 * Тёплый бежевый фон с edge-vignette, тень как у листа под свечой на столе.
 *
 * Motion:
 *  - mount: fade + subtle lift (350ms).
 *  - idle: очень медленный float ±2px, чтобы фон «дышал» под свечой.
 *  - reduced-motion: только opacity switch, никаких трансформаций.
 */
type Props = {
  children: ReactNode;
  className?: string;
};

export function Parchment({ children, className = '' }: Props) {
  const reduce = useReducedMotion();

  // Мы намеренно НЕ делаем бесконечный idle-float у Parchment: он
  // ломает Playwright'овский `element is stable`-чек у любой кнопки внутри
  // (30s timeout на каждый тест). Также, постоянное движение через час
  // становится раздражающим. Ambient — только разовая mount-анимация.
  const initial = reduce ? { opacity: 0 } : { opacity: 0, y: 12 };
  const animate = { opacity: 1, y: 0 };
  const transition = reduce
    ? { duration: 0.2 }
    : { duration: 0.35, ease: easeSolemn };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition}
      className={`relative rounded-card bg-parchment-100 px-10 py-12 text-ink-900 ${className}`}
      style={{
        boxShadow: 'var(--shadow-parchment), var(--shadow-candlelit)',
        backgroundImage: [
          'radial-gradient(ellipse at center, transparent 55%, rgba(90, 60, 20, 0.18) 100%)',
          'linear-gradient(115deg, rgba(210, 160, 90, 0.06) 0%, transparent 40%, rgba(60, 30, 10, 0.05) 100%)',
        ].join(', '),
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-3 rounded-inset border border-brass-500/40"
      />
      {children}
    </motion.div>
  );
}
