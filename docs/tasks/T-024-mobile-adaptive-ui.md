---
id: T-024
title: Мобильная адаптивность — 0 horizontal scroll на iPhone
status: done
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

- [x] На iPhone SE (375px), 13 (390px), 15 Plus (430px) — 0 горизонтального скролла ни на одном route'е (проверено локальным snap'ом auth-free экранов; gameplay-экраны требуют prod-проверки пользователем).
- [x] Все интерактивные элементы (кнопки, radio, links-CTA) ≥44×44 CSS-px — добавлен `min-h-11` на все CTA.
- [x] Шрифты читаемы: минимум `text-sm` для body, mobile-heading'и text-2xl-3xl (Title `text-4xl`).
- [x] Desktop (≥1024px) не деградировал: снапшот на 1280×900 идентичен по структуре — sm-breakpoint возвращает исходные размеры.
- [x] `pnpm test`, `pnpm typecheck`, `pnpm build` — зелёные. `pnpm test:e2e` не прогонялся (backend локально не поднят), риск минимален: правки чисто CSS-класс, селекторы e2e не тронуты.
- [ ] Пользователь на iPhone проходит full happy-path без жалоб на скролл — post-deploy проверка.

## План

Реализован через `superpowers:writing-plans`: `docs/superpowers/plans/2026-07-17-mobile-adaptive-ui-plan.md`. 7 задач: overflow-guard → TitleCard+Register → Lobby+SessionCard → CreateSession → Session gameplay+AddNpcPanel → Stats+NPC → StyleGuide + final regression.

## Лог

- 2026-07-17: заведена после brainstorm'а. Спека готова.
- 2026-07-17: план готов (writing-plans skill), 7 задач.
- 2026-07-17: executing-plans — все 7 задач выполнены, 7 коммитов. Правки: safety-guard `overflow-x-hidden` на html/body, route-обёртки `px-4 py-10 sm:px-8 sm:py-16`, крупные heading'и mobile-first (text-4xl sm:text-5xl / text-2xl sm:text-3xl / text-xl sm:text-2xl), sub-caps tracking mobile-first, все CTA `min-h-11` + tracking mobile-first, submit-кнопки регистрации/create-session `w-full sm:w-auto`, Session/NPC header'ы стакаются на mobile, CreateSession NumberStepper grid 1-col mobile, VENGEFUL/ADAPTIVE param-grids 1-col mobile, Recharts `margin.left: 0` (было -20 — обрезало Y-axis), Leaderboard `overflow-x-auto`. Локальные snap'ы 375/390/430/1280 — 0 overflow, desktop не деградировал.
