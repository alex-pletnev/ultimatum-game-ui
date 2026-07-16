---
id: T-020
title: Страница статистики — сырые + агрегированные + графики
status: done
priority: high
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/routes/Stats.tsx
  - src/api/stats-queries.ts
  - src/api/csv.ts
  - src/main.tsx
  - src/routes/Session.tsx
related_docs:
  - docs/05-api.md
tags: [stats, charts, gameplay, ui, backend-integration]
---

## Контекст

Одна из самых важных страниц: игрок должен видеть, как пошла партия, какие
стратегии работали. Backend отдаёт весь материал одним endpoint'ом:

```
GET /statistics/{sessionId}/csv  → text/plain, CSV
колонки: offerId, roundNumber, amount, proposerId, proposerNickname,
         responderId, responderNickname, accepted, timestamp
```

Одна строка = один оффер + его decision (если сделан). Всё что нужно для
любой аналитики выводится из этой таблицы.

## Дизайн

Иммерсивная настолка — не типовой dashboard. Три уровня:

1. **«Итоги партии»** (top): 4-6 карточек-табличек в стиле старой ведомости:
   средний оффер, % принятых, самый щедрый, самый жадный, всего раундов,
   всего офферов. Font-display, тёплые акценты.
2. **«Игрок за игроком»**: leaderboard с per-player разбором — total score,
   среднее что предлагал (as proposer), % принятых от него (as responder).
3. **Визуалы** (3 графика, recharts):
   - **Гистограмма offer-amount**: столбцы по бинам 0-10, 10-20, …, 90-100
     от `roundSum`. С разбивкой accepted (verdigris) / rejected (blood).
   - **Timeline** — раунд → средний offer, линия. Показывает, как менялась
     стратегия к концу партии.
   - **Scatter** — amount × responder → цвет=decision. Даёт визуальную
     «границу принятия».
4. **«Летопись сделок»** (bottom): raw-таблица всех строк CSV с фильтром
   по игроку, sort по столбцам. Fallback для тех, кто хочет цифры.

## Acceptance criteria

- [x] `pnpm add recharts` (recharts 3.9.2).
- [x] `src/api/csv.ts`: минимальный CSV-parser (RFC 4180 lite: quotes, escape),
      5 unit-тестов.
- [x] `src/api/stats-queries.ts`: `useSessionStats(id)` → распарсенный
      массив `StatsRow[]` с типизацией.
- [x] Route `/session/:id/stats` — компонент `Stats.tsx`.
- [x] Link «летопись →» из Session.tsx (виден когда `state !== CREATED`).
- [x] «Итоги партии» — 6 summary-карточек (раундов, офферов, средний,
      %принято, щедрейший, скупейший).
- [x] «Игрок за игроком» — leaderboard с per-player разбором.
- [x] 3 графика в палитре настолки (ember/verdigris/blood/brass):
      histogram (accepted/rejected/pending stacked), timeline (avg offer +
      %accept), scatter (amount×round, colored by decision).
- [x] Raw-таблица: sortable по 5 колонкам, filterable по нику.
- [x] Пустое состояние + error-state.
- [x] Aggregations вынесены в `Stats.aggregations.ts` (7 unit-тестов).
- [x] typecheck / lint / test 61/61 / build ok — зелёные.

## План

1. Установка recharts + csv-parser + fetching hook.
2. Skeleton страницы: header + пустое состояние.
3. Summary cards.
4. Leaderboard.
5. Гистограмма.
6. Timeline.
7. Scatter.
8. Raw table.
9. Unit tests на aggregations (важно — они easy break'аются при изменении).
10. Проверки → `/task-done`.

## Лог

- 2026-07-16: заведена, скоуп зафиксирован.
- 2026-07-16: реализовано. 12 unit-тестов (5 CSV + 7 aggregations); total 61/61.
  Bundle 768 KB (recharts тяжёлый) — приемлемо для MVP, при необходимости
  split'ить lazy-import'ом `/stats`. Manual smoke заблокирован backend-багом
  `auto_advance_rounds`-column (см. `BACKEND-FIX-session-column-missing.md`) —
  GET /statistics/{id}/csv тоже загружает session-entity и падает 500. Стандарт
  устройства страницы проверен через unit-тесты aggregations.
