# ultimatum-game-ui

Веб-фронт к игре **Ultimatum Game** ([backend](https://github.com/alex-pletnev/ultimatum-game) на Kotlin/Spring Boot). Проектируется как иммерсивная цифровая настолка в фирменной стилистике Claude Code.

## Стек

Vite · React 19 · TypeScript · Tailwind v4 · TanStack Query · Zustand · React Router 7 · `@stomp/stompjs` · motion (Framer) · Vitest.

## Запуск

```bash
pnpm install
cp .env.example .env.local        # подставить URL backend'а, если отличается
pnpm dev                           # http://localhost:5173
```

## Основные команды

| Команда | Что делает |
|---------|-----------|
| `pnpm dev` | Vite dev-сервер с HMR |
| `pnpm build` | `tsc -b` + `vite build` → `dist/` |
| `pnpm preview` | Локальный serve production build'а |
| `pnpm test` | Vitest (`test:watch` — watch-режим) |
| `pnpm typecheck` | `tsc -b --noEmit` |
| `pnpm lint` | ESLint 9 flat config |
| `pnpm format` | Prettier write |

## Документация

- [`docs/README.md`](docs/README.md) — индекс
- [`docs/05-api.md`](docs/05-api.md) — контракт backend'а
- [`docs/tasks/INDEX.md`](docs/tasks/INDEX.md) — таск-трекер

## Работа с AI-агентом

Правила и ритуалы — в [`CLAUDE.md`](CLAUDE.md).
