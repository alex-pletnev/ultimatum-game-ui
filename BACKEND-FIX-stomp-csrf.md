# [BACKEND-FIX] STOMP CONNECT падает с CloseStatus 1002 из-за MissingCsrfTokenException

> **Это НЕ задача frontend'а.** Спека для backend-агента `alex-pletnev/ultimatum-game`. Frontend
> (репо `alex-pletnev/ultimatum-game-ui`) обнаружил проблему при интеграции STOMP-канала.

## Симптомы

Любой клиент, подключающийся к `ws://localhost:8080/api/v1/ws` через `@stomp/stompjs` с
корректным JWT в `connectHeaders: { Authorization: 'Bearer <access>' }`, немедленно получает
`CloseStatus[code=1002, reason=null]`. STOMP `CONNECTED`-фрейм не приходит; клиент видит
401 в error-handler'е.

### Логи backend'а (характерная последовательность)

```
Handshake principal = null
Completed 101 SWITCHING_PROTOCOLS
New StandardWebSocketSession[id=..., uri=ws://localhost:8080/api/v1/ws]
Failed to send message to MessageChannel in session ...
org.springframework.messaging.MessageDeliveryException: Failed to send message to ExecutorSubscribableChannel[clientInboundChannel]
    at org.springframework.messaging.support.AbstractMessageChannel.send(...)
    at org.springframework.web.socket.messaging.StompSubProtocolHandler.handleMessageFromClient(StompSubProtocolHandler.java:343)
    ...
Caused by: org.springframework.security.web.csrf.MissingCsrfTokenException: Could not verify the provided CSRF token because no token was found to compare.
```

Т.е. первый же STOMP-фрейм от клиента (CONNECT) отбрасывается CSRF-фильтром.

### Что уже проверено

- `Authorization: Bearer <access>` в `connectHeaders` STOMP CONNECT-фрейма — передаётся,
  ровно как в `frontend-integration/05-websocket-api.md` §22 и §33.
- REST-запросы (auth + session CRUD + statistics) работают корректно с тем же JWT.
- `SecurityConfiguration.kt:28` уже содержит `.csrf { it.disable() }` — CSRF отключён для
  HTTP-фильтр-чейна, но `@EnableWebSocketSecurity` в `WebSocketSecurityConfig.kt` вводит
  **отдельный** CSRF-`ChannelInterceptor` для STOMP, который этой настройкой не трогается.

## Root cause

Spring Security 6, при `@EnableWebSocketSecurity`, автоматически регистрирует
`CsrfChannelInterceptor` в `clientInboundChannel`, который для не-same-origin (fetch/WebSocket
из dev-фронта на `:5173` в backend `:8080`) блокирует CONNECT без CSRF-токена. STOMP-клиенты
из браузера CSRF-токен через фрейм не отправляют (нет API для этого в `@stomp/stompjs`) —
стандартная практика заключается в **отключении same-origin/CSRF для WebSocket-канала**.

Документированное поведение:
- [Spring docs: WebSocket CSRF](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-sameorigin)
- Причина, почему `.csrf { it.disable() }` из HTTP-чейна не помогает: WebSocket-канал имеет
  **свою собственную** цепочку интерцепторов, зарегистрированную через `@EnableWebSocketSecurity`.

## Fix

Добавить в `WebSocketSecurityConfig.kt` (тот же файл, где уже определён
`messageAuthorizationManager`) следующий `@Bean`:

```kotlin
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer

@Bean
fun disableWebSocketCsrf(): AbstractSecurityWebSocketMessageBrokerConfigurer {
    return object : AbstractSecurityWebSocketMessageBrokerConfigurer() {
        override fun sameOriginDisabled(): Boolean = true
    }
}
```

**Один метод, одна строка override'а.** Никаких новых полей, миграций, зависимостей.

### Обоснование безопасности

- Same-origin для WebSocket ≠ HTTP same-origin. WS-handshake — обычный HTTP-запрос, для
  которого CORS уже настроен (`SecurityConfiguration.corsConfigurationSource` разрешает
  `http://localhost:[*]`).
- JWT-auth в CONNECT-фрейме (`JwtStompChannelInterceptor.preSend`) остаётся основной
  authentication-логикой — CSRF-проверка тут дублирует и **ломает** её.
- В prod-конфигурации origin-check можно вернуть через explicit `AllowedOrigins` в
  `WebSocketConfig`, но не через сломанный default CsrfChannelInterceptor.

### Альтернативы (менее чистые, не рекомендую)

1. Заменить `AbstractSecurityWebSocketMessageBrokerConfigurer` на кастомный
   `WebSocketMessageBrokerConfigurer` с `configureClientInboundChannel` — но override
   `sameOriginDisabled` через legacy-класс покрыт документацией и стабилен.
2. Прокидывать CSRF-токен из отдельного `GET /csrf`-endpoint'а в frontend, потом в
   `connectHeaders` — сломает совместимость с `@stomp/stompjs`, требует manual encoding.

## Как проверить fix

1. Применить fix, `./gradlew bootRun` (перезапустить backend).
2. Из терминала выше корня frontend-репо запустить (backend уже поднят на 8080):
   ```bash
   cd /Users/aleksandrpletnev/sandbox/ultimatum-game-ui
   pnpm dev &                # фронт на 5173
   pnpm snap --path /_style-guide --out /tmp/x.png  # sanity: frontend жив
   ```
3. Зарегистрировать пользователя, зайти на `/session/<id>` через `pnpm snap`:
   ```bash
   pnpm snap --path /lobby --register admin --out /tmp/lobby.png
   ```
   Создать партию, перейти к столу — в UI справа от «У СТОЛА · РОЛЬ ВЕДУЩИЙ» должна появиться
   **verdigris-точка** (`bg-verdigris-500`, `~2×2 px`). Это означает, что STOMP `CONNECTED`
   фрейм пришёл и `useStompConnected()` дал `true`.
4. Полный smoke — прогнать e2e:
   ```bash
   pnpm test:e2e
   ```
   Все 10 тестов должны пройти. Сейчас падает `e2e/start-round.spec.ts` — после fix'а
   пройдёт.
5. Backend-side проверка: в логах при STOMP-подключении **не должно быть**
   `MessageDeliveryException` / `MissingCsrfTokenException`. Первая же строка
   `JwtStompChannelInterceptor.preSend пришла команда: CONNECT от <UsernamePasswordAuthenticationToken>`
   (не `AnonymousAuthenticationToken`) означает, что фильтр прошёл.

## Файлы и точные места

- **Патчить:** `src/main/kotlin/edu/itmo/ultimatumgame/configs/WebSocketSecurityConfig.kt`
  (существующий файл; добавить `@Bean disableWebSocketCsrf`).
- **НЕ трогать:** `SecurityConfiguration.kt` — HTTP-чейн уже правильно настроен.
- **Не забыть импорт:** `org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer`.

## Метаданные

- **Обнаружено:** 2026-07-15 в ходе задачи T-012 (frontend, ADMIN start round) репозитория
  `alex-pletnev/ultimatum-game-ui`.
- **Влияние:** STOMP-канал не работает вовсе. Live-sync лобби/сессии, gameplay-команды
  (start, round.start, round.abort, offer.create, make.decision) — все заблокированы.
- **Приоритет:** high (блокирует всю игровую механику).
- **Тег:** `bug`, `security-config`, `websocket`, `stomp`.
