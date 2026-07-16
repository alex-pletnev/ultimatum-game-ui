---
id: T-015
title: Offer flow — форма отправки оффера в фазе WAIT_OFFERS
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
tags: [gameplay, ws, stomp, offer]
---

## Контекст

Раунд в фазе WAIT_OFFERS запущен — каждый player должен отправить оффер
(`/app/session/{id}/offer.create {amount}`, `amount ∈ [0, roundSum]`). После
успешной отправки backend бродкастит `offerCreated`; когда собрал все —
переход в `ALL_OFFERS_RECEIVED`. Первая часть основного gameplay-цикла.

## Acceptance criteria

- [x] Тип `CreateOfferCmd = { amount: number }` + `OfferCreatedResponse` в `src/api/types.ts`.
- [x] `useSessionLiveSync` подписан на `/topic/session/{id}/offerCreated` →
      invalidate currentRound.
- [x] В `Session.tsx` при `state=RUNNING`, `phase=WAIT_OFFERS`, `myRole !== NONE`:
  - если `myPendingActions` содержит SEND_OFFER — слайдер `0..roundSum` +
    кнопка «Огласить сделку»;
  - если оффер уже отправлен — «Твоё предложение занесено. Собрано N/M».
- [x] typecheck / lint / vitest 39/39 / e2e 10/10 — зелёные.

## План

1. Types.
2. WS subscription.
3. Offer-панель в Session.tsx (новый компонент `OfferPhasePanel`).
4. Проверки: `pnpm typecheck`, `pnpm lint`, `pnpm test`.
5. `/task-done`.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: реализовано. Manual smoke не делал — панель показывается только
  для myRole !== NONE (admin-observer её не видит), для ручной проверки нужен
  ещё один игрок-member. E2E для этого сценария появится в T-016/T-017 когда
  начнём тестировать полный gameplay через два браузерных контекста.
