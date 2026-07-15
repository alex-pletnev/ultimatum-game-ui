---
id: T-004
title: Backend integration foundation — REST + STOMP + react-query
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/api/config.ts
  - src/api/types.ts
  - src/api/auth-storage.ts
  - src/api/client.ts
  - src/api/query-client.ts
  - src/api/auth-queries.ts
  - src/api/ws/stomp-client.ts
  - src/api/ws/StompProvider.tsx
  - src/api/ws/stomp-context.ts
  - src/main.tsx
  - vitest.setup.ts
related_docs:
  - docs/05-api.md
  - docs/07-types.md
tags: [backend, integration, api, foundation]
---

## Контекст

Без интеграционного слоя нет ни одного «настоящего» экрана. Прежде чем делать регистрацию/лобби/игру, нужен фундамент: типы, конфиг, REST-клиент с 401-интерсептором + refresh, STOMP-клиент, `QueryClient`. Собирать по одному endpoint'у на каждый экран — плодить копипасту.

Скоуп сознательно узкий: **инфраструктура + core-types + минимальные hooks для auth**. Всё остальное (session-hooks, все STOMP-подписки) появится по мере нужды в T-005+.

## Acceptance criteria

- [x] `src/api/config.ts` — вычитка `VITE_API_BASE_URL` / `VITE_WS_URL` с `throw` при отсутствии.
- [x] `src/api/types.ts` — TS-типы для auth (User, Role, JwtAuthenticationResponse, CreateUserRequest, RefreshTokenRequest, ApiErrorResponse, UserIdResponse) + core-enum'ы (SessionState, SessionType, RoundPhase, MyRole, AssignableRole).
- [x] `src/api/auth-storage.ts` — типизированный доступ к `accessToken`/`refreshToken` в `localStorage` + cross-tab-sync через 'storage'-событие + React-хук `useAccessToken()` через `useSyncExternalStore`.
- [x] `src/api/client.ts` — `apiFetch<T>` с Bearer, JSON-serialization, `ApiError` (парсинг `ApiErrorResponse`), refresh-on-401 + retry, **race-safe** (in-flight promise делится между параллельными 401'ами).
- [x] `src/api/query-client.ts` — `createQueryClient()` с retry: 1 (кроме 4xx), staleTime: 30s, no refetchOnWindowFocus, mutations без retry.
- [x] `src/api/auth-queries.ts` — `useCurrentUser`, `useQuickRegister`, `useLogout`.
- [x] `src/api/ws/stomp-client.ts` — `createStompClient(token, handlers)`, автоподстановка JWT в CONNECT, reconnectDelay 5s, обязательная подписка на `/user/queue/errors` + пробрасывание ERROR-фрейма.
- [x] `src/api/ws/StompProvider.tsx` + `stomp-context.ts` — Context, поднимает/опускает соединение синхронно с токеном. `useStomp()` вынесен в отдельный файл (для HMR react-refresh).
- [x] `src/main.tsx` — `QueryClientProvider` → `StompProvider` → `BrowserRouter` → `Routes`.
- [x] `.env` создан с dev-defaults (не секреты, коммитится); `.env.local` — по желанию для override'а (в `.gitignore`).
- [x] Проверки зелёные: typecheck ✅, test 13/13 ✅ (auth-storage 5 + client 6 + App 2), lint ✅ (0 warnings), build ✅ (300 KB → 94 KB gzip).
- [x] `/` и `/_style-guide` живые, Vite ready за 155 мс.

## План

1. `config.ts` — простая функция с throw при отсутствии env-переменной.
2. `types.ts` — из `docs/07-types.md` вытащить необходимое (auth + core enum'ы).
3. `auth-storage.ts` — localStorage-обёртка с eventEmitter'ом для React-подписки.
4. `client.ts` — apiFetch с queue для параллельных refresh'ей.
5. `query-client.ts` — QueryClient factory.
6. `auth-queries.ts` — 3 хука через react-query.
7. `ws/stomp-client.ts` — createStompClient(config).
8. `ws/StompProvider.tsx` — Context + Provider + useStomp.
9. `main.tsx` — обёртки провайдерами.
10. Unit-тесты: auth-storage, client (mock fetch — happy path + 401→refresh→retry).
11. Все проверки, `/task-done`.

## Лог

- 2026-07-15: заведена, переведена в `in_progress`. Первый серьёзный шаг после scaffolding'а. Скоуп удерживать узким — не тащить сюда конкретные session-hooks.
- 2026-07-15: реализовано. 3 внезапных проблемы, все решены: (1) Node 25+ подсовывает свой experimental `localStorage` в globalThis без `--localstorage-file`, jsdom его не перекрывает → написал `MemoryStorage` shim в `vitest.setup.ts`; (2) react-refresh ругался на смешение Provider и hook в одном файле → вынес `useStomp` в `stomp-context.ts`; (3) не сообразил сразу, что нужен `.env` для тестов — Vite/Vitest подтягивают его автоматически. Все проверки зелёные, dev жив.
- 2026-07-15: переведена в `done`.
