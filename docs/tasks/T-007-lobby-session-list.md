---
id: T-007
title: Лобби — список открытых партий как афиши
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/types.ts
  - src/api/session-queries.ts
  - src/components/SessionCard.tsx
  - src/routes/Lobby.tsx
  - src/routes/Lobby.test.tsx
  - src/App.tsx
  - src/main.tsx
  - e2e/lobby.spec.ts
related_docs:
  - docs/05-api.md
  - docs/07-types.md
  - docs/04-components.md
tags: [ui, screen, lobby, sessions]
---

## Контекст

Второй настоящий экран. После регистрации пользователь должен видеть «афишу партий» — открытые для присоединения сессии. Backend endpoint: `GET /session?openToConnect=true&state=CREATED&page=0&pageSize=30` → `Page<SessionResponse>`.

Разбиваю на две задачи (Speed-first: PR ≤200 строк): T-007 — только чтение и отображение. Join-flow — T-008.

## Acceptance criteria

- [x] `src/api/types.ts` дополнен: `SessionResponse`, `SessionConfigResponse`, `RoundPrewResponse`, `TeamPrewResponse`, `Page<T>`.
- [x] `src/api/session-queries.ts` — `useOpenSessions()` (staleTime 10s, enabled только с токеном).
- [x] `SessionCard.tsx` — пергамент, монограмма ведущего, тип-подпись (FFA / Битва команд), устав в 3 колонки (мест / раундов / ставка), disabled CTA «Заявиться в партию» с title до T-008.
- [x] `Lobby.tsx` — header «Открытые партии», grid карточек, 4 skeletonа при loading, empty «Стол пуст» с печатью §, error «Стол не отвечает» с кнопкой «Постучать снова».
- [x] `/lobby` route + guard: нет token → `<Navigate to="/" />`.
- [x] `App.tsx` (logged-in) CTA «Открыть лобби» — Link на `/lobby`, ember-стиль.
- [x] Vitest 4/4: redirect / empty / success (2 карточки, Merlin, 2/4) / 500 error с retry-кнопкой.
- [x] E2E 2/2: unauthenticated redirect, authenticated register → lobby → header + terminal state.
- [x] Все проверки: typecheck ✅, vitest **22/22** ✅, lint ✅, e2e **7/7** ✅ (5.2 s), build не запускал явно, но typecheck+сама сборка ok.
- [x] `docs/04-components.md` дополнен SessionCard.
- [x] **Ad-hoc screenshot** через playwright снят и просмотрен: welcome-экран с ember-CTA + lobby с empty-state — оба держат стиль (пергамент/монограммы/brass-разделители).

## План

1. Дополнить types.ts недостающими Session-типами (из docs/07-types.md, минимально нужное).
2. `session-queries.ts` — useOpenSessions.
3. `SessionCard.tsx` — «афиша партии» (пергамент + монограмма + tabla).
4. `Lobby.tsx` — layout + все states.
5. Guard + route в main.tsx, кнопка в App.tsx.
6. Vitest на SessionCard + Lobby (loading/empty/success через `QueryClientProvider` c preloaded state).
7. E2E: расширить `register.spec.ts` — после регистрации кликнуть «Открыть лобби» и увидеть header.
8. Прогнать `pnpm test:e2e`, при провале — screenshot → фикс.
9. `/task-done`.

## Лог

- 2026-07-15: заведена, переведена в `in_progress`. Только чтение, без join'а.
- 2026-07-15: реализовано. Feedback-loop сработал: помимо unit/e2e ещё сделал ad-hoc screenshot через inline playwright-script (`snap-tmp.mjs`, потом удалил) — увидел welcome и lobby живьём, стиль держится. Backend вернул пустой список сессий (никто не создавал) — empty-state рендерится корректно с печатью §. `docs/07-types.md` не трогал: типы там расписаны шире, чем в `src/api/types.ts`, и это норма — src мы дополняем «по мере нужды», docs остаётся canonical'ом.
- 2026-07-15: переведена в `done`.
