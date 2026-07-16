---
id: T-021
title: NPC — CRUD + attach в сессию + autoAdvanceRounds
status: done
priority: high
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/api/types.ts
  - src/api/npc-queries.ts
  - src/routes/Npc.tsx
  - src/routes/CreateSession.tsx
  - src/routes/Session.tsx
  - src/routes/Lobby.tsx
  - src/main.tsx
  - src/components/AddNpcPanel.tsx
  - e2e/npc.spec.ts
related_docs:
  - /Users/aleksandrpletnev/sandbox/ultimatum-game/frontend-integration/10-npc.md
tags: [frontend, npc, backend-integration, ui, admin]
---

## Контекст

Бэкенд полностью реализовал механизм NPC (боты со стратегиями FAIR/SELFISH/RANDOM/VENGEFUL/ADAPTIVE),
плюс новое поле `SessionConfig.autoAdvanceRounds` для авто-прогонки all-NPC сессий.
Спецификация — `frontend-integration/10-npc.md`. Ничего специфичного для NPC в WS-канале
нет: сервер шлёт те же `offerCreated`/`decisionMade`/`roundStatus`/`scoreUpdated`, что и
для живых игроков; фронт лишь получает их сериями (~<100ms) для all-NPC-режима.

Что просят от фронта (см. §Реализационный контракт):
1. UI CRUD NPC — форма со стратегией + динамическими параметрами, list + delete.
2. Чекбокс `autoAdvanceRounds` в форме учреждения партии.
3. В лобби сессии (state=CREATED) — кнопка «Добавить NPC» (существующий / bulk-новые).
4. Ничего специфичного в running-экране — WS работает как есть.

## Acceptance criteria

- [x] Типы `NpcStrategy`, `NpcParams` (sealed по `type`), `NpcProfileResponse`,
      `CreateNpcRequest`, `BulkNpcsRequest`, `BulkNpcsResponse`, `JoinNpcRequest`
      добавлены в `src/api/types.ts`. `SessionConfigRequest`/`Response` дополнен `autoAdvanceRounds?: boolean`.
- [x] `src/api/npc-queries.ts`: `useNpcList`, `useCreateNpc`, `useDeleteNpc`,
      `useJoinNpc(sessionId)`, `useBulkAttachNpcs(sessionId)`.
- [x] Route `/npc` (ADMIN only) — «Отряд ботов»: список + форма создания с
      strategy-селектором и dynamic-params по типу.
- [x] Линк «→ отряд ботов» в лобби, виден только ADMIN.
- [x] В `CreateSession.tsx` чекбокс «Автопрогон раундов».
- [x] В `Session.tsx` при `state=CREATED` и `myRole==='ведущий'` — панель «Позвать бота»
      с двумя режимами (готовый / наковать разом).
- [x] Ошибки backend'а разворачиваются через `ApiError.body?.message`.
- [x] Playwright e2e: 2 сценария — CRUD в кабинете + all-NPC autoAdvance-симуляция.
      Оба зелёные. Финальный `Завершить партию` — явный, autoAdvance закрывает только
      межраундные переходы (эмпирика; уточнено в тесте).
- [x] `pnpm typecheck` / `lint` / `test` (61/61) / `build` — зелёные.
      e2e: 13/13 (2 новых NPC + прежние).

## План

1. Типы и API-queries.
2. `autoAdvanceRounds` в CreateSession.
3. Route `/npc` + линк из Лобби.
4. Панель «Позвать бота» в Session.tsx (pre-start).
5. e2e (backend-required).
6. `/task-done` → commit + push.

## Лог

- 2026-07-16: заведена; спецификация в `frontend-integration/10-npc.md` изучена.
- 2026-07-16: реализовано. Типы + queries + `/npc` route + панель `AddNpcPanel` +
  `autoAdvanceRounds` в CreateSession. Наблюдение по autoAdvance: он не финализирует
  последний раунд — сервер оставляет round в `ALL_DECISIONS_RECEIVED`, а session в
  `RUNNING`. Финальное `Завершить партию` продолжает ждать явный клик admin'а (в
  спеке трактуется как «пока не дойдёт до numRounds» — интерпретация «включая
  последний» = false). Отражено в e2e-тесте.
