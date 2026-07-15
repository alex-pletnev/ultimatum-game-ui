---
id: T-001
title: Изучить frontend-integration/, заполнить API-контракт
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code: []
related_docs:
  - docs/05-api.md
  - docs/07-types.md
  - docs/11-known-gaps.md
  - docs/01-overview.md
tags: [api, docs, integration]
---

## Контекст

Backend уже существует: <https://github.com/alex-pletnev/ultimatum-game>. В нём есть каталог `frontend-integration/` с документацией по интеграции (пользователь: «читай README, там TOC»). До того как писать код фронта — нужно понять контракт: URL-ы, форматы запросов/ответов, WebSocket, аутентификация. Иначе первые попытки scaffolding'а окажутся заточены под догадки.

## Acceptance criteria

- [x] Прочитан `frontend-integration/README.md` upstream'а и все файлы из его TOC (11 файлов: 01–09 + specs/openapi.json + specs/asyncapi.json).
- [x] `docs/05-api.md` заполнен: base URL, аутентификация, REST endpoints (метод/путь/payload/response/errors), формат ошибок.
- [x] `docs/05-api.md` заполнен для WebSocket (STOMP 1.2): URL, CONNECT-фрейм с JWT, все `/topic/`-подписки и `/app/`-команды.
- [x] `docs/07-types.md` — полный каталог DTO/типов, enum'ы, соглашения по форматам, ремап полей (`amount` ↔ `offerValue`).
- [x] `docs/11-known-gaps.md` обновлён: ответы на открытые вопросы + новые (мобильный layout, default role, кодогенерация, zod-валидация) + техдолги backend'а, влияющие на фронт (таймауты, refresh rotation, порядок WS-сообщений).
- [x] `docs/01-overview.md` обновлён: реальный стек backend'а (Kotlin/Spring, не Python), ключевые концепции пересобраны из реальной модели, `@stomp/stompjs` добавлен в планируемый стек.
- [x] Ошибка initial-контекста (Python/FastAPI) исправлена в CLAUDE.md `SPECIFIC_RULES` и `.claude/harness-config.json`.
- [x] T-002 расширена: `@stomp/stompjs` обязателен, добавлено AC про решение о кодогенерации типов.

## План

1. WebFetch на `https://github.com/alex-pletnev/ultimatum-game/tree/main/frontend-integration` — получить структуру каталога.
2. WebFetch на `frontend-integration/README.md` (raw) — вычитать TOC.
3. По TOC — параллельно прочитать все ссылочные файлы через WebFetch (agent Explore или несколько параллельных запросов).
4. Составить черновик `docs/05-api.md` (REST + WebSocket) и `docs/07-types.md` (DTO).
5. Сформулировать открытые вопросы, дописать в `docs/11-known-gaps.md`.
6. Обновить фронтматтер: `status: done`, добавить лог.
7. Через `/task-done` — commit + push.

## Лог

- 2026-07-15: заведена автоматически при setup-agent-harness. Первая задача проекта — без неё scaffolding будет вслепую.
- 2026-07-15: переведена в `in_progress`. Dispatch Explore-агента на `frontend-integration/`.
- 2026-07-15: Explore-агент вернул полный отчёт по 11 файлам upstream'а. Backend оказался Kotlin/Spring Boot (не Python/FastAPI, как я предполагал в initial-контексте), STOMP-over-WebSocket, JWT (access 15м + refresh 14д). Заполнены `docs/05-api.md` (Endpoints, WS-топики, ошибки, state-machines, известные NOT-implemented) и `docs/07-types.md` (полный каталог DTO/enum'ов с ремапом полей). Обновил `docs/01-overview.md` и `docs/11-known-gaps.md`. Исправил ошибочный Python/FastAPI в `CLAUDE.md → SPECIFIC_RULES` и `harness-config.json`. Расширил T-002 (обязательный `@stomp/stompjs` + decision о кодогенерации типов).
- 2026-07-15: переведена в `done`.
