# BACKEND FIX: `GET /session` не отдаёт membersCount + не закрывает полные сессии

## Симптом (на фронте)

В лобби карточка сессии показывала «0/2 мест» при попытке присоединиться —
`POST /session/{id}/join` → **400** с сообщением `«В сессии {id} достигнуто
максимальное количество игроков (2 из 2)»`. То есть бэк корректно отклоняет
join, но:

1. `GET /session?openToConnect=true&state=CREATED` **всё равно возвращает эту
   полную сессию**.
2. В её DTO нет поля, по которому фронт мог бы вычислить занятые места —
   для `FREE_FOR_ALL` (`numTeams=0`) `teams: []`, а `SessionResponse` не
   содержит `members` или `membersCount`.

## Воспроизвести

```bash
# 1. Создать сессию с numPlayers=2
TOKEN=$(curl -sX POST http://localhost:8080/api/v1/auth/quick-register \
  -H 'Content-Type: application/json' \
  -d '{"nickname":"adm-'$(date +%s)'","role":"ADMIN"}' | jq -r .accessToken)

SESSION_ID=$(curl -sX POST http://localhost:8080/api/v1/session \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"displayName":"full-check","config":{"sessionType":"FREE_FOR_ALL",
       "numRounds":1,"numTeams":0,"numPlayers":2,"roundSum":100,
       "timeoutMoveSec":60}}' | jq -r .id)

# 2. Заполнить оба места (admin + один player)
P1=$(curl -sX POST http://localhost:8080/api/v1/auth/quick-register \
  -H 'Content-Type: application/json' \
  -d '{"nickname":"p1-'$(date +%s)'","role":"PLAYER"}' | jq -r .accessToken)
curl -sX POST -H "Authorization: Bearer $P1" \
  "http://localhost:8080/api/v1/session/$SESSION_ID/join"

# 3. Смотрим list — сессия всё ещё видна как open
curl -sH "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/session?openToConnect=true&state=CREATED" \
  | jq '.content[] | select(.id=="'$SESSION_ID'") | {id, openToConnect, teams}'
# → openToConnect: true, teams: []   ← ошибка
```

## Ожидаемое поведение

Один из двух вариантов (либо оба):

### Вариант A — включить `membersCount` в `SessionResponse`

Проще на фронте, минимальное изменение контракта. Достаточно добавить одно поле:

```jsonc
{
  "id": "...",
  "displayName": "...",
  "state": "CREATED",
  "openToConnect": true,
  "config": { "numPlayers": 2, ... },
  "teams": [],
  "membersCount": 2,          // ← новое; для TEAM_BATTLE = сумма team.size,
                              //   для FREE_FOR_ALL = число вошедших игроков
  ...
}
```

Фронт использует `membersCount` вместо `teams.reduce(...size)`. Работает для
FFA и TEAM_BATTLE единообразно.

### Вариант B — автоматически закрывать полные сессии

При каждом успешном `join` / `join-npc` проверять, если `members.size >=
config.numPlayers` — сервисно выставлять `session.openToConnect = false` и
публиковать `sessionStatus`. Тогда `GET /session?openToConnect=true` физически
не вернёт полную сессию, и вопрос отпадает сам.

**Оба варианта не взаимоисключающие** — идеально сделать оба. `openToConnect=false`
на полных сессиях + `membersCount` в ответе даст фронту устойчивость и к race'ам
(если два человека одновременно жмут «Заявиться»).

## Временный фикс на фронте (уже в `main`)

`SessionCard` тянет `GET /session/{id}/with-teams-and-members` per-card (react-query
дедупит запрос с полностраничной подпиской в `Session.tsx`) и:

- показывает реальное `taken = details.members.length`;
- заменяет кнопку `Заявиться в партию` на disabled `Мест больше нет`, если
  `taken >= numPlayers`.

Это N+1 запросов на страницу лобби, что приемлемо при page-size=8, но неверно
при росте. Backend-fix отменит N+1.

## Файлы бэка (по памяти прошлых spec'ов)

- Скорее всего `SessionResponse` собирается где-то в `service/SessionQueryService`
  или `mapper/SessionResponseMapper`. Добавить `membersCount: session.members.size`
  в проекции.
- Точка проверки полноты — `SessionService.join(sessionId, userId)` /
  `NpcService.joinNpc(sessionId, npcId)` /
  `NpcService.bulkAttachNpcs(sessionId, ...)`. После инкремента members —
  `if (session.members.size >= session.config.numPlayers) session.openToConnect = false`.

## Приоритет

Medium — не блокирующий, но заметный UX-баг (пользователь тыкает в полную
сессию и получает 400).
