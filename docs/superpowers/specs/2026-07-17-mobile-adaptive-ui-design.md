# Mobile-adaptive UI — design spec

**Дата:** 2026-07-17
**Автор:** Claude (Auto-mode, брейнсторм с пользователем)
**Задача-owner:** T-024 (заведётся в следующем шаге)

## Проблема

Пользователь на iPhone: **на всех экранах нужна горизонтальная прокрутка**, играть/регистрироваться неудобно. Подтверждено на Register и Lobby, остальные экраны в такой же архитектурной ситуации → предположительно ломаются тем же паттерном.

Корень проблемы (из чтения кода):

- Route-обёртки используют фиксированный `px-8 py-16` — 32px × 2 паддинга съедают ощутимую долю ширины на 375–430px iPhone-viewport'ах.
- Большие заголовки (`text-5xl`, `text-4xl`) и `tracking-[0.4em]` на длинных Cyrillic-строках подходят близко к краю или переливаются.
- CTA-кнопки с `px-8 tracking-[0.24em]` — на мобиле пух paddings + широкие интервалы.
- Многоколоночные `grid-cols-2/3/4` без mobile-breakpoint (иногда есть `md:`, но не всегда).
- Отсутствие touch-target guarantee (`min-h-11` = 44px iOS HIG).
- Нет safety-guard `overflow-x-hidden` — если один элемент пробьёт viewport, скроллится вся страница.

## Скоуп

**In-scope:**

1. **A — Portrait 375–430px, все текущие route'ы**: убрать horizontal scroll, читаемые шрифты, тач-таргеты ≥44px на всех интерактивных элементах.
2. **B — Session gameplay**: панель раунда, offer/decision UI, score-таблица, «Устав партии»-грид, header'ы — играбельно в портрете, а не «поверни телефон».
3. **C — Stats + Recharts**: графики не выпирают за viewport (`ResponsiveContainer` уже есть — проверить и подкрутить `margin`); Leaderboard-таблица оборачивается в горизонтальный scroll-контейнер, не тянет страницу.

**Out-of-scope:**

- Landscape-оптимизация (отдельный таск при необходимости).
- Tablet-specific tuning (базовый responsive Tailwind покрывает).
- Android-specific quirks (WebKit/iOS-first приоритет).
- Redesign — только адаптивные правки, без переработки UX.

## Подход — inline responsive classes (mobile-first)

Пройтись по route-обёрткам и компонентам, заменить фиксированные Tailwind-утилиты на mobile-first breakpoint'ы (`base sm: md:`).

**Rationale.** Проект вайб-кодовый, экраны сформировались; extraction в `<PageShell>` / `<CTAButton>` — overkill для MVP и рискует задеть motion/press-tactile анимации. Возможна будущая рефакторинг, но не сейчас.

## Правила замены (design tokens)

Применяются ко всем route'ам и разделяемым компонентам.

### Route-обёртки

| Было | Стало |
|------|-------|
| `mx-auto max-w-* px-8 py-16` | `mx-auto max-w-* px-4 sm:px-8 py-10 sm:py-16` |
| `<main ... px-6 py-16>` | `<main ... px-4 sm:px-6 py-10 sm:py-16>` |

### Заголовки и tracking

| Было | Стало |
|------|-------|
| `text-5xl` (title-scale) | `text-4xl sm:text-5xl` |
| `text-4xl` (subtitle-scale) | `text-3xl sm:text-4xl` |
| `text-3xl` (H2-scale) | `text-2xl sm:text-3xl` |
| `tracking-[0.4em]` (subtitle-caps) | `tracking-[0.3em] sm:tracking-[0.4em]` |
| `tracking-[0.35em]` (section-caps) | `tracking-[0.25em] sm:tracking-[0.35em]` |
| `tracking-[0.24em]` (button-caps) | `tracking-[0.2em] sm:tracking-[0.24em]` |

### CTA-кнопки

| Было | Стало |
|------|-------|
| `px-8 py-3 font-display text-sm ...` | `px-6 sm:px-8 py-3 font-display text-sm ...` + `min-h-11` |
| `px-6 py-2 ...` (compact-CTA) | сохранить + `min-h-11` |
| lonely-CTA в узкой колонке (Register, CreateSession submit) | добавить `w-full sm:w-auto` |

### Grids

| Паттерн | Мобильная альтернатива |
|---------|-----------------------|
| `grid-cols-2 md:grid-cols-4` | без изменений (2 колонки на mobile — ок для узких stat-cards) |
| `grid-cols-2 gap-6 md:grid-cols-3` | `grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3` (CreateSession numeric-fields) |
| `md:grid-cols-2` (без mobile-варианта) | оставить `grid-cols-1 md:grid-cols-2` — уже подразумевается, но явно |
| `md:grid-cols-[minmax(0,1fr)_1.2fr]` (NPC dual-pane) | оставить — стакается на mobile автоматически |
| `<dl grid-cols-3>` (SessionCard счёт) | `grid-cols-3` — 3 коротких числа помещаются, не трогаем |

