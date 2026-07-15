# [BACKEND-FIX] GET /session/{id}/current-round отдаёт 500 NPE (myRole = null)

> **Не задача frontend'а.** Спека для backend-агента `alex-pletnev/ultimatum-game`.
> Frontend (`alex-pletnev/ultimatum-game-ui`, T-012) обнаружил проблему при интеграции.

## Симптомы

Запрос:
```
GET /api/v1/session/{sessionId}/current-round
Authorization: Bearer <admin-jwt>
```
где session только что переведена в state `RUNNING` через STOMP `SEND /app/session/{id}/start`.

Ответ: **500 Internal Server Error**, тело:
```json
{
  "timestamp": "2026-07-15T12:52:02.923+00:00",
  "status": 500,
  "error": "Internal Server Error",
  "message": "...",
  "path": "/api/v1/session/.../current-round"
}
```

## Root cause (из backend-логов)

```
WARN  o.s.w.s.m.m.a.ExceptionHandlerExceptionResolver - Resolved
[java.lang.NullPointerException: Parameter specified as non-null is null:
 method edu.itmo.ultimatumgame.dto.responses.RoundResponse.<init>, parameter myRole]
```

Kotlin non-null-параметр `myRole` в конструкторе `RoundResponse` получает `null`. По контракту
`docs/07-types.md` / `frontend-integration/06-data-models.md`, `myRole: MyRole` не может быть
`null` — это enum: `'PROPOSER' | 'RESPONDER' | 'BOTH' | 'NONE'`. Для authenticated user'а,
не участвующего в round'е, backend должен возвращать `NONE`, а не `null`.

Воспроизводится 100% при первом запросе `/current-round` сразу после START'а партии со стороны
ADMIN'а, которого нет среди `members` (типичный случай — ADMIN создал, никто ещё не joined).

## Предполагаемое место

`SessionController#getCurrentRound(String)` → сервисная функция построения `RoundResponse`.
Логика вычисления `myRole` не покрывает случай «пользователь есть за столом (ADMIN), но не в
членах раунда». Возвращает `null` вместо `NONE`.

## Fix (эскиз)

Найти место, где формируется `RoundResponse.myRole`, и заменить возможный `null` на
`MyRole.NONE`:

```kotlin
// плохо
val myRole: MyRole? = computeRole(user, round)  // null для admin-observer

// хорошо
val myRole: MyRole = computeRole(user, round) ?: MyRole.NONE
```

Или в builder / mapper `Round → RoundResponse` — гарантировать non-null через дефолт.

## Проверка

```bash
# 1. ADMIN регистрируется и создаёт партию
TOKEN=$(curl -sf -X POST http://localhost:8080/api/v1/auth/quick-register \
  -H 'Content-Type: application/json' \
  -d "{\"nickname\":\"cur-test-$(date +%s)\",\"role\":\"ADMIN\"}" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")

SESSION_ID=$(curl -sf -X POST http://localhost:8080/api/v1/session \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"displayName":"cur-test","config":{"sessionType":"FREE_FOR_ALL","numRounds":3,"numTeams":0,"numPlayers":4,"roundSum":100,"timeoutMoveSec":60}}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

# 2. Стартануть партию STOMP-SEND /app/session/{id}/start.
#    (В frontend'е делается через UI. Для CLI-теста нужен stomp-client — например
#     https://www.npmjs.com/package/stomp-broker-js или stomp.py.)

# 3. GET /current-round
curl -si -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/session/$SESSION_ID/current-round" | head -20
```

**Ожидание после fix'а:** 200 OK с payload'ом типа
```json
{
  "id": "...",
  "roundNumber": 1,
  "roundPhase": "WAIT_OFFERS",
  "offers": [],
  "decisions": [],
  "session": {...},
  "myRole": "NONE",
  "myPendingActions": []
}
```

## Файлы для проверки

- `src/main/kotlin/.../dto/responses/RoundResponse.kt` — тип `myRole`.
- `src/main/kotlin/.../services/RoundService.kt` (или подобное) — построение response'а.
- `src/main/kotlin/.../controllers/SessionController.kt` — endpoint `getCurrentRound`.

## Метаданные

- **Обнаружено:** 2026-07-15 после fix'а T-012-CSRF (BACKEND-FIX-stomp-csrf.md).
- **Влияние:** невозможно показать состояние раунда после START'а — фронт крашится на
  `useCurrentRound`. Блокирует все игровые экраны.
- **Приоритет:** high.
- **Тег:** `bug`, `null-safety`, `dto`.
