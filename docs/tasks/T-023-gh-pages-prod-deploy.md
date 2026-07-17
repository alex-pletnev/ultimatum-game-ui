---
id: T-023
title: Prod deploy на GitHub Pages
status: in_progress
priority: high
created: 2026-07-17
updated: 2026-07-17
related_code:
  - vite.config.ts
  - src/main.tsx
  - src/api/query-client.ts
  - .env.example
  - .github/workflows/deploy.yml
  - e2e/*.spec.ts
  - e2e/utils.ts
tags: [frontend, deploy, infra]
---

## Контекст

Backend выкатили в Yandex.Cloud (T-090 в backend-репо), доступен по HTTPS
`https://158-160-48-113.nip.io/api/v1` без VPN. Инструкция для фронта —
[frontend-integration/11-prod-deployment.md](https://github.com/alex-pletnev/ultimatum-game/blob/main/frontend-integration/11-prod-deployment.md).

Хостим фронт на GitHub Pages как project-page —
`https://alex-pletnev.github.io/ultimatum-game-ui/`. CORS уже разрешает этот origin.

## Acceptance criteria

- [x] `vite.config.ts` использует `base: '/ultimatum-game-ui/'` **только для build** (dev-сервер остаётся на `/`, чтобы Playwright не сломался).
- [x] `main.tsx` — `HashRouter` только в prod (`import.meta.env.PROD`), в dev остаётся `BrowserRouter` — e2e не трогаем.
- [x] `.github/workflows/deploy.yml` — build с env из repo Variables + `actions/deploy-pages@v4`.
- [x] `.env.example` содержит prod URLs (в комментарии).
- [x] Query-client — retry 3 попытки для 5xx/network (backend может 30s стартовать после ребута → 502).
- [x] `pnpm test`, `pnpm typecheck`, `pnpm build` — зелёные, dist ссылается на `/ultimatum-game-ui/`, prod URLs вкомпилились.
- [ ] Пользователь настраивает в GH UI: Variables (`VITE_API_BASE_URL`, `VITE_WS_URL`) + Pages source = GitHub Actions.
- [ ] После merge — workflow отработал, https://alex-pletnev.github.io/ultimatum-game-ui/ открывается.

## План

1. Task-файл + INDEX.
2. `vite.config.ts` — conditional base.
3. `main.tsx` — HashRouter.
4. `e2e/*` — переписать `goto('/foo')` → `goto('/#/foo')`.
5. `query-client.ts` — retry: 3 для 5xx/network.
6. `.env.example` — комментарий с prod URLs.
7. `.github/workflows/deploy.yml`.
8. `pnpm test && pnpm typecheck && pnpm build`.
9. `pnpm test:e2e` (если backend поднят).
10. Commit + push. Пользователь настраивает Variables и Pages source в GH UI.

## Лог

- 2026-07-17: заведена. Начинаю работу по деплою на GH Pages по инструкции backend-репо.
- 2026-07-17: реализация. Vite base — conditional (dev на `/`, build на `/ultimatum-game-ui/`). Router — conditional (dev BrowserRouter, prod HashRouter) — e2e и dev-flow не трогаем. Retry 3 в query-client. Workflow с `actions/deploy-pages@v4`. Локальный build проверен: assets и prod URLs корректны. Остались настройки в GH UI (пользователь).
