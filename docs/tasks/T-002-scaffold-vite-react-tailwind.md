---
id: T-002
title: Vite+React+TS scaffolding, Tailwind, tooling
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - package.json
  - vite.config.ts
  - tsconfig.app.json
  - src/main.tsx
  - src/App.tsx
  - src/App.test.tsx
  - src/index.css
  - eslint.config.js
related_docs:
  - docs/01-overview.md
  - docs/10-configuration.md
tags: [scaffolding, setup, tooling]
---

## Контекст

Кода в проекте пока нет. Нужен минимальный «горячий» dev-loop: `pnpm dev` открывает пустой экран, HMR работает, Tailwind применяется, TypeScript строгий, тесты запускаются. Всё дальше — на этом фундаменте.

Зависит от T-001 не жёстко: scaffolding можно ставить и без знания API. Но env-переменные и структуру `src/api/` оформим уже с оглядкой на T-001.

## Acceptance criteria

- [x] `package.json` с scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`, `format`.
- [x] Vite 6 + React 19 + TypeScript 5.9 строгий (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`).
- [x] TailwindCSS v4 через `@tailwindcss/vite` plugin (без PostCSS-конфига — v4 не требует). Кастомные tokens отложены до T-003.
- [x] ESLint 9 flat config + Prettier — базовые, совместимые.
- [x] Vitest 3 + @testing-library/react + jsdom — smoke-тест `App renders the placeholder greeting` проходит.
- [x] `@stomp/stompjs` установлен (backend отдаёт STOMP-over-WebSocket).
- [x] `.env.example` с `VITE_API_BASE_URL` и `VITE_WS_URL`.
- [x] Решение о кодогенерации типов из OpenAPI: **отложено** до момента появления первого REST-вызова (T-005 или около). Обоснование: 15 endpoints не так много, часть контракта уже описана в `docs/07-types.md` вручную. Runtime-валидация (zod) — тоже отложена, добавим если backend начнёт drift'ить. Тег-задача на будущее — потенциально `T-XXX-openapi-codegen-decision.md`.
- [x] `pnpm dev` показывает пустой экран без ошибок в console (Vite ready за 225 мс).
- [x] `pnpm build` собирается без warnings/errors (dist: `index.js` 195 KB → 61 KB gzip, `index.css` 7.4 KB → 2.2 KB gzip).

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
- 2026-07-15: переведена в `in_progress`. Установка pnpm через `npm i -g pnpm` (у пользователя не было ни pnpm, ни corepack). Все конфиги написаны вручную вместо `pnpm create vite` (директория уже была непустая — docs, CLAUDE, git). Стек апгрейднут до more-current-2026: Vite 6, React 19, Tailwind v4, ESLint 9 flat, Vitest 3, TypeScript 5.9. `pnpm-workspace.yaml` пришлось создать для `allowBuilds: esbuild: true` (pnpm v11 блокирует postinstall-скрипты по умолчанию — security feature). Добавил `@types/node` (для `node:path` в `vite.config.ts`) и `@eslint/js` (флэт-конфиг требует), которые я упустил в первой волне deps.
- 2026-07-15: все проверки зелёные — `pnpm typecheck` ✅, `pnpm test` 1/1 ✅, `pnpm lint` ✅ (0 warnings), `pnpm build` ✅ (~195KB→61KB gzip), `pnpm dev` ready за 225 мс без ошибок. Переведена в `done`.
