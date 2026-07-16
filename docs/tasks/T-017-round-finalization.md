---
id: T-017
title: Round finalization — счёт после раунда + ADMIN next-round
status: done
priority: high
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/api/types.ts
  - src/api/session-queries.ts
  - src/api/ws/useSessionLiveSync.ts
  - src/routes/Session.tsx
related_docs:
  - docs/05-api.md
  - docs/07-types.md
tags: [gameplay, ws, stomp, score]
---

## Контекст

После `ALL_DECISIONS_RECEIVED` backend публикует `SessionScoreDto` в
`/topic/session/{id}/scoreUpdated` (кумулятивный счёт). ADMIN закрывает раунд
через SEND `/app/session/{id}/round.start` — либо стартует следующий раунд,
либо (если раундов не осталось) переводит session в FINISHED. Замыкает
gameplay-цикл: offer → decision → **score → next-round**.

## Acceptance criteria

- [x] Типы `SessionScoreDto`, `PlayerScore`, `TeamScore`.
- [x] `sessionKeys.score(id)` + `useSessionScore(id)` (staleTime: Infinity,
      initial `undefined`, только WS-путь).
- [x] `useSessionLiveSync` подписан на `scoreUpdated` → `setQueryData`.
- [x] `RoundResultPanel` в `Session.tsx`: таблица сортирована по score DESC,
      выделение текущего; ADMIN-кнопка меняет лейбл «Следующий раунд» ↔
      «Завершить партию» (isLastRound). ABORTED — отдельный fallback-текст.
- [x] Vitest 5 сценариев (render / not-admin / admin last / session finished / undefined).
      Total 49/49.
- [x] typecheck / lint / e2e 10/10 — зелёные.

## План

1. Types + query key/hook.
2. WS-подписка.
3. `RoundResultPanel` в Session.tsx.
4. Vitest.
5. Проверки → `/task-done`.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: реализовано. Плейсхолдер T-014+ в сообщении FINISHED заменён на
  реальную таблицу счёта. ABORTED-текст сохранён отдельным блоком. Score in-memory:
  refresh страницы посреди партии обнулит его — MVP-компромисс (REST endpoint'а нет).
