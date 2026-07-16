# BACKEND-FIX — `auto_advance_rounds` column missing

## Симптом

`POST /api/v1/session` возвращает 500, лог:

```
ERROR: column "auto_advance_rounds" of relation "session" does not exist
SQL [insert into session (admin_id,auto_advance_rounds,num_players,...) values (?,?,?,...)]
```

## Причина

Backend в `Session` entity добавил новое поле `autoAdvanceRounds`, но существующая
таблица `session` в Postgres создана до этого. Hibernate `ddl-auto=update` НЕ
добавляет колонку, потому что она (вероятно) объявлена как NOT NULL без DEFAULT,
а таблица содержит данные — Postgres не позволит.

## Фикс (backend)

Два варианта:

1. **Быстро (dev)**: сделать поле nullable или задать default в entity + перезапустить.
   ```kotlin
   @Column(nullable = false)
   val autoAdvanceRounds: Boolean = false  // с default'ом
   ```
   Плюс миграция:
   ```sql
   ALTER TABLE session ADD COLUMN auto_advance_rounds BOOLEAN NOT NULL DEFAULT false;
   ```

2. **Правильно**: добавить Flyway/Liquibase миграцию с ALTER TABLE.

## Как воспроизвести

```bash
curl -sX POST http://localhost:8080/api/v1/session \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H 'Content-Type: application/json' \
  -d '{"displayName":"probe","config":{"sessionType":"FREE_FOR_ALL","numRounds":1,"numTeams":0,"numPlayers":2,"roundSum":100,"timeoutMoveSec":60}}'
# → 500 Internal Server Error
```

## Frontend workaround

Нет — POST /session блокирующий. Ждём backend-fix.

## Frontend affected

- Playwright тесты `create-session.spec.ts`, `start-round.spec.ts`,
  `full-gameplay.spec.ts` — все зависят от POST /session.
- В браузере вручную — тоже создать сессию нельзя.
