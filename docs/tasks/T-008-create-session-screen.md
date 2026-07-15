---
id: T-008
title: Экран учреждения партии (ADMIN → POST /session)
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/types.ts
  - src/api/session-queries.ts
  - src/components/NumberStepper.tsx
  - src/routes/CreateSession.tsx
  - src/routes/CreateSession.test.tsx
  - src/routes/Lobby.tsx
  - src/routes/Lobby.test.tsx
  - src/main.tsx
  - e2e/create-session.spec.ts
  - e2e/lobby.spec.ts
related_docs:
  - docs/05-api.md
  - docs/07-types.md
tags: [ui, screen, sessions, admin]
---

## Контекст

Без create-экрана лобби всегда пусто, и join (T-009) некуда подключаться. Форма только для ADMIN — PLAYER и OBSERVER её не видят. Endpoint: `POST /session` с телом `CreateSessionRequest`.

MVP-scope полей (Speed-first, upper-bound 200 LOC):
- displayName (3..100)
- sessionType radio FFA / TEAM
- numRounds (1..10), default 3
- numPlayers (2..8 в UI, backend до 120), default 4
- numTeams — 0 для FFA, 2..3 для TEAM
- roundSum (10..1000 в UI), default 100
- timeoutMoveSec — не в UI, фиксированный default 60 (обсудим позже)

## Acceptance criteria

- [x] `types.ts`: `SessionConfigRequest`, `CreateSessionRequest` (без `SessionWithTeamsAndMembersResponse` — reuse `SessionResponse` в `useCreateSession`).
- [x] `session-queries.ts`: `useCreateSession()` mutation, при успехе invalidate `sessionKeys.openLobby`.
- [x] `NumberStepper.tsx` — aria-spinbutton, − / +, min/max, hint, hover ember. Не native `<input type="number">` (mobile UX).
- [x] `CreateSession.tsx` — ADMIN-only guard (redirect на `/lobby`), пергамент, тиснёный титул, InkField, sessionType-radio, stepper'ы (numRounds/numPlayers/roundSum + numTeams conditional для TEAM_BATTLE), ember-кнопка, 400/5xx alert.
- [x] Route `/lobby/new` в `main.tsx`.
- [x] Lobby CTA «Учредить партию» видима только для ADMIN.
- [x] Vitest 4/4 CreateSession: guard PLAYER→lobby / guard no-token→home / ADMIN submit c правильным body / numTeams stepper только для TEAM_BATTLE. Lobby-тестов теперь 6 (добавлены ADMIN CTA visible + PLAYER CTA hidden).
- [x] E2E 2/2 create-session: PLAYER не видит CTA / ADMIN happy path (регистрация → лобби → форма → редирект → новая карточка с ведущим). Существующий lobby-тест обновлён под «skeleton'ы исчезли» вместо `.or()` (strict-mode ломался когда карточки появились в реальном backend'е).
- [x] Все проверки зелёные: typecheck ✅, vitest **28/28** ✅, lint ✅, e2e **9/9** ✅ (6.0 s).
- [x] `docs/04-components.md` — NumberStepper + правка SessionCard-упоминания (T-009 вместо T-008 для join).
- [x] **Ad-hoc screenshot** через playwright — форма учреждения (пергамент, печать A, 3 stepper'а, ember-кнопка) и лобби с 3 реальными карточками-афишами (ADMIN CTA сверху, монограммы, устав в 3 колонки).

## План

1. Дополнить `types.ts`.
2. `useCreateSession` в `session-queries.ts`.
3. `NumberStepper.tsx` — общий примитив.
4. `CreateSession.tsx` — layout + guard.
5. `Lobby.tsx` — conditional CTA для ADMIN.
6. Route в `main.tsx`.
7. Vitest.
8. E2E расширить.
9. `pnpm test:e2e` + при провале — screenshot → фикс.
10. Ad-hoc screenshot формы и лобби с созданной партией — проверить визуал.
11. `/task-done`.

## Лог

- 2026-07-15: заведена, в `in_progress`. Split-стратегия: только create; join → T-009.
- 2026-07-15: реализовано. Заметки: (1) сначала неправильно указал импорт из несуществующего `session-queries-hooks` — typecheck поймал сразу; (2) обновление Lobby (теперь дёргает `useCurrentUser`) сломало 2 старых Vitest-теста, где mocked fetch отдавал только один response — переделал mocks на URL-роутинг; (3) новый create-session тест наполнил лобби реально, и старый e2e `lobby > authenticated` с `.or()` упал в strict-mode — переписал на «дождаться исчезновения skeleton'ов». Feedback-loop сработал каждый раз — pnpm test / test:e2e поймали → правил → зелёное. Screenshots через playwright не пришлось генерировать при провалах (все были в text-level логике), но снял в конце для sanity-check.
- 2026-07-15: переведена в `done`.
