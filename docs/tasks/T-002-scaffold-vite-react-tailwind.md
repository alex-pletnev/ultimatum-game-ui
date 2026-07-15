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
- [ ] `.gitignore` покрывает `node_modules/`, `dist/`, `.env.local`, `.vite/`, `coverage/`, IDE-фолдеры, OS-мусор.
- [ ] `README.md` в корне: одна фраза о проекте + команды запуска.
- [ ] `pnpm dev` показывает пустой экран без ошибок в console.
- [ ] `pnpm build` собирается без warnings/errors.

## План

1. `pnpm create vite . --template react-ts` (в текущей папке) → пройти wizard.
2. Установить и настроить Tailwind (следовать официальному гайду для Vite).
3. Установить ESLint (`eslint-config-standard-with-typescript` или flat-config эквивалент), Prettier, интеграция.
4. Установить Vitest + testing-library, добавить smoke-тест (`src/App.test.tsx`).
5. Настроить `tsconfig.json` (strict + noUncheckedIndexedAccess).
6. Создать `.gitignore`, `.editorconfig`, `.prettierrc`.
7. Написать корневой `README.md` (короткий).
8. Проверить все команды из AC.
9. Через `/task-done` — commit + push.

## Лог

- 2026-07-15: заведена автоматически при setup-agent-harness. Второй по порядку, но не блокирует T-001 (могут идти параллельно).
