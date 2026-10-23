# Product expansion Implementation Plan

> Исполнение: superpowers:executing-plans, самостоятельно. Пользователь поручил принимать решения и выполнять без промежуточных согласований. Финальное независимое ревью всей правки.

**Goal:** по публичной ссылке доступны обучение, одиночная и совместная игра, экспериментальный режим и понятный разбор результатов.
**Architecture:** React/TanStack/Recharts и Spring/PostgreSQL сохраняются. Same-origin HTTPS proxy; отдельные контейнеры и volume. Существующие сервисы получают сценарии, права определяются владельцем партии.
**Tech Stack:** React 19, TypeScript, Kotlin/JDK21, Spring Boot, PostgreSQL17, Caddy2, Docker Compose.
**Spec:** ../../tasks/T-026-product-expansion.md; backend T-108.

## Constraints

Русский интерфейс и документация; английские новые идентификаторы/комментарии. Не менять чужие приложения/данные. Не переносить тестовую БД в публичную среду. Секреты вне Git. Старый API сохраняет defaults. Рабочие изменения в текущих main по workflow проекта.

## Review focus

Два одновременных хода; чужой пользователь пытается управлять игрой; ведущий играет и управляет; режим без отказов не зависает; фильтры не искажают знаменатели и счёт.

### 1. Размещение

- [x] Backend deploy/compose.server.yml и Dockerfile.runtime: PostgreSQL, API, web, persistent volume, restart/health, частная сеть.
- [x] Vite VITE_BASE_PATH и same-origin config для отдельного сайта; внешний Caddy virtual host.
- [x] Проверка Compose, HTTPS, REST и WebSocket; README запуска/backup/redeploy.

### 2. Backend сценарии и права

- [x] RED: host participation, foreign host denied, history ownership, solo/rematch, automatic dictator decisions.
- [x] SessionAccess (владелец), PLAYER create/host permissions в REST/STOMP; hostPlays в CreateSessionRequest; start invariants и lock gameplay mutations.
- [x] SessionType.DICTATOR, Flyway check constraint, mappers/type consumers; автоматические решения в NpcService.
- [x] POST /session/solo (strategy, sessionType, numRounds), POST /session/{id}/rematch, GET /session/mine (page/pageSize).
- [x] GREEN: focused tests, full gradle check, миграция на отдельной PostgreSQL.

### 3. Сценарии frontend и руководство

- [x] Тесты: solo launch, scenario config/host participation, history, guide navigation.
- [x] /play, /history, /guide; сценарии CreateSession; доступ к ведению игры без смены профиля; host/player панели и режим без решений; реванш.
- [x] Обновить Rules, Register, Lobby и навигацию; контекстная помощь и честные empty/error states.
- [x] GREEN: Vitest и проверки TS/lint.

### 4. Аналитика

- [x] Тесты: cumulative scores, lost coins, filters (pending/rejected/accepted), no-data.
- [x] Stats insights/filters, cumulative chart, per-round losses, personal metrics, доступные подписи/таблица/экспорт.
- [x] GREEN: unit; E2E solo+dictator+history+rematch+ownership и mobile charts.

### 5. Проверка и публикация

- [x] Все unit, typecheck, lint, build, backend check, E2E; review и исправления с регрессиями.
- [x] Обновление временного сервера и HTTPS smoke. Документация/трекеры, diff, commits/push. Старая YC выкладка не запускается.

Проверки и эксплуатационные ограничения зафиксированы в T-026 и backend T-108.
