---
id: T-018
title: Full gameplay e2e — 3 контекста (admin + 2 player) через полный раунд
status: done
priority: high
created: 2026-07-16
updated: 2026-07-16
related_code:
  - e2e/utils.ts
  - e2e/full-gameplay.spec.ts
tags: [e2e, gameplay, regression]
---

## Контекст

Реализованный gameplay (T-015..T-017) сейчас покрыт unit'ами и smoke-тестом до
«Партия идёт». Реальный полный цикл (offer + decision × N players → score →
next-round) не проверяется. Заводим первый full-flow regression-тест через
Playwright с тремя изолированными browser context'ами.

## Acceptance criteria

- [x] `e2e/utils.ts`: helpers `apiRegister`, `apiCreateSession`, `apiJoin`,
      `openContextWithToken` (isolated context + preload token).
- [x] `e2e/full-gameplay.spec.ts`: тест админ + 2 player, доходит до «Табло очков»
      и проверяет что оба ника видны на нём.
- [x] Sole-run стабильный (2.1s, `pnpm exec playwright test full-gameplay`).
- [ ] Full-suite стабильный: **flaky при большой нагрузке** — see Лог, T-019.
- [x] Побочно: `useSessionLiveSync.onRoundStatus` теперь invalidate вместо
      merge с prev.myRole (WS-payload содержит myRole=NONE, «сохранить prev»
      ломает first-mount → REST-fetch надёжнее). Совместно с проверкой членства
      через `session.members` вместо `round.myRole` — гарантирует показ панелей.
- [x] typecheck / lint / vitest — зелёные.

## План

1. Helpers в utils.ts.
2. Spec: последовательно, с явными waitFor.
3. Прогон, устранение fla­к'ов (Promise.all с waitForResponse если нужно).
4. `/task-done`.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: реализовано. По пути обнаружили и починили 2 фронт-бага:
  1) `onRoundStatus.setQueryData(prev.myRole ?? payload.myRole)` при первом
     mount'е сохраняет NONE навсегда → инвалидируем и triggerим REST-fetch.
  2) Условие показа OfferPanel/DecisionPanel было привязано к `round.myRole`
     (backend отдаёт NONE в некоторых сценариях) — заменили на проверку
     членства через `session.members` (myRole === 'играющий'), backend-friendly.
- 2026-07-16: full-suite (10+1) flaky — при большой нагрузке (~40 CREATED
  sessions + WS-flood от старых вкладок ExpiredJwt) backend возвращает
  POST /session → 500. Sole-run стабилен. Побочный load-issue backend'а, не
  UX. Отдельный follow-up — T-019 (или merge с T-014).