### Overflow-guard

- `<html>` или `<body>` в `index.css`: `overflow-x: hidden`. Это перехватывает любой пропущенный wide-child, чтобы страница не тянулась.
- Стата-таблица (Leaderboard) в Stats — обернуть в `<div className="overflow-x-auto">` (проверить: возможно уже есть на history-таблице).

### Recharts

- Проверить что `<BarChart>` и др. в `Stats.tsx` обёрнуты в `<ResponsiveContainer width="100%" height={...}>`.
- `margin={{ left: -20 }}` может обрезать Y-axis label — на mobile попробовать `left: 0` или sm-conditional.

## Затрагиваемые файлы

1. `src/index.css` — `overflow-x-hidden` на html/body.
2. `src/App.tsx` — TitleCard + Welcome (`text-5xl`, `text-4xl`, tracking, `px-8`, CTA-размеры).
3. `src/main.tsx` — не трогаем.
4. `src/routes/Register.tsx` — обёртка + CTA `w-full sm:w-auto`.
5. `src/routes/Lobby.tsx` — обёртка `px-8 py-16`, header layout.
6. `src/routes/CreateSession.tsx` — обёртка, numeric-fields grid, submit CTA.
7. `src/routes/Session.tsx` — обёртка, gameplay-панели, «Устав партии» grid.
8. `src/routes/Stats.tsx` — обёртка, SummaryCards grid, Recharts margin.
9. `src/routes/Npc.tsx` — обёртка + внутренние grids.
10. `src/routes/StyleGuide.tsx` — обёртка (dev-only, low prio).
11. `src/components/SessionCard.tsx` — CTA padding, tracking.
12. `src/components/RoleChoice.tsx` — grid-cols-2 (уже ок; проверить touch-target кнопок).
13. `src/components/AddNpcPanel.tsx` — grid + CTA.
14. `src/components/Parchment.tsx` — если SVG-background имеет фиксированный min-width, снять.

## Тестирование

**Automated:**

- `pnpm test` — юнит-тесты не должны падать (стили, не логика).
- `pnpm typecheck` — тип не тронуть.
- `pnpm build` — билд зелёный.
- `pnpm test:e2e` — Playwright крутится в BrowserRouter (dev-mode), пути `/register`, `/lobby` и т.д. не меняются. Ждём зелёные.

**Visual — обязательно:**

- `pnpm snap` в трёх viewport'ах: **375x667** (iPhone SE), **390x844** (iPhone 13/14), **430x932** (iPhone 15 Plus).
- Cover: `/`, `/register`, `/_style-guide`, `/lobby` (без auth = редиректится на `/`, проверим отдельно с токеном).
- Для гейм-экранов (`/lobby`, `/session/:id`, `/session/:id/stats`, `/npc`) — snap с `--register admin` и `--register player`, если backend локально поднят. Иначе — визуально проверять на prod после деплоя.
- Ручной acceptance: пользователь на iPhone открывает prod, проходит регистрацию → лобби → создание сессии → gameplay → stats без единого горизонтального свайпа.

**Regression-check:**

- Snap десктоп (1280x900) до/после: параграфы не переехали, размеры кнопок и заголовков на wide-viewport'е остались как были (sm-breakpoint активен от 640px).

## Non-goals

- Не меняем UX-логику, не переставляем компоненты.
- Не трогаем анимации (Framer Motion motion-варианты в `lib/motion.ts`).
- Не рефакторим route'ы в общий `<PageShell>` (это отдельный refactor-таск, если понадобится).
- Не оптимизируем bundle-size (build warning про 928kB — отдельная история).

## Success criteria

- [ ] На iPhone SE (375px), 13 (390px), 15 Plus (430px) — 0 горизонтального скролла ни на одном route'е.
- [ ] Все интерактивные элементы (кнопки, radio, links-CTA) ≥44×44 CSS-px.
- [ ] Шрифты читаемы: минимум `text-sm` (14px) для body, `text-2xl+` для главных заголовков.
- [ ] Desktop (≥1024px) не деградировал: снапшоты «до/после» на 1280×900 совпадают в структуре.
- [ ] `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm test:e2e` — зелёные.
- [ ] Пользователь на iPhone проходит full happy-path без жалоб на скролл.

## Открытые вопросы

Нет — пользователь одобрил подход #1 в брейнсторме, все решения приняты в этой спеке.

## Ссылки

- Backend prod-deploy инструкция: `https://github.com/alex-pletnev/ultimatum-game/blob/main/frontend-integration/11-prod-deployment.md`
- T-023 (закрыл prod-deploy на GH Pages): `docs/tasks/T-023-gh-pages-prod-deploy.md`
- iOS HIG touch-target: 44×44pt (~44 CSS-px).
- Tailwind mobile-first breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
