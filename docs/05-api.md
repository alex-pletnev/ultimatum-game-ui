# 05. API contract

**Backend:** Kotlin 1.9 + Spring Boot 3.4 + PostgreSQL. REST + STOMP-over-WebSocket. JWT (access 15 мин + refresh 14 дн).

**Источник:** [`frontend-integration/`](https://github.com/alex-pletnev/ultimatum-game/tree/main/frontend-integration) в upstream. Автогенерируемые схемы:
- OpenAPI 3.0 → `http://localhost:8080/api/v1/v3/api-docs`
- AsyncAPI 3.0 → `http://localhost:8080/api/v1/springwolf/asyncapi-ui.html`

## 1. Endpoints

- **REST base:** `http://localhost:8080/api/v1`
- **WebSocket (STOMP):** `ws://localhost:8080/api/v1/ws`
- **Swagger UI:** `http://localhost:8080/api/v1/swagger-ui.html`
- **Health:** `GET /api/v1/actuator/health`

## 2. Локальный запуск backend'а

```bash
export JAVA_HOME=$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home
export JWT_SIGNING_KEY='<base64-encoded-key>'
colima start          # или Docker Desktop
./gradlew bootRun     # порт 8080
```

Первый запуск: ~60 с (kapt). Прогретый: 15–20 с. Требования: JDK 21, Docker (для Postgres), ~1 GB RAM.

## 3. Аутентификация

- **Механизм:** JWT (RFC 6750, Bearer). Алгоритм HS256, subject = `user.id` (UUID).
- **Пароли не используются** — quick-register по одному nickname'у.

| Тип токена | TTL | claim `type` | Где используется |
|-----------|-----|--------------|------------------|
| Access | 15 мин | `ACCESS` | REST `Authorization: Bearer <t>`, STOMP CONNECT-фрейм |
| Refresh | 14 дн | `REFRESH` | Только `POST /auth/refresh` |

**Rotation отключена** (MVP): старый refresh продолжает работать до `exp` даже после использования. Ответ на `/auth/refresh` возвращает `refreshToken: null` (API готов к включению rotation в будущем).

### Auth endpoints

| Метод | Путь | Роль | Body | Response | Errors |
|-------|------|------|------|----------|--------|
| POST | `/auth/quick-register` | permitAll | `{nickname (3..42), role: PLAYER\|ADMIN\|OBSERVER}` | `JwtAuthenticationResponse` | 400 (валидация), 403 (`role: NPC`) |
| POST | `/auth/quick-login` | permitAll | `{id: UUID}` | `JwtAuthenticationResponse` | 400, 404 |
| POST | `/auth/refresh` | permitAll | `{refreshToken}` | `JwtAuthenticationResponse` (`refreshToken: null`) | 401 (истёк / подделан / access вместо refresh) |
| POST | `/auth/logout` | authenticated | — | 204 | 401 |
| GET | `/user` | authenticated | — | `UserResponse` | 401 |
| GET | `/user/id` | authenticated | — | `UserIdResponse` | 401 |

## 4. Session endpoints

| Метод | Путь | Роль | Query / Body | Response | Errors |
|-------|------|------|--------------|----------|--------|
| POST | `/session` | ADMIN | `CreateSessionRequest` | 201 `SessionWithTeamsAndMembersResponse` | 400, 403 |
| GET | `/session` | auth | `?s=&state=&sessionType=&openToConnect=&page=0&pageSize=30` | `Page<SessionResponse>` | — |
| GET | `/session/{id}` | auth | — | `SessionResponse` | 400 (не UUID), 404 |
| GET | `/session/{id}/with-teams-and-members` | auth | — | `SessionWithTeamsAndMembersResponse` | 400, 404 |
| GET | `/session/{id}/current-round` | auth | — | `RoundResponse` (c hints `myRole`, `myPendingActions`) | 404 (нет текущего раунда) |
| GET | `/session/{id}/rounds` | auth | — | `List<RoundResponse>` | 404 |
| POST | `/session/{id}/join` | ADMIN, PLAYER | `?teamId=<uuid>` (обязателен для TEAM_BATTLE) | `SessionWithTeamsAndMembersResponse` | 409 (закрыта, полна, вы админ) |
| POST | `/session/{id}/join/observer` | auth | — | `SessionWithTeamsAndMembersResponse` | 409 (вы админ) |

## 5. Statistics endpoints

| Метод | Путь | Роль | Response |
|-------|------|------|----------|
| GET | `/statistics/{sessionId}/csv` | auth | 200, `text/plain`, CSV: `offerId, roundNumber, amount, proposerId, proposerNickname, responderId, responderNickname, accepted, timestamp` |

## 6. WebSocket (STOMP)

### 6.1 Подключение

```typescript
import { Client } from '@stomp/stompjs';

const client = new Client({
  brokerURL: 'ws://localhost:8080/api/v1/ws',
  connectHeaders: { Authorization: `Bearer ${accessToken}` },
  reconnectDelay: 5000,
  onConnect: () => {
    client.subscribe('/user/queue/errors', /* обязательно! */);
    // ... подписки на игру
  },
  onStompError: (frame) => { /* ERROR-фрейм */ }
});
client.activate();
```

Если JWT невалиден при CONNECT → сервер закрывает соединение STOMP ERROR-фреймом. Refresh + reconnect — руками.

### 6.2 Подписки (server → client)

| Destination | Payload | Триггер | Роли |
|-------------|---------|---------|------|
| `/topic/session/{id}/sessionStatus` | `SessionWithTeamsAndMembersResponse` | join / start / close / open / abortSession | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/roundStatus` | `RoundResponse` (дефолтные `myRole=NONE`, `myPendingActions=[]`) | Смена `RoundPhase` | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/offerCreated` | `OfferCreatedResponse` | Каждый новый оффер | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/decisionMade` | `DecisionMadeResponse` | Каждое решение | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/offersShuffled` | `OffersShuffledResponse` | Переход `ALL_OFFERS_RECEIVED → OFFERS_SENT` | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/scoreUpdated` | `SessionScoreDto` (кумулятивный) | Переход → `ALL_DECISIONS_RECEIVED` | ADMIN, PLAYER, OBSERVER |
| `/topic/session/{id}/player/{userId}/offer` | `AssignedOfferResponse` | Персональная доставка оффера responder'у после shuffle | ADMIN, PLAYER |
| `/user/queue/errors` | `ApiErrorResponse` | Любая ошибка SEND-команды | authenticated |

**Порядок сообщений между разными destination'ами — НЕ гарантирован.** Реагировать на state (fetch из DB / текущий state в store), не на порядок ивентов.

### 6.3 SEND (client → server): управление сессией (ADMIN)

| Destination | Body | Что делает |
|-------------|------|-----------|
| `/app/session/{id}/start` | `{}` | `session.state → RUNNING`, `round 1.phase → WAIT_OFFERS` |
| `/app/session/{id}/close` | `{}` | `openToConnect = false` |
| `/app/session/{id}/open` | `{}` | `openToConnect = true` |
| `/app/session/{id}/round.start` | `{}` | Закрыть текущий раунд → следующий. Если раунды кончились: `session.state → FINISHED` |
| `/app/session/{id}/round.abort` | `{}` | `round.phase → ABORTED` (не переходит дальше — админ должен `round.start`) |

### 6.4 SEND (client → server): игровые действия (PLAYER, ADMIN)

| Destination | Body | Ограничения |
|-------------|------|-------------|
| `/app/session/{id}/offer.create` | `{amount: 0..roundSum}` | Один раз за раунд per игрок. Только в фазе `WAIT_OFFERS` |
| `/app/session/{id}/make.decision` | `{offerId: UUID, decision: bool}` | Один раз per оффер. Только в фазе `OFFERS_SENT` |

## 7. Формат ошибок

**Единый для REST и WS** (`ApiErrorResponse`):

```json
{
  "timestamp": "2026-07-15T09:00:00.000+00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "displayName: must not be blank",
  "path": "/api/v1/session"
}
```

Для WS-ошибок `path: "stomp"`. **Не парсить `message` по строкам** — свободный русский текст. Полагаться на `status`.

### HTTP-коды → действие фронта

| HTTP | Когда | Действие |
|------|-------|----------|
| **400** | Валидация, невалидный UUID, плохой JSON | Показать `message` пользователю; retry бесполезен |
| **401** | JWT истёк / подделан / access вместо refresh | Попытаться `/auth/refresh` → retry; если снова 401 → logout |
| **403** | Роль не подходит; NPC registration; access denied | Не повторять; проверить права |
| **404** | Сущность не найдена | Показать 404-заглушку |
| **409** | Дубль-действие / нарушение инварианта / неверная фаза | Показать `message`; фронт может защитить upfront (грейнутая кнопка) |
| **500** | Непредвиденное | Generic toast; retry опционален |

Полная матрица исключений → HTTP-код: см. `frontend-integration/07-error-handling.md` в upstream.

## 8. Игровые state machines

### SessionState

```
CREATED --start--> RUNNING --last round.start--> FINISHED
   |                  |
   |                  +--abortSession--> ABORTED (не реализовано в MVP)
   +--(нет прямых переходов из CREATED в FINISHED)
```

### RoundPhase

```
CREATED --admin start--> WAIT_OFFERS
    |                        |
    |                   (все офферы собраны)
    |                        v
    |                   ALL_OFFERS_RECEIVED
    |                        |
    |                    (shuffle → offersShuffled event)
    |                        v
    |                   OFFERS_SENT
    |                        |
    |                   (все решения собраны)
    |                        v
    |                   ALL_DECISIONS_RECEIVED --scoreUpdated--> FINISHED
    |                        |
    +----------- ABORTED <---+ (admin round.abort из любой фазы)
```

Подробнее: `frontend-integration/08-state-machines.md`.

## 9. Игровая модель

- **Мультиплеер**, не hot-seat. Каждый игрок — свой JWT + WS-соединение.
- **Session types:** `FREE_FOR_ALL` (все против всех) и `TEAM_BATTLE` (2..5 команд, respondent обязательно из чужой команды).
- **Роли в раунде:** каждый игрок одновременно **и proposer, и responder** (отправляет свой оффер и получает чужой после shuffle).
- **Роли между раундами:** shuffle заново → новые пары.
- **Скоринг:** accept → proposer `roundSum - amount`, responder `amount`. Reject → оба `0`. Кумулятивно по всем раундам.
- **Persistence:** полностью, PostgreSQL. Перезагрузка фронта не теряет партию — можно переподключиться.

## 10. Что явно НЕ реализовано (важно для UX)

| Функция | Статус | Что делать на фронте |
|---------|--------|----------------------|
| Enforce таймаутов фазы (`config.timeoutMoveSec`) | ❌ (только в схеме) | Локальный таймер + подсказка admin'у: «раунд висит N минут — abort?» |
| Pause | ❌ | Нет — админ может только `round.abort` |
| NPC-игроки | ❌ (зарезервировано) | Регистрация `role: NPC` → 403 |
| Refresh-token rotation | ❌ (by design MVP) | Interceptor: 401 → `/auth/refresh` → retry (rotation можно не поддерживать пока) |
| Anti-impersonation на STOMP | ❌ | Сервер не валидирует, что `/topic/.../player/{userId}/offer` совпадает с `{userId}` из JWT. Low-priority для MVP. |
| CORS для prod | ❌ (только dev, любой `http://localhost:*`) | На проде — надо будет пинать backend |
| Rate limiting | ❌ | Не реализовано |
| Endpoint удаления сессии | ❌ | Админ не может почистить БД |

## 11. Кодогенерация

Из `openapi.json` и `asyncapi.json` можно сгенерировать типы автоматически:

- **OpenAPI → TS-типы:** `openapi-typescript` (проще всего), `orval` (полноценный клиент), `openapi-typescript-codegen`.
- **AsyncAPI → WS payloads:** `@asyncapi/modelina` (или ручные типы — их немного).

Решение о кодогенерации vs ручных типах — в T-002 (scaffolding).

## 12. DTO / типы

Полный каталог типов — [07-types.md](07-types.md).
