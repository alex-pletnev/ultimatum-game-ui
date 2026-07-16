---
id: T-016
title: Decision flow — accept/reject assigned offer в фазе OFFERS_SENT
status: done
priority: high
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/api/types.ts
  - src/api/ws/useSessionLiveSync.ts
  - src/routes/Session.tsx
related_docs:
  - docs/05-api.md
  - docs/07-types.md
tags: [gameplay, ws, stomp, decision]
---

## Контекст

После WAIT_OFFERS бэкенд shuffles офферы и переходит в `OFFERS_SENT`. Каждый
responder видит назначенный оффер (по `myPendingActions[i].offerId` → `round.offers`
по id) и должен ответить accept/reject: SEND `/app/session/{id}/make.decision`
`{offerId, decision: bool}`. Когда собраны все решения → `ALL_DECISIONS_RECEIVED`.

Без подписки на персональный topic `/player/{userId}/offer` — вся информация уже
есть в `round.offers` + `round.myPendingActions` после invalidate currentRound.
Broadcasts `offersShuffled` и `decisionMade` — только триггеры инвалидации.

## Acceptance criteria

- [x] Типы: `MakeDecisionCmd`, `DecisionMadeResponse`, `OffersShuffledResponse`.
- [x] `useSessionLiveSync`: подписки на `decisionMade` + `offersShuffled` →
      invalidate currentRound. Заодно унифицировали `onOfferCreated → invalidateRound`.
- [x] `DecisionPhasePanel` в `Session.tsx`: карточка оффера + accept/reject
      (verdigris / blood кнопки в стиле настолки), либо waiting c progress.
- [x] Vitest 5 сценариев (OfferPhasePanel×2 + DecisionPhasePanel×3). Total 44/44.
- [x] typecheck / lint / e2e 10/10 — зелёные.

## План

1. Types.
2. WS subs.
3. DecisionPhasePanel в Session.tsx.
4. Vitest.
5. Проверки → `/task-done`.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: реализовано. Персональный topic `/player/{userId}/offer` пропущен —
  всей нужной информации (offer.id/value/proposer + myPendingActions с offerId)
  достаточно из invalidate currentRound. Меньше подписок — меньше моек.
  Manual smoke невозможен без второго игрока-member (заведём в T-017 при
  round-finalization + первый full gameplay e2e через 2 браузерных контекста).
