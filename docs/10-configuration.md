# 10. Configuration

## Команды

_(появятся после T-002; заявляемые сейчас — планово из `package.json` scripts)_

| Команда | Действие |
|---------|----------|
| `pnpm install` | Установка зависимостей |
| `pnpm dev` | Vite dev-сервер, HMR (`http://localhost:5173`) |
| `pnpm build` | Production build → `dist/` |
| `pnpm preview` | Локальный serve production build'а |
| `pnpm test` | Vitest (unit) |
| `pnpm test:e2e` | Playwright (опционально, если введём) |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm format` | Prettier write |

## Environment variables

Vite использует `.env`, `.env.local`, `.env.development`, `.env.production`. Переменные для фронта — с префиксом `VITE_`.

_(конкретные ключи появятся после T-001, когда узнаем контракт backend'а)_

| Ключ | Пример | Назначение |
|------|--------|------------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | REST endpoint backend'а |
| `VITE_WS_URL` | `ws://localhost:8000/ws` | WebSocket endpoint (если есть) |

## Файлы, которые НЕ коммитим

- `.env.local`, `.env.*.local` — секреты и локальные overrides.
- `node_modules/`, `dist/`, `.vite/`, `coverage/`.
- IDE: `.idea/`, `.vscode/settings.json` (кроме shared `.vscode/settings.shared.json`, если такой заведём).
- OS: `.DS_Store`.

Всё это должно быть в `.gitignore` — создать вместе с scaffolding'ом (T-002).

## CI/CD

_(пока не настроено — задача на потом, отдельным таском когда захотим публиковать)_
