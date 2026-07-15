# 07. Types / DTO

Каталог типов backend'а ultimatum-game. Первичный источник — `frontend-integration/06-data-models.md` upstream'а + `frontend-integration/specs/openapi.json` + `specs/asyncapi.json`.

**Правило:** типы фронта = зеркало backend'а, не подгонять под удобство UI. UI-специфичные типы — отдельно, в `src/game/types.ts` (когда появится).

## 1. Куда положить

`src/api/types/` (несколько файлов — auth, session, round, ws-events) или `src/api/types.ts` (одним файлом, если получится <500 строк).

Опция кодогенерации:
```bash
npx openapi-typescript http://localhost:8080/api/v1/v3/api-docs -o src/api/generated/schema.ts
```

Решить в T-002.

## 2. Enum'ы

```typescript
type Role = 'ADMIN' | 'PLAYER' | 'OBSERVER' | 'NPC';
type SessionState = 'CREATED' | 'RUNNING' | 'FINISHED' | 'ABORTED';
type SessionType = 'FREE_FOR_ALL' | 'TEAM_BATTLE';
type RoundPhase =
  | 'CREATED'
  | 'WAIT_OFFERS'
  | 'ALL_OFFERS_RECEIVED'
  | 'OFFERS_SENT'
  | 'ALL_DECISIONS_RECEIVED'
  | 'FINISHED'
  | 'ABORTED';
type MyRole = 'PROPOSER' | 'RESPONDER' | 'BOTH' | 'NONE';
type PendingActionType = 'SEND_OFFER' | 'MAKE_DECISION';
```

## 3. Соглашения по форматам

| Поле | Формат | Пример |
|------|--------|--------|
| UUID | строка RFC 4122 | `"550e8400-e29b-41d4-a716-446655440000"` |
| Даты | ISO 8601 с ms и TZ | `"2026-07-15T09:00:00.000+00:00"` |
| Enum | строка uppercase | `"CREATED"` |
| Целые | JSON number (int64) | `100` |
| Nullable | явный `null` | `"responder": null` |
| **Опечатка** | `Prew` вместо `Preview` в `*PrewResponse` DTO — исторически | сохранять как есть |

## 4. Каталог типов

### 4.1 Auth

| Тип | Поля | Используется |
|-----|------|--------------|
| `CreateUserRequest` | `nickname: string (3..42)`, `role: 'PLAYER' \| 'ADMIN' \| 'OBSERVER'` | `POST /auth/quick-register` |
| `AuthenticateUserRequestDto` | `id: UUID` | `POST /auth/quick-login` |
| `RefreshTokenRequest` | `refreshToken: string` | `POST /auth/refresh` |
| `JwtAuthenticationResponse` | `accessToken: string`, `refreshToken: string \| null`, `expiresIn: number` (сек) | Response всех auth-endpoints |
| `UserResponse` | `id: UUID`, `nickname: string`, `role: Role`, `createdAt: string` | `GET /user`; вложен в сессионные DTO |
| `UserIdResponse` | `id: UUID` | `GET /user/id` |

### 4.2 Session (config + create)

| Тип | Поля | Используется |
|-----|------|--------------|
| `SessionConfigRequest` | `sessionType: SessionType`, `numRounds: number (1..10)`, `numTeams: number (0 \| 2..5)`, `numPlayers: number (2..120)`, `roundSum: number (10..100000)`, `timeoutMoveSec: number (10..300)` | Вложен в `CreateSessionRequest` |
| `CreateSessionRequest` | `displayName: string (3..100)`, `openToConnect?: boolean` (default true), `config: SessionConfigRequest` | `POST /session` |
| `SessionConfigResponse` | Как `SessionConfigRequest` | Вложен в `SessionResponse` |

### 4.3 Session (responses)

| Тип | Поля | Используется |
|-----|------|--------------|
| `SessionPrewResponse` | `id: UUID`, `displayName: string`, `state: SessionState`, `createdAt: string`, `admin: UserResponse` | Вложен в `RoundResponse` |
| `RoundPrewResponse` | `id: UUID`, `roundNumber: number`, `roundPhase: RoundPhase` | Вложен в `SessionResponse.rounds`, `OfferCreatedResponse.round` |
| `TeamPrewResponse` | `id: UUID`, `name: string`, `size: number` | Вложен в `SessionResponse.teams` (без раскрытия members) |
| `TeamResponse` | `id: UUID`, `name: string`, `members: UserResponse[]` | Вложен в `SessionWithTeamsAndMembersResponse.teams` |
| `SessionResponse` | `id: UUID`, `displayName: string`, `state: SessionState`, `createdAt: string`, `admin: UserResponse`, `openToConnect: boolean`, `rounds: RoundPrewResponse[]`, `config: SessionConfigResponse`, `teams: TeamPrewResponse[]`, `currentRound: RoundPrewResponse \| null` | `GET /session/{id}` |
| `SessionWithTeamsAndMembersResponse` | Всё из `SessionResponse` +<br>`teams: TeamResponse[]` (раскрыты members),<br>`members: UserResponse[]` (плоский список),<br>`observers: UserResponse[]` | `POST /session`, `POST /session/{id}/join*`, `GET .../with-teams-and-members`, WS `/topic/.../sessionStatus` |
| `Page<T>` | Spring Page: `content: T[]`, `totalElements`, `totalPages`, `number`, `size`, ... | `GET /session` (list) |

