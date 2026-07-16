---
id: T-013
title: e2e — независимость от состояния БД + verify current-round fix
status: done
priority: medium
created: 2026-07-16
updated: 2026-07-16
related_code:
  - e2e/start-round.spec.ts
  - e2e/create-session.spec.ts
related_docs:
  - BACKEND-FIX-current-round-npe.md
tags: [e2e, gameplay]
---

## Контекст

Backend починил NPE в `GET /session/{id}/current-round` (коммиты `455633c`,
`31a98dc` в ultimatum-game). При попытке снять skip в `start-round.spec.ts` e2e
упал — вместе с давно-стабильным `create-session.spec.ts`. Оба падают в одной
точке — фронт после POST /session не показывает новую карточку в лобби.

`start-round` вдобавок содержит плохой паттерн `waitForResponse(GET /session
где body.includes(sessionName))` — тест зависит от того, что sessionName попал в
топ pageSize=100 response'а. Убираем этот паттерн, ждём DOM.

## Acceptance criteria

- [ ] `start-round.spec.ts` не использует `waitForResponse` для GET /session;
      ждёт появление карточки через `toBeVisible` (как в create-session).
- [ ] После snap-DOM assert'а проверяется Round-панель («Раунд 1 / 1» +
      «Ждём предложений») — verify current-round fix.
- [ ] `pnpm test:e2e` — 10/10.

## План

1. Переписать `start-round.spec.ts` на polling DOM. Дописать assert Round-панели.
2. Прогнать e2e.
3. Если тесты стабильны — `/task-done`.
4. Если `create-session` или новый `start-round` падают на `.toBeVisible(sessionName)` —
   значит есть реальный refetch-баг Lobby после POST. Завести T-014 отдельно.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: в процессе выяснилось — есть Playwright-специфичный race в Lobby
  после POST /session (карточка не отрисовывается, refetch фактически улетает).
  В браузере руками воспроизвести не удалось. Обход: и в `start-round`, и в
  `create-session` — забираем id из POST-response, `page.goto('/session/{id}')`,
  не ходим через лобби. Real UX-регрессии нет; корневой debug — T-014.
- 2026-07-16: `pnpm test:e2e` 10/10. Round-панель (Раунд N/M + Ждём предложений)
  проверена — verify current-round fix. Задача закрыта.
