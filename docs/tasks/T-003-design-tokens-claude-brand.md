---
id: T-003
title: Design tokens — фэнтези-настолка + Claude-brand
status: done
priority: medium
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/styles/tokens.css
  - src/index.css
  - src/App.tsx
  - src/main.tsx
  - src/components/Parchment.tsx
  - src/components/WaxSeal.tsx
  - src/routes/StyleGuide.tsx
related_docs:
  - docs/04-components.md
  - docs/01-overview.md
tags: [design, ui, tokens, style]
---

## Контекст

Стилистическая директива — фирменный визуал Claude Code, переосмысленный как настольная игра **в лучших традициях фэнтези-настолок**: пергамент, чернила, тиснёный шрифт, восковая печать, латунь, охра, глубокие тёплые тени как от свечи. Никакого «сайта с оранжевой кнопочкой».

Прежде чем писать компоненты, нужен зафиксированный «атлас» токенов: палитра, шрифты, тени, скругления, spacing-ритм. Дальше — компоненты только через токены, без hex'ов в разметке.

Tailwind v4 умеет `@theme` прямо в CSS — обходимся без отдельного `tailwind.config.ts` для tokens.

## Acceptance criteria

- [x] `src/styles/tokens.css` — CSS custom properties + Tailwind `@theme`: 6 палитр (night 11 shades, parchment 6, ember 5, brass 4, blood 3, verdigris 2) + ink (900/950), шрифты, 3 тени, 4 радиуса.
- [x] Шрифты подключены (Google Fonts): **Cinzel**, **EB Garamond**, **JetBrains Mono**.
- [x] `src/App.tsx` переделан: пергаментная карточка на угольном фоне, «Anno MMXXVI · Volumen I»-надпись, тиснёный Cinzel-титул, brass-разделитель, восковая печать (SVG с gradient + noise), placeholder-описание, ember-кнопка «Войти за стол» (disabled — заглушка до T-004+), ссылка на style-guide.
- [x] Dev-route `/_style-guide` (`src/routes/StyleGuide.tsx`) с 4 секциями: I палитры со swatches и токенами, II типо-scale (display/body/mono), III тени, IV примитивы (Parchment, WaxSeal, Token, Divider).
- [x] Router — `BrowserRouter` из `react-router` с двумя routes.
- [x] Все проверки зелёные: typecheck ✅, test 2/2 ✅ (title card + style-guide link), lint ✅ (0 warnings), build ✅ (`246 KB → 78 KB` gzip, CSS `20 KB → 4.6 KB`).

## План

1. `src/styles/tokens.css`: палитра (night-950/900/800, parchment-50/100/200, ink-950, ember-400/500/600, brass-500, blood-500, verdigris-500) + shadows + fonts + radii + `@theme` для Tailwind.
2. `src/index.css`: import tokens.css + Google Fonts + base body-стили (тёплый фон, serif по умолчанию).
3. `src/App.tsx`: титульная карточка (парень пергамент + печать + Cinzel-заголовок + EB Garamond-описание).
4. `src/routes/StyleGuide.tsx`: swatches, type scale, shadow demo, «карта» и «печать» примитивы.
5. `src/main.tsx`: minimal BrowserRouter (React Router 7) с двумя routes.
6. Обновить `src/App.test.tsx` под новый текст титула.
7. Прогнать проверки, `/task-done`.

## Лог

- 2026-07-15: заведена автоматически при setup-agent-harness. Опережает первый UI-код: без токенов начнём хардкодить цвета.
- 2026-07-15: переведена в `in_progress`. Пользователь уточнил направление: «в лучших традициях настолок и фэнтези» — уходим глубже, чем изначально «Claude-brand на угольном фоне». Пергамент, воск, латунь, свечное освещение.
- 2026-07-15: реализовано. Токены собраны в `@theme`-блоке Tailwind v4 (без отдельного JS-конфига). Метафора «стол под свечой» проведена через все три тени и радиальные градиенты фона. Восковая печать сделана как SVG с двумя radial-gradient'ами и feTurbulence noise-filter — без внешних ассетов и картинок. Добавил router (минимально, `BrowserRouter` + 2 routes). Style-guide — dev-only, но публично доступен по `/_style-guide` (не блокируем — solo/MVP). Тест обновлён под 2 кейса: заголовок и линк на style-guide. Переведена в `done`.
