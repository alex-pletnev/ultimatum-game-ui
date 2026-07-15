---
id: T-010
title: WS live-sync — состав партии обновляется реалтайм
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/ws/useTopicSubscription.ts
  - src/api/ws/useTopicSubscription.test.tsx
  - src/api/ws/useSessionLiveSync.ts
  - src/routes/Session.tsx
related_docs:
  - docs/05-api.md
tags: [ws, stomp, sessions, realtime]
---

## Контекст

Сейчас `/session/:id` статичен: `useSessionDetails` дёргает `GET .../with-teams-and-members` при mount'е и обновляется только через staleTime/refetch. Backend умеет push'ить обновления через STOMP `/topic/session/{id}/sessionStatus` (payload — `SessionWithTeamsAndMembersResponse`, событие — join/start/close/open/abort). Оживляем состав.

Скоуп T-010 — только sessionStatus. offerCreated/decisionMade/scoreUpdated — в T-011 (игровая механика).

## Acceptance criteria

- [x] `useTopicSubscription<T>(destination, onMessage)`: подписывается только при `client.connected`, оборачивает подписку в try/catch на JSON.parse, unsubscribe в cleanup, поддерживает `destination = null` (не подписываемся).
- [x] `useSessionLiveSync(id)`: подписка на `/topic/session/{id}/sessionStatus`, при получении — `queryClient.setQueryData(sessionKeys.details(id), payload)`. Возвращает `{ connected }` для UI-индикатора.
- [x] `Session.tsx` вызывает `useSessionLiveSync(id)` рядом с `useSessionDetails(id)`; изменения в cache видны в UI автоматически.
- [x] Live-индикатор: verdigris-точка (2×2 px) рядом с «У стола · роль {myRole}» при `connected`, brass-полупрозрачная — иначе. `aria-label` и `title` для доступности.
- [x] Vitest 6/6 на `useTopicSubscription`: subscribes when connected / no-op when client null / no-op when destination null / forwards parsed payload / no-crash on malformed JSON / unsubscribes on unmount.
- [x] Все проверки: typecheck ✅, vitest **34/34** ✅ (без regression'ов), lint ✅, e2e **9/9** ✅ (6.8 s).
- [x] Ad-hoc screenshot: session-экран через 2.5 с после захода — verdigris-точка присутствует справа от роли (STOMP connected).

## План

1. `useTopicSubscription` — generic hook, subscribe при активном client.connected + смене deps.
2. `useSessionLiveSync` — обёртка + setQueryData.
3. Session-компонент интегрирует hook, добавляет индикатор.
4. Vitest на useTopicSubscription.
5. Ad-hoc screenshot.
6. `/task-done`.

## Лог

- 2026-07-15: заведена, в `in_progress`. Первая реальная WS-интеграция.
- 2026-07-15: реализовано. Первая STOMP-подписка живьём — verdigris-точка на скриншоте подтверждает handshake. Тестировать `useTopicSubscription` было приятно: чистый unit-hook с mocked `Client`, 6 сценариев без mount'а browser'а. E2E не расширил (WS-realtime сложен для детерминированных тестов, требует two-context'ного playwright), оставил на ручную проверку через инкогнито. Переведена в `done`.
