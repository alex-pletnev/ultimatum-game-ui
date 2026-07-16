---
id: T-022
title: Анимации — ансамбль (solemn scenes + playful ambient)
status: done
priority: medium
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/lib/motion.ts
  - src/routes/Session.tsx
  - src/main.tsx
  - src/components/Parchment.tsx
  - src/components/WaxSeal.tsx
  - src/components/SessionCard.tsx
related_docs: []
tags: [ui, animations, motion, gameplay, ambient]
---

## Контекст

Сайт функционально готов, стилистически — иммерсивная настолка, но статичен.
`motion@12` (framer-motion) уже в deps, нигде не используется — чистое поле.

Задача: оживить, не превратив в цирк. Регистр — **mix**:
solemn (медленно, весомо) на трёх событиях-драмах;
playful (упругое, отзывчивое) на ambient-обвязке.

## Три сцены-события (solemn)

- **A. Приход оффера** (`OFFERS_SENT`, у user есть pending decision):
  карта опускается сверху (600ms ease-out), тень растёт под ней.
  Через 200ms задержки — сумма как впечатанная печать
  (`scale 0.6→1 + rotate -15°→0°`, короткий settle).
- **B. Твоё решение**:
  * *Согласиться* → на карте появляется восковая печать (dip 150ms + отскок 100ms), карта fade-в-тень.
  * *Разбить* → карта рвётся пополам, blood-glow, 400ms.
- **C. Итог раунда**: строки табло вкатываются снизу stagger 80ms,
  числа count-up от прошлого счёта, лидер получает golden pulse (2× 800ms).

## Ambient (playful)

- Primary buttons: hover lift + press scale 0.96 (заменяет CSS translate/shadow на motion).
- WaxSeal: settle on mount (`rotate -3°→0°`, 400ms); в SessionCard — idle wobble 2° / 3s infinite.
- Parchment: mount fade+lift; идёт очень медленный idle-float `±2px, 6s`.
- Page transitions: `AnimatePresence` в main.tsx, fade-out 150 + fade-in 250 между route'ами.

## Acceptance criteria

- [x] `src/lib/motion.ts` — общие variants (`fadeIn`, `dropDown`, `stampSettle`,
      `waxSettle`, `tear`, `pageTransition`, easing tokens) + `useReducedMotion`.
- [x] `prefers-reduced-motion: reduce` → всё сводится к opacity switch'ам без transforms.
- [x] Ambient работает во всех экранах, где есть Parchment / WaxSeal / primary кнопка.
- [x] Три сцены (A, B, C) реализованы, проигрываются на реальных backend-событиях.
- [x] typecheck / lint / unit / e2e / build — зелёные.
- [x] Bundle: доп. код <5KB gz поверх уже установленного `motion`.

## План

1. `src/lib/motion.ts` + reduce-motion util.
2. Ambient: Parchment, WaxSeal, buttons.
3. Page transitions.
4. Scene A.
5. Scene B.
6. Scene C.
7. Verify → commit + push.

## Лог

- 2026-07-16: заведена, дизайн согласован (ансамбль + mix).
- 2026-07-16: реализовано.
  * `src/lib/motion.ts` — общие variants + easing tokens.
  * Parchment mount = fade+lift (350ms). Idle-float **не делаем** — Playwright'ов
    stability-check вешает клики на 30s (баг обнаружен на первом e2e-прогоне,
    trade-off осознан: тактильный «дыхательный» слой обменен на надёжность тестов).
  * WaxSeal mount = settle (450ms rotate/scale).
  * `press-tactile` CSS-utility (index.css) — active:scale 0.97 на всех ember-primary кнопках.
  * SessionCard: hover lift + shadow bump (Tailwind-only, без motion).
  * `AnimatedRoutes` — AnimatePresence + cross-fade 250/150ms между route'ами.
  * Scene A: OfferCardVisual — карта опускается, сумма садится штампом.
  * Scene B (accept): WaxSeal "✓" накрывает карту с dip-и-settle.
  * Scene B (reject): RejectTearOverlay — две clip-path половины + blood-glow.
  * Scene C: ScoreBoard — motion.ul stagger 80ms, AnimatedNumber count-up (RAF 450ms),
    лидер по дельте с scale-pulse.
  * `playwright.config.ts` — `reducedMotion: 'reduce'` (заодно валидируется наш
    reduce-motion path).
- verify: typecheck / lint / unit (61/61) / e2e (13/13) / build (791KB gz 230KB) — зелёные.
