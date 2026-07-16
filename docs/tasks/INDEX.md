# Task Index

Автоматически обновляется командами `/task-add`, `/task-done`, `/task-sync`. При ручных правках следить за консистентностью с файлами задач.

Формат: сортировка по `id` (по возрастанию). Формат `docs/tasks/README.md`.

## Открытые задачи

| ID | Название | Статус | Приоритет | Обновлено | Файл |
|----|----------|--------|-----------|-----------|------|
| T-014 | Lobby после POST /session — Playwright race | pending | low | 2026-07-16 | [T-014-lobby-refetch-race-debug.md](T-014-lobby-refetch-race-debug.md) |

## Закрытые задачи

| ID | Название | Статус | Закрыто | Файл |
|----|----------|--------|---------|------|
| T-013 | e2e — независимость от БД + verify current-round fix | done | 2026-07-16 | [T-013-verify-current-round-fix.md](T-013-verify-current-round-fix.md) |
| T-015 | Offer flow — форма отправки оффера в фазе WAIT_OFFERS | done | 2026-07-16 | [T-015-offer-form.md](T-015-offer-form.md) |
| T-001 | Изучить frontend-integration/, заполнить API-контракт | done | 2026-07-15 | [T-001-fetch-and-document-api.md](T-001-fetch-and-document-api.md) |
| T-002 | Vite+React+TS scaffolding, Tailwind, tooling | done | 2026-07-15 | [T-002-scaffold-vite-react-tailwind.md](T-002-scaffold-vite-react-tailwind.md) |
| T-003 | Design tokens: фэнтези-настолка + Claude-brand | done | 2026-07-15 | [T-003-design-tokens-claude-brand.md](T-003-design-tokens-claude-brand.md) |
| T-004 | Backend integration foundation — REST + STOMP + react-query | done | 2026-07-15 | [T-004-backend-integration-foundation.md](T-004-backend-integration-foundation.md) |
| T-005 | Экран регистрации — «Присесть за стол» | done | 2026-07-15 | [T-005-registration-screen.md](T-005-registration-screen.md) |
| T-006 | Playwright — e2e-фундамент и первые тесты happy-path | done | 2026-07-15 | [T-006-playwright-e2e-setup.md](T-006-playwright-e2e-setup.md) |
| T-007 | Лобби — список открытых партий как афиши | done | 2026-07-15 | [T-007-lobby-session-list.md](T-007-lobby-session-list.md) |
| T-008 | Экран учреждения партии (ADMIN → POST /session) | done | 2026-07-15 | [T-008-create-session-screen.md](T-008-create-session-screen.md) |
| T-009 | Join сессии + заглушка экрана игры | done | 2026-07-15 | [T-009-join-session-and-placeholder-screen.md](T-009-join-session-and-placeholder-screen.md) |
| T-010 | WS live-sync — состав партии обновляется реалтайм | done | 2026-07-15 | [T-010-session-live-sync.md](T-010-session-live-sync.md) |
| T-011 | pnpm snap — ad-hoc screenshot скрипт | done | 2026-07-15 | [T-011-pnpm-snap-script.md](T-011-pnpm-snap-script.md) |
| T-012 | ADMIN стартует партию + отображение фазы раунда | done | 2026-07-15 | [T-012-admin-start-round.md](T-012-admin-start-round.md) |

## Закрытые consolidation-циклы

| Дата | После задачи | Задач в окне | Заведено meta-задач |
|------|--------------|--------------|--------------------|
| 2026-07-15 | T-010 | 10 | T-011 (snap-скрипт) |

## Легенда статусов

`pending` → `in_progress` → `done` / `cancelled`. Промежуточно возможен `blocked`.
