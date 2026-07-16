import type { Easing, Variants } from 'motion/react';

/**
 * Централизованные motion-variants и easing-токены под настолочный стиль.
 *
 * Регистр:
 * - **solemn** — медленные, весомые движения на драматических событиях
 *   (приход оффера, решение, итог раунда).
 * - **playful** — короткая тактильная отдача на интерактиве
 *   (hover, press, mount карточек).
 *
 * `prefers-reduced-motion: reduce` обрабатывается на уровне компонента через
 * `useReducedMotion()` из `motion/react` — вместо transform-based enter/exit
 * оставляем только opacity switch, чтобы у пользователя не ехало в глазах.
 */

/* ────────────────────  Easing tokens  ──────────────────── */

/** Cubic-bezier «settling wax» — быстрое начало, мягкое приземление. */
export const easeSolemn: Easing = [0.22, 1, 0.36, 1];
/** Cubic-bezier «tactile press» — короткое, отзывчивое. */
export const easePlayful: Easing = [0.34, 1.3, 0.64, 1];

/* ────────────────────  Ambient variants  ──────────────────── */

/**
 * Parchment mount: поднимается вверх и проявляется. Одноразово при монтировании.
 * exit не задан — при route-transition это handled на уровне AnimatePresence.
 */
export const parchmentEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/** Wax seal settle: чуть повёрнутая при mount, «доворачивается» на место. */
export const waxSettle: Variants = {
  hidden: { opacity: 0, rotate: -8, scale: 0.85 },
  visible: { opacity: 1, rotate: 0, scale: 1 },
};

/** SessionCard idle wobble — почти незаметный. */
export const cardWobble: Variants = {
  idle: {
    rotate: [-0.6, 0.6, -0.6],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
};

/* ────────────────────  Button tactile press  ──────────────────── */

/**
 * Whileemplo hover: subtle lift; press: scale-down.
 * Специально маленькие цифры — «отзыв», а не «прыжок».
 */
export const buttonPress = {
  whileHover: { y: -1 },
  whileTap: { scale: 0.96 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 22 },
};

/* ────────────────────  Page transitions  ──────────────────── */

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  enter: { opacity: 1, transition: { duration: 0.25, ease: easeSolemn } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: 'linear' } },
};

/* ────────────────────  Scene A — приход оффера  ──────────────────── */

/** Карта оффера опускается сверху. Тяжёлое, ~600ms. */
export const offerCardDrop: Variants = {
  hidden: { opacity: 0, y: -32, rotate: -2 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, ease: easeSolemn },
  },
};

/**
 * «Сумма впечатана» — печать садится на карту с задержкой,
 * лёгкий over-shoot rotate.
 */
export const stampSettle: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -15 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      delay: 0.2,
      duration: 0.55,
      ease: easeSolemn,
    },
  },
};

/* ────────────────────  Scene B — decision  ──────────────────── */

/**
 * Accept: печать прижимается к карте и отскакивает.
 * Двухфазовая keyframe-анимация — dip → settle.
 */
export const acceptStamp: Variants = {
  hidden: { opacity: 0, scale: 0.4, rotate: -20 },
  visible: {
    opacity: [0, 1, 1],
    scale: [0.4, 1.15, 1.0],
    rotate: [-20, -6, 0],
    transition: {
      duration: 0.4,
      ease: easeSolemn,
      times: [0, 0.55, 1],
    },
  },
};

/**
 * Reject: карта рвётся. Компонент должен рендерить две половины —
 * левая уезжает налево+вниз, правая направо+вниз.
 */
export const tearLeft: Variants = {
  hidden: { x: 0, y: 0, rotate: 0, opacity: 1 },
  visible: {
    x: -80,
    y: 12,
    rotate: -6,
    opacity: 0,
    transition: { duration: 0.45, ease: easeSolemn },
  },
};
export const tearRight: Variants = {
  hidden: { x: 0, y: 0, rotate: 0, opacity: 1 },
  visible: {
    x: 80,
    y: 12,
    rotate: 6,
    opacity: 0,
    transition: { duration: 0.45, ease: easeSolemn },
  },
};

/* ────────────────────  Scene C — score reveal  ──────────────────── */

/** Контейнер табло: stagger 80ms между строками. */
export const scoreListStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

/** Одна строка табло — влетает снизу. */
export const scoreRowEnter: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeSolemn },
  },
};

/**
 * Golden pulse для лидера дельты. Один цикл 800ms × 2.
 * Пульсирует opacity + boxShadow-scale (через custom transform).
 */
export const winnerPulse: Variants = {
  idle: {
    scale: [1, 1.04, 1],
    transition: { duration: 0.8, repeat: 1, ease: 'easeInOut' },
  },
};
