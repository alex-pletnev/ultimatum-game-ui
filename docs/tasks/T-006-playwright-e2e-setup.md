---
id: T-006
title: Playwright — e2e-фундамент и первые тесты happy-path
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - playwright.config.ts
  - e2e/tsconfig.json
  - e2e/utils.ts
  - e2e/smoke.spec.ts
  - e2e/register.spec.ts
  - vite.config.ts
  - eslint.config.js
  - package.json
  - .gitignore
  - CLAUDE.md
related_docs:
  - docs/tasks/T-005-registration-screen.md
tags: [testing, e2e, playwright, tooling]
---

## Контекст

Пользователь хочет, чтобы агент мог самостоятельно проверять UI-фичи до того, как передаёт задачу «посмотри в браузере». Playwright headless + скриншоты (мультимодальная модель их читает) закрывает это на 80%. Дополнительно: regression suite перед каждым `task-done` UI-задачи.

Устанавливаем инфраструктуру и пишем базовый набор тестов на существующие экраны (`/`, `/register`, `/_style-guide`). Дальше — по мере появления фичей.

## Acceptance criteria

- [x] `@playwright/test` установлен, Chromium скачан (`pnpm exec playwright install chromium`).
- [x] `playwright.config.ts`: testDir `e2e`, baseURL `http://localhost:5173`, webServer `pnpm dev` с reuseExistingServer, только Chromium, `trace/screenshot/video: on-failure`.
- [x] `vite.config.ts` → `test.include: ['src/**/*.test.{ts,tsx}']` + `exclude: ['e2e/**', ...]` — Vitest не подхватывает Playwright-spec'и.
- [x] `e2e/tsconfig.json` — extends `tsconfig.app.json`, добавляет `node`-типы.
- [x] `e2e/utils.ts` — `ensureBackendUp()`, `uniqueNickname()`, `clearAuth()`, `expectTitleCard()`.
- [x] `e2e/smoke.spec.ts`: title card на `/` + style-guide загружает 4 секции.
- [x] `e2e/register.spec.ts`: happy path (register → welcome → logout → title) + short nickname (local validation, fetch не улетает) + role toggle (ADMIN отправляется в body).
- [x] `ensureBackendUp()` кидает понятное сообщение если backend не отвечает — тесты не висят молча.
- [x] Скрипты `test:e2e` и `test:e2e:ui` в `package.json`.
- [x] `.gitignore` покрывает `/playwright-report/`, `/test-results/`, `/blob-report/`, `/playwright/.cache/`.
- [x] Все проверки: typecheck ✅, vitest 18/18 ✅ (не подцепил e2e), lint ✅, e2e 5/5 ✅ (3.4s total).
- [x] Feedback-loop зафиксирован в CLAUDE.md — секция «Запуск и проверки» + новая строка в «Проактивные триггеры»: после UI-изменений `pnpm test:e2e` + чтение screenshot'а при провале.

## План

1. `pnpm add -D @playwright/test`, `pnpm exec playwright install chromium`.
2. `playwright.config.ts` + `e2e/tsconfig.json`.
3. Обновить `vite.config.ts`: `test.include`.
4. Обновить `eslint.config.js`: ignore `e2e/` (свои globals).
5. `.gitignore`: playwright-report, test-results, .playwright.
6. `e2e/utils.ts`: `uniqueNickname()`, `ensureBackendUp()`.
7. `e2e/smoke.spec.ts`: 2 теста.
8. `e2e/register.spec.ts`: 2 теста.
9. Прогнать `pnpm test:e2e` (backend уже поднят). Скриншот если провал — читаю через Read.
10. `/task-done`.

## Лог

- 2026-07-15: заведена, переведена в `in_progress`. Приоритет — high, ставим до лобби, чтобы будущие UI-задачи закрывать со screenshot-фидбеком.
- 2026-07-15: реализовано. Один тест (role toggle) сначала упал: WaxSeal-SVG внутри `<label>` перехватывал pointer-events на sr-only radio, `.click()` и `.check()` без force не проходили. **Прочитал screenshot** через Read tool — форма выглядит правильно (пергамент/печати/ember-кнопка), значит не бага в компоненте, а бага в тесте. Пофиксил через `.check({ force: true })` с комментарием почему. Feedback-loop сработал end-to-end: тест → скриншот → диагноз → фикс без вмешательства пользователя. Переведена в `done`.
