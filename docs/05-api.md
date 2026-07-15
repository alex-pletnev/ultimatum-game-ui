# 05. API contract

Плейсхолдер до T-001: **«Изучить `frontend-integration/` в upstream и заполнить этот файл»**.

## Источник истины

<https://github.com/alex-pletnev/ultimatum-game/tree/main/frontend-integration>

Пользователь: «читай README, там TOC» — стартовать оттуда.

## Что нужно вытащить (чек-лист T-001)

- [ ] Base URL (для локального dev и для потенциального прода).
- [ ] Аутентификация / идентификация игрока (JWT? cookie? nickname?).
- [ ] REST endpoints — таблица «метод, путь, payload, response, ошибки».
- [ ] WebSocket / SSE — URL, subprotocol, формат сообщений, heartbeat.
- [ ] Формат ошибок (JSON-структура, коды).
- [ ] Версионирование API (если есть).
- [ ] Rate limits / ограничения.
- [ ] Как поднять backend локально для отладки фронта.

## REST endpoints

_(заполнить после T-001)_

| Метод | Путь | Назначение | Body | Response | Errors |
|-------|------|------------|------|----------|--------|

## WebSocket / realtime

_(заполнить после T-001)_

| Событие | Направление | Payload | Триггер |
|---------|-------------|---------|---------|

## DTO / types

См. `07-types.md`.
