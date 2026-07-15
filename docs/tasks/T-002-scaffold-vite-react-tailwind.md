---
id: T-002
title: Vite+React+TS scaffolding, Tailwind, tooling
status: pending
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code: []
related_docs:
  - docs/01-overview.md
  - docs/10-configuration.md
tags: [scaffolding, setup, tooling]
---

## Контекст

Кода в проекте пока нет. Нужен минимальный «горячий» dev-loop: `pnpm dev` открывает пустой экран, HMR работает, Tailwind применяется, TypeScript строгий, тесты запускаются. Всё дальше — на этом фундаменте.

Зависит от T-001 не жёстко: scaffolding можно ставить и без знания API. Но env-переменные и структуру `src/api/` оформим уже с оглядкой на T-001.

## Acceptance criteria

- [ ] `package.json` с scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`, `format`.
- [ ] Vite + React 18 + TypeScript строгий (`strict: true`, `noUncheckedIndexedAccess`).
- [ ] TailwindCSS настроен, `tailwind.config.ts` под кастомные tokens (пока minimal).
- [ ] ESLint + Prettier — базовые конфиги, не спорящие между собой.
- [ ] Vitest + @testing-library/react — один smoke-тест проходит.
- [ ] `@stomp/stompjs` установлен (backend отдаёт STOMP-over-WebSocket, не голый WS — см. T-001).
- [ ] `.env.example` с ключами `VITE_API_BASE_URL` (`http://localhost:8080/api/v1`) и `VITE_WS_URL` (`ws://localhost:8080/api/v1/ws`).
- [ ] Решение о кодогенерации типов из OpenAPI (`openapi-typescript` из `docs/05-api.md`) — да/нет + обоснование в task-лог.
- [ ] `pnpm dev` показывает пустой экран без ошибок в console.
- [ ] `pnpm build` собирается без warnings/errors.

## План

1. `pnpm create vite . --template react-ts` (в текущей папке) → пройти wizard.
2. Установить и настроить Tailwind (следовать официальному гайду для Vite).
3. Установить ESLint (`eslint-config-standard-with-typescript` или flat-config эквивалент), Prettier, интеграция.
4. Установить Vitest + testing-library, добавить smoke-тест (`src/App.test.tsx`).
5. Настроить `tsconfig.json` (strict + noUncheckedIndexedAccess).
6. Установить `@stomp/stompjs` (deps) и `@tanstack/react-query`, `zustand`, `react-router-dom`, `framer-motion` (см. `docs/01-overview.md`).
7. Создать `.editorconfig`, `.prettierrc` (`.gitignore` уже есть).
8. `.env.example` с dev-URL backend'а.
9. Написать корневой `README.md` (короткий).
10. Проверить все команды из AC.
11. Через `/task-done` — commit + push.

## Лог

- 2026-07-15: заведена автоматически при setup-agent-harness. Второй по порядку, но не блокирует T-001 (могут идти параллельно).
