# BACKEND-FIX — публичная страница статистики (без JWT)

## Симптом

Открытие `http://localhost:5173/session/{id}/stats` без залогиненного пользователя
даёт в консоли:

```
GET /api/v1/statistics/{id}/csv → 403 Forbidden
GET /api/v1/session/{id}/with-teams-and-members → 403 Forbidden
```

## Почему это нужно

Летопись партии — публичный артефакт. Игроки должны иметь возможность
поделиться ссылкой (в чат, форум, отчёт) без принуждения ссылки-открывающего
регистрироваться. Дискуссия партии = ссылка на статистику + читай.

## Что просим

Разрешить анонимный (без Bearer) `GET` на два endpoint'а:

1. `GET /api/v1/statistics/{sessionId}/csv` — уже отдаёт всё для летописи.
2. `GET /api/v1/session/{sessionId}/with-teams-and-members` — нужен для
   отображения `displayName` и `config.roundSum` в заголовке страницы.

Оба endpoint'а — read-only, никакой sensitive-инфы (только ники + суммы).
POST /session и SEND-команды остаются с auth.

## Как проверить

```bash
# без Authorization header — сейчас 403, должно быть 200:
curl -s -w "HTTP=%{http_code}\n" \
  "http://localhost:8080/api/v1/statistics/{sessionId}/csv"
curl -s -w "HTTP=%{http_code}\n" \
  "http://localhost:8080/api/v1/session/{sessionId}/with-teams-and-members"
```

## Frontend affected

- `src/routes/Stats.tsx` — я снял `Navigate` при отсутствии токена; страница
  пытается фетчить эти endpoint'ы даже для анонима.
- `useSessionDetails` / `useSessionStats` — `enabled` больше не проверяет
  `token !== null` для этой страницы; `apiFetch(Text)` не добавляет
  `Authorization` при `null` — сработает сразу после backend-fix'а.
