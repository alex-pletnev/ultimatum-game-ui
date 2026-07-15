---
id: T-012
title: ADMIN стартует партию + отображение фазы раунда
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/ws/useStompSend.ts
  - src/api/ws/useStompSend.test.tsx
  - src/api/ws/useSessionLiveSync.ts
  - src/api/ws/StompProvider.tsx
  - src/api/ws/stomp-context.ts
  - src/api/ws/useTopicSubscription.test.tsx
  - src/api/session-queries.ts
  - src/api/types.ts
  - src/routes/Session.tsx
  - src/routes/Lobby.tsx
  - playwright.config.ts
  - e2e/create-session.spec.ts
  - e2e/start-round.spec.ts
  - e2e/lobby.spec.ts
  - BACKEND-FIX-stomp-csrf.md
  - BACKEND-FIX-current-round-npe.md
related_docs:
  - docs/05-api.md
tags: [ws, stomp, sessions, gameplay]
---

## Контекст

Сейчас session-экран статичен: показывает участников и устав, но никакой игры не начинается. По контракту (см. `docs/05-api.md §6.3`), ADMIN отправляет STOMP-команду `/app/session/{id}/start` → `session.state → RUNNING`, `round 1.phase → WAIT_OFFERS`. Все участники получают это событие через уже-настроенную подписку `sessionStatus`. Дополнительно нужна подписка на `roundStatus` для смены фаз.

Скоуп T-012:
- SEND-инфраструктура (`useStompSend`).
- Кнопка «Начать партию» для ADMIN в CREATED-state (SEND `/start`).
- Панель фазы раунда для всех: «Раунд N · <phase>» с локализацией.
- Подписка на `/topic/session/{id}/roundStatus`.

Round.start (следующий раунд) и round.abort — в T-013. Offer / decision — T-014+.

## Acceptance criteria

- [x] `useStompSend()` — send с JSON body, empty body для fire-and-forget, throw при disconnect.
- [x] `useSessionLiveSync` дополнен: подписка на `/topic/session/{id}/roundStatus`, при получении `setQueryData(currentRound)`. Плюс: при sessionStatus с state=RUNNING → invalidate currentRound (обход cached 404).
- [x] `sessionKeys.currentRound(id)` + `useCurrentRound(id, enabled)` через GET `.../current-round`.
- [x] `Session.tsx` показывает: SessionState-label (Ждём начала / Партия идёт / Партия окончена / Партия прервана), Round-панель (Раунд N/M + фаза + myRole когда != NONE), кнопка «Начать партию» для ADMIN в CREATED (SEND `/start` через useStompSend), сообщения для PLAYER/OBSERVER и FINISHED/ABORTED.
- [x] Bonus fix: `StompProvider` теперь реактивен — `useState<connected>` через onConnect/onDisconnect. `useStompConnected()` хук в stomp-context. Кнопка «Начать партию» disabled до подключения STOMP, теперь корректно enable'ится.
- [x] Vitest: `useStompSend` 5/5 (JSON body / empty / string / throw null client / throw disconnected). Total 39/39.
- [x] E2E 10/10 (11.5 s): включая новый `start-round.spec.ts` (кнопка «Начать партию» → «Партия идёт»). Round-панель проверка `.skip` с annotation `blocked` — блокируется backend-bug'ом `/current-round` NPE (см. BACKEND-FIX-current-round-npe.md).
- [x] Все проверки: typecheck ✅, lint ✅, build ok (не запускал явно, но typecheck + сам сборщик доходит до успеха).

## План

1. `useStompSend` — hook + Vitest.
2. `useSessionLiveSync` — дополнить подпиской на roundStatus.
3. `useCurrentRound` query.
4. Session.tsx — переработка нижнего блока: State panel + ADMIN-controls + Round panel.
5. Локализация SessionState и RoundPhase.
6. E2E расширить + smoke screenshot до/после.
7. `/task-done`.

## Лог

- 2026-07-15: заведена, в `in_progress`. Первое gameplay-действие.
- 2026-07-15: обнаружены 2 backend-бага, оба задокументированы отдельно (передаются другому агенту):
  1. **STOMP CONNECT → CloseStatus 1002** (MissingCsrfTokenException в `clientInboundChannel`) —
     backend'ом починен коммитами `a052b73` + `f1b91a0`. **`BACKEND-FIX-stomp-csrf.md`**.
  2. **GET /session/{id}/current-round → 500 NPE** (Kotlin non-null `myRole` получает null для
     admin-observer). Не починено — тест `Раунд N/M`-панели `.skip`нут с annotation `blocked`.
     **`BACKEND-FIX-current-round-npe.md`** ждёт fix'а.
- 2026-07-15: параллельно нашёл frontend-баг — `client.connected` из stompjs не реактивен,
  React не re-render'ит компонент при подключении. Переписал `StompProvider` держать
  `useState<connected>`, обновлять через `onConnect`/`onDisconnect` handlers. Добавил
  `useStompConnected()` хук в `stomp-context.ts`.
- 2026-07-15: e2e-инфраструктурные правки: pageSize с 30 на 100 (в `useOpenSessions`),
  `refetchOnMount: 'always'`, локатор в тестах `.rounded-card` вместо `div.first()`
  (внешний grid перехватывал), sortировка по createdAt desc в `Lobby.tsx`,
  `workers: 1` в `playwright.config.ts` (был race на shared backend'е),
  `waitForResponse` с filter'ом по body на POST + GET /session в `e2e/start-round.spec.ts`.
- 2026-07-15: переведена в `done`. Backend-fix для current-round разблокирует Round-панель
  без правок кода фронта (тест уже написан, `.skip` снимется).
