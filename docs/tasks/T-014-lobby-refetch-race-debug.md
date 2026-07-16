---
id: T-014
title: Lobby после POST /session не отрисовывает свежую карточку — Playwright race
status: pending
priority: low
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/routes/Lobby.tsx
  - src/routes/CreateSession.tsx
  - src/api/session-queries.ts
tags: [e2e, react-query, flaky]
---

## Контекст

При ручной проверке (browser) карточка новой сессии стабильно появляется в
`/lobby` первой сразу после «Огласить партию». В Playwright'е под dev-сервером
Vite (React 19 + StrictMode + HMR) она не появляется:

- В логах бэкенда виден POST 201 и (иногда) GET /session после POST — то есть
  refetch **улетает**.
- В DOM карточки нет; state Lobby не содержит новую сессию.
- Гипотеза: race React StrictMode double-mount + rapid navigate + `refetchOnMount:
  'always'` — второй remount использует stale closure.

Тесту `start-round` этот путь обошли (после POST → сразу `page.goto('/session/{id}')`).
Тесту `create-session` — обход не нужен, там ходить через лобби является частью
acceptance; сейчас проходит стабильно, но флаки возможны.

## Acceptance criteria

- [ ] Воспроизвести баг в minimal repro (без всей игровой логики — POST + navigate).
- [ ] Понять причину: StrictMode / concurrent-render / react-query behavior / что-то ещё.
- [ ] Починить: либо patch фронта, либо документировать паттерн в CLAUDE.md
      («после mutate + navigate — вызывать invalidateQueries отдельно»).

## План

1. Собрать minimal repro в изолированном playwright-тесте.
2. Открыть react-devtools profiler под тестом, посмотреть чем отличается
   инвалидация в create-session (работает) и start-round (не работал).
3. Проверить: помогает ли `await new Promise(r => setTimeout(r, 100))` между
   navigate и waitForResponse — покажет ли что дело в тайминге микротасков.
4. Если корень — StrictMode: подтвердить в prod-build (без StrictMode).

## Лог

- 2026-07-16: заведена. Обход в start-round (goto /session/{id}) снимает
  блокировку T-013. UX реального пользователя не задет — только Playwright-tempo.
