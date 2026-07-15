---
id: T-001
title: Изучить frontend-integration/, заполнить API-контракт
status: pending
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code: []
related_docs:
  - docs/05-api.md
  - docs/07-types.md
  - docs/11-known-gaps.md
tags: [api, docs, integration]
---

## Контекст

Backend уже существует: <https://github.com/alex-pletnev/ultimatum-game>. В нём есть каталог `frontend-integration/` с документацией по интеграции (пользователь: «читай README, там TOC»). До того как писать код фронта — нужно понять контракт: URL-ы, форматы запросов/ответов, WebSocket, аутентификация. Иначе первые попытки scaffolding'а окажутся заточены под догадки.

## Acceptance criteria

- [ ] Прочитан `frontend-integration/README.md` upstream'а и все файлы из его TOC.
- [ ] `docs/05-api.md` заполнен: base URL, аутентификация, REST endpoints (метод/путь/payload/response/errors), формат ошибок.
- [ ] `docs/05-api.md` заполнен для WebSocket/SSE, если есть: URL, subprotocol, формат сообщений, heartbeat.
- [ ] `docs/07-types.md` — каталог DTO/типов с ссылками на источник (файл/строка upstream'а).
- [ ] `docs/11-known-gaps.md` обновлён: открытые вопросы и неоднозначности контракта.
- [ ] Ответы на «Открытые вопросы» из `11-known-gaps.md` вынесены пользователю (мультиплеер vs hot-seat, auth, сохранение партии) — там где upstream даёт ответ.

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