### 4.4 Round + offers + decisions

| Тип | Поля | Используется |
|-----|------|--------------|
| `OfferPrewResponse` | `id: UUID`, `offerValue: number`, `proposer: UserResponse`, `responder: UserResponse \| null`, `createdAt: string` | Вложен в `RoundResponse.offers` |
| `DecisionPrewResponse` | `id: UUID`, `decision: boolean`, `responder: UserResponse`, `offer: OfferPrewResponse`, `createdAt: string` | Вложен в `RoundResponse.decisions` |
| `PendingAction` | `type: PendingActionType`, `offerId?: UUID` | Вложен в `RoundResponse.myPendingActions` |
| `RoundResponse` | `id: UUID`, `roundNumber: number`, `roundPhase: RoundPhase`, `offers: OfferPrewResponse[]`, `decisions: DecisionPrewResponse[]`, `session: SessionPrewResponse`, `myRole: MyRole`, `myPendingActions: PendingAction[]` | `GET /session/{id}/current-round`, `GET /session/{id}/rounds`, WS `/topic/.../roundStatus` |

**Внимание:** REST-запросы (`GET /current-round`) возвращают `myRole` и `myPendingActions`, рассчитанные для authenticated user'а. WS-broadcast `/topic/.../roundStatus` — общий broadcast, `myRole = 'NONE'`, `myPendingActions = []` (нужно пересчитывать локально или сделать GET после roundStatus-события).

### 4.5 WS events (payloads)

| Тип | Поля | Destination |
|-----|------|-------------|
| `OfferCreatedResponse` | `id: UUID`, `round: RoundPrewResponse`, `proposer: UserResponse`, `responder: UserResponse \| null`, `offerValue: number`, `createdAt: string` | `/topic/session/{id}/offerCreated` |
| `AssignedOfferResponse` | `offerId: UUID`, `round: RoundPrewResponse`, `proposer: UserResponse`, `amount: number`, `offeredAt: string` | `/topic/session/{id}/player/{userId}/offer` (персональный) |
| `DecisionMadeResponse` | `id: UUID`, `round: RoundPrewResponse`, `responder: UserResponse`, `offer: OfferCreatedResponse`, `decision: boolean`, `createdAt: string` | `/topic/session/{id}/decisionMade` |
| `OffersShuffledResponse` | `roundId: UUID`, `roundNumber: number`, `pairs: {offerId: UUID, proposerId: UUID, responderId: UUID}[]` | `/topic/session/{id}/offersShuffled` |
| `PlayerScore` | `userId: UUID`, `nickname: string`, `score: number` | Вложен в `SessionScoreDto.players` |
| `TeamScore` | `teamId: UUID`, `name: string`, `score: number` | Вложен в `SessionScoreDto.teams` (пусто для FFA) |
| `SessionScoreDto` | `roundSum: number`, `roundsCompleted: number`, `players: PlayerScore[]`, `teams: TeamScore[]` | `/topic/session/{id}/scoreUpdated` |

### 4.6 SEND-команды (client → server)

| Тип | Поля | Destination |
|-----|------|-------------|
| `CreateOfferCmd` | `amount: number (0..roundSum)` | `/app/session/{id}/offer.create` |
| `MakeDecisionCmd` | `offerId: UUID`, `decision: boolean` | `/app/session/{id}/make.decision` |

Управляющие команды (start/close/open/round.start/round.abort) — тело пустое: `{}` или пустая строка.

### 4.7 Ошибки

| Тип | Поля | Где |
|-----|------|-----|
| `ApiErrorResponse` | `timestamp: string`, `status: number`, `error: string`, `message: string`, `path: string` (`"stomp"` для WS) | Response всех ошибок REST; body в `/user/queue/errors` для WS |

## 5. Ремап полей

| Слой | Имя | Слой | Имя | Комментарий |
|------|-----|------|-----|-------------|
| REST request `CreateOfferCmd` | `amount` | Backend DB / OfferPrewResponse | `offerValue` | В API request — `amount`, в response и DB — `offerValue` |
| `AssignedOfferResponse` | `amount` | (то же самое) | `offerValue` | Аналогично |

Остальные поля — 1:1.

## 6. Runtime-валидация (опция)

Backend меняется. Чтобы уронить фронт **предсказуемо** при рассинхронизации схем — обернуть каждый REST-ответ и WS-payload в `zod`-схему. Решить в T-002/T-001-follow-up: если контракт стабилен и часто регенерится из OpenAPI → не надо; если ожидается drift → надо.
