---
id: T-024
title: Мобильная адаптивность — 0 horizontal scroll на iPhone
status: in_progress
priority: high
created: 2026-07-17
updated: 2026-07-17
related_code:
  - src/index.css
  - src/App.tsx
  - src/routes/Register.tsx
  - src/routes/Lobby.tsx
  - src/routes/CreateSession.tsx
  - src/routes/Session.tsx
  - src/routes/Stats.tsx
  - src/routes/Npc.tsx
  - src/routes/StyleGuide.tsx
  - src/components/SessionCard.tsx
  - src/components/RoleChoice.tsx
  - src/components/AddNpcPanel.tsx
  - src/components/Parchment.tsx
related_docs:
  - docs/superpowers/specs/2026-07-17-mobile-adaptive-ui-design.md
tags: [frontend, ui, mobile, tech-debt]
---

## Контекст

Пользователь проверил prod на iPhone: на Register и Lobby требуется горизонтальная прокрутка, дальше идти было неудобно. Дизайн не адаптивный. Подход утверждён в брейнсторме — inline mobile-first responsive классы (Approach #1), без extraction в новые компоненты.

Дизайн-спека: `docs/superpowers/specs/2026-07-17-mobile-adaptive-ui-design.md`.

## Acceptance criteria

- [ ] На iPhone SE (375px), 13 (390px), 15 Plus (430px) — 0 горизонтального скролла ни на одном route'е.
- [ ] Все интерактивные элементы (кнопки, radio, links-CTA) ≥44×44 CSS-px.
- [ ] Шрифты читаемы: минимум `text-sm` (14px) для body, `text-2xl+` для главных заголовков на mobile.
- [ ] Desktop (≥1024px) не деградировал: снапшоты «до/после» на 1280×900 совпадают в структуре.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e` — зелёные.
- [ ] Пользователь на iPhone проходит full happy-path без жалоб на скролл.

## План

План будет сформирован через `superpowers:writing-plans` в отдельном документе `docs/superpowers/plans/2026-07-17-mobile-adaptive-ui-plan.md`.

## Лог

- 2026-07-17: заведена после brainstorm'а. Спека готова. Следующий шаг — writing-plans.
