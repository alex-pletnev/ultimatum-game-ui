# 01. Overview

## 1. Что за проект

Веб-фронтенд к игре **Ultimatum Game** — экспериментальной поведенческой игре про переговоры / предложения / принятие-отклонение (см. upstream: <https://github.com/alex-pletnev/ultimatum-game>).

Backend (**Kotlin 1.9 + Spring Boot 3.4 + PostgreSQL**, REST + STOMP-over-WebSocket, JWT-auth) уже существует; наша задача — **клиентская сторона**: игроки со своих устройств подключаются к общей сессии и играют (мультиплеер, не hot-seat). Проектируется как **иммерсивная цифровая настолка**, а не типовое веб-приложение.

Полный контракт backend'а — [`docs/05-api.md`](05-api.md), типы — [`docs/07-types.md`](07-types.md).

## 2. Стек (планируемый)

_(Стека физически ещё нет — код появится в T-002. Ниже — что зафиксировали при bootstrap.)_

| Слой | Инструмент | Комментарий |
|------|------------|-------------|
| Bundler / dev-server | Vite | Быстрый HMR, минимум конфига |
| Language | TypeScript | Строгий tsconfig |
| UI-framework | React 19 | Function components + hooks |
| Стили | TailwindCSS + CSS variables | Custom design tokens под Claude-brand |
| Компоненты | shadcn/ui (copy-paste) | Не либа — свой код в `src/components/ui/` |
| Анимации | Framer Motion | Physicality: карты вращаются, фишки «падают» |
| Data-fetch | TanStack Query | REST-запросы к backend'у |
| Local state | Zustand | UI-стейт, лёгкие сторы |
| Realtime | **`@stomp/stompjs`** | Backend отдаёт **STOMP 1.2 поверх WebSocket** (не голый WS). Обязателен |
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

| Термин | Смысл |
|--------|-------|
| **Session** | Игровая партия. Состояния: `CREATED → RUNNING → FINISHED`. Создаётся ADMIN'ом, содержит config, участников, историю раундов |
| **SessionType** | `FREE_FOR_ALL` (все против всех) или `TEAM_BATTLE` (2..5 команд, оффер идёт в чужую команду) |
| **Round** | Один цикл раздачи. `numRounds ∈ [1, 10]` per session. Фазы: `CREATED → WAIT_OFFERS → ALL_OFFERS_RECEIVED → OFFERS_SENT → ALL_DECISIONS_RECEIVED → FINISHED` (или `ABORTED` через admin) |
| **Proposer / Responder** | Каждый игрок в раунде **и то, и другое одновременно**: отправляет свой оффер (proposer) и получает чужой после shuffle (responder). Пары меняются каждый раунд |
| **Offer** | Предложение о разделе `roundSum` — сумма `amount ∈ [0, roundSum]`, отправляется в фазе `WAIT_OFFERS` |
| **Decision** | Ответ на полученный оффер: `accept=true` или `reject=false`, отправляется в фазе `OFFERS_SENT` |
| **roundSum** | Общая ставка раунда (`10..100000`). Accept → proposer получает `roundSum - amount`, responder — `amount`. Reject → оба `0` |
| **Роли (JWT)** | `ADMIN` (создаёт/управляет сессиями), `PLAYER` (участвует), `OBSERVER` (только смотрит), `NPC` (зарезервировано, не реализовано) |
| **STOMP** | Framing-protocol поверх WebSocket. `/topic/...` — broadcast, `/user/queue/...` — персональные, `/app/...` — SEND-команды |

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
