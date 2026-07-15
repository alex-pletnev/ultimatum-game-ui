---
id: T-009
title: Join сессии + заглушка экрана игры
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/types.ts
  - src/api/session-queries.ts
  - src/components/SessionCard.tsx
  - src/routes/Session.tsx
  - src/routes/Lobby.tsx
  - src/main.tsx
  - e2e/create-session.spec.ts
related_docs:
  - docs/05-api.md
tags: [ui, screen, sessions, join]
---

## Контекст

CTA «Заявиться в партию» в `SessionCard` до сих пор disabled. Теперь оживляем: PLAYER жмёт → `POST /session/{id}/join` → редирект на `/session/{id}` (заглушка). ADMIN своей партии — CTA «Перейти к столу», без join'а, сразу на экран. Реальная игровая механика (WS, offers, decisions) — в следующих задачах, но session-экран должен показывать что-то осмысленное.

Ограничение MVP: TEAM_BATTLE не поддерживается на клиенте — CTA «Битвы команд — скоро». OBSERVER (`join/observer`) — тоже позже.

## Acceptance criteria

- [x] `types.ts`: `SessionWithTeamsAndMembersResponse`, `TeamResponse` (с members).
- [x] `session-queries.ts`: `useJoinSession()` (POST /session/{id}/join, seedит details-cache при успехе), `useSessionDetails(id)` (GET .../with-teams-and-members, enabled только с id + токеном).
- [x] `SessionCard` принимает `currentUser: UserResponse \| undefined` (exactOptionalPropertyTypes) и ветвится: ADMIN своей партии → Link «Перейти к столу»; TEAM_BATTLE → disabled «Битвы команд — скоро»; иначе → кнопка «Заявиться в партию» c pending/error states (409 в alert).
- [x] `Session.tsx` (route `/session/:id`): header «У стола · роль {role}» + displayName + «← в лобби»; левый пергамент «За столом» со списком участников (admin sub «ведущий», players «играющий», observers «наблюдатель», MemberRow c WaxSeal); правый пергамент «Устав партии» (мест/раундов/ставка/тип); нижний пергамент-placeholder «Стол готов» с §-печатью. Loading пергамент-скелет, error «Стол не найден» с ссылкой в лобби.
- [x] Route `/session/:id` в `main.tsx`.
- [x] Ошибка 409 join'а → alert под кнопкой (blood-цвет, italic body).
- [x] Все тесты зелёные: typecheck ✅, vitest 28/28 ✅ (без regression'ов — Lobby теперь передаёт currentUser в SessionCard), lint ✅, e2e 9/9 ✅ (5.3 s). ADMIN happy-path расширен: после create кликаем «Перейти к столу» на своей карточке → session-экран → проверка «роль ведущий» + имя в списке.
- [x] `docs/04-components.md` — обновлённый SessionCard с описанием ветвления CTA.
- [x] **Ad-hoc screenshot**: session-экран (header «У СТОЛА · РОЛЬ ВЕДУЩИЙ», левый card со списком участников, правый — устав, нижний — placeholder «Стол готов»).

## Что не покрыто (сознательно)

- E2E: сценарий PLAYER-join (нужен two-context Playwright + предсозданная FFA-партия) — оставлено на позже.
- OBSERVER (`POST /session/{id}/join/observer`) — не поддержан.
- TEAM_BATTLE join (query-param teamId + выбор команды) — не поддержан.
- Leave/kick — backend endpoint отсутствует, UX-задача на потом.
- WS-подключение к `/topic/session/{id}/sessionStatus` — экран пока статичный, обновляется только через `useSessionDetails` при mount'е (T-010+ будет живой стрим).

## План

1. types + queries.
2. SessionCard — расширить пропсами, переписать CTA-логику.
3. `Session.tsx` — layout экрана.
4. Route.
5. Vitest обновить.
6. E2E: расширить `create-session.spec.ts` (после create — перейти в session-экран) + новый сценарий join.
7. `pnpm test:e2e` + screenshot session-экрана.
8. `/task-done`.

## Лог

- 2026-07-15: заведена, в `in_progress`. Первый экран, где backend возвращает сложную вложенную структуру.
- 2026-07-15: реализовано. Одна typecheck-ошибка на первом typecheck: `exactOptionalPropertyTypes: true` не позволил `currentUser?: UserResponse` — потребовал явного `| undefined`. Небольшой сюрприз со strict-mode TS, но правило хорошее (запрещает нечёткие optional). Всё сработало с первого раза: e2e 9/9 без правок, скриншот сессии показывает правильное состояние (роль ведущий, устав, placeholder). PLAYER-join сценарий сознательно оставил без e2e — требует two-context'ного playwright, будет отдельным ходом когда UI устоится.
- 2026-07-15: переведена в `done`.
