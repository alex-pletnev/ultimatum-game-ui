# 01. Overview

## 1. Что за проект

Веб-фронтенд к игре **Ultimatum Game** — экспериментальной поведенческой игре про переговоры / предложения / принятие-отклонение (см. upstream: <https://github.com/alex-pletnev/ultimatum-game>).

Backend (Python) уже существует; наша задача — **клиентская сторона**: игрок(и) сидят перед экраном/-ами и играют. Проектируется как **иммерсивная цифровая настолка**, а не типовое веб-приложение.

## 2. Стек (планируемый)

_(Стека физически ещё нет — код появится в T-002. Ниже — что зафиксировали при bootstrap.)_

| Слой | Инструмент | Комментарий |
|------|------------|-------------|
| Bundler / dev-server | Vite | Быстрый HMR, минимум конфига |
| Language | TypeScript | Строгий tsconfig |
| UI-framework | React 18 | Function components + hooks |
| Стили | TailwindCSS + CSS variables | Custom design tokens под Claude-brand |
| Компоненты | shadcn/ui (copy-paste) | Не либа — свой код в `src/components/ui/` |
| Анимации | Framer Motion | Physicality: карты вращаются, фишки «падают» |
| Data-fetch | TanStack Query | REST-запросы к backend'у |
| Local state | Zustand | UI-стейт, лёгкие сторы |
| Realtime | WebSocket (нативный / `ws`) | Уточнить из frontend-integration/ (T-001) |
| Routing | React Router | Экран лобби / экран игры / экран правил |
| Package manager | pnpm | Быстрый, экономит диск |
| Тесты | Vitest + @testing-library/react | Появятся с scaffolding'ом (T-002) |

## 3. Точки входа

_(Заполнить когда появится код — планово `src/main.tsx` → `src/App.tsx` → routes.)_

| Что | Файл | Комментарий |
|-----|------|-------------|
| Entry | `src/main.tsx` | _(TBD)_ |
| Root component | `src/App.tsx` | _(TBD)_ |
| Routes | `src/routes/` | _(TBD)_ |
| Backend client | `src/api/` | _(TBD, T-001)_ |
| WebSocket client | `src/api/ws.ts` | _(TBD, T-001)_ |
| Design tokens | `src/styles/tokens.css` | _(TBD)_ |

## 4. Ключевые концепции

_(Черновой список от идеи «Ultimatum Game». Уточнится после чтения frontend-integration/ в T-001.)_

| Термин | Смысл (в первом приближении) |
|--------|----|
| Room / Session | Игровая партия — контейнер участников |
| Proposer | Игрок, делающий предложение о разделе |
| Responder | Игрок, принимающий/отклоняющий предложение |
| Offer | Сумма/пропорция, предложенная Proposer'ом |
| Round | Один цикл «предложил → ответил» |
| Pot | Общая ставка на кону в раунде |

## 5. Как запустить локально

_(Заполнить после T-002. Планово:)_

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

Env-переменные — см. `docs/10-configuration.md`.

## 6. Стилистическая декларация

Проект — **не сайт**. Проект — цифровая настольная игра, оформленная в фирменном визуальном ключе Claude Code (тёплый оранж на угольном фоне, моноширинные подписи, ощущение «мастера-ведущего»).

Guideline при любой UI-задаче — «а как это выглядело бы в физической настольной коробке?» — см. CLAUDE.md → «Стилистическая директива».
