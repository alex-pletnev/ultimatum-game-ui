---
id: T-003
title: Design tokens — палитра/типографика Claude-brand
status: pending
priority: medium
created: 2026-07-15
updated: 2026-07-15
related_code: []
related_docs:
  - docs/04-components.md
  - docs/01-overview.md
tags: [design, ui, tokens, style]
---

## Контекст

Стилистическая директива проекта — фирменный визуал Claude Code, переосмысленный как настольная игра. Прежде чем писать компоненты, нужен зафиксированный «атлас» токенов: цвета, типографика, spacing, тени, скругления. Дальше — все компоненты только через эти токены, без раскиданных hex'ов.

Зависит от T-002 (нужен настроенный Tailwind).

## Acceptance criteria

- [ ] `src/styles/tokens.css` — CSS variables для цветов (background, surface, ink, accent-primary/accent-warm, muted, danger, success), тени, скругления.
- [ ] `tailwind.config.ts` расширен: colors, fontFamily, boxShadow, borderRadius — всё через var(--token-*).
- [ ] Палитра: угольные/тёмно-графитовые фоны + тёплый оранжевый Claude/Anthropic-accent + пергаментные оттенки для «внутриигрового» текста.
- [ ] Типографика: моноширинный шрифт для «системных/UI»-подписей (Berkeley Mono / IBM Plex Mono / JetBrains Mono), serif для «внутриигровых» текстов (EB Garamond / IM Fell English).
- [ ] Демо-страница `src/routes/_style-guide.tsx` (dev-only) с образцами всех токенов.
- [ ] Скриншот демо-страницы — приложен к task-логу или в PR-описании.

## План

1. Собрать референсы: скриншоты Claude Code UI + образцы настольной эстетики (тёплое дерево, войлок, тиснёный шрифт).
2. Зафиксировать палитру — 8-10 CSS-переменных, не больше.
3. Выбрать шрифты, подключить (Google Fonts или self-hosted).
4. Написать `tokens.css`, прокинуть в `tailwind.config.ts`.
5. Собрать style-guide route.
6. Проверить визуально на `pnpm dev`.
7. Через `/task-done`.

## Лог

- 2026-07-15: заведена автоматически при setup-agent-harness. Опережает первый UI-код: без токенов начнём хардкодить цвета.
