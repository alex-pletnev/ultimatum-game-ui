# BACKEND-FIX — `IndexSqlInitializer` фильтрует ALTER TABLE из-за ведущих `--` комментариев

## Симптом

После коммита `c19cf56` (fix T-084) в `index.sql` добавлен ALTER TABLE
для колонки `auto_advance_rounds`. Приложение перезапускается, лог показывает:

```
IndexSqlInitializer - Применяем index.sql: 3 statements
IndexSqlInitializer - execute: CREATE EXTENSION IF NOT EXISTS pg_trgm
IndexSqlInitializer - execute: CREATE INDEX IF NOT EXISTS idx_session_name_trgm ...
IndexSqlInitializer - execute: CREATE UNIQUE INDEX IF NOT EXISTS ix_npc_profile_user_id ...
IndexSqlInitializer - index.sql применён успешно
```

**«3 statements», а не 4** — ALTER TABLE пропущен. POST /session продолжает падать
500 с `column "auto_advance_rounds" does not exist`.

## Причина

`IndexSqlInitializer.applyIndexSql()`:

```kotlin
val statements = sql.split(";")
    .map { it.trim() }
    .filter { it.isNotBlank() && !it.startsWith("--") }
```

Split по `;` даёт четвёртый chunk такого вида:

```
-- T-084: Hibernate ddl-auto=update не добавляет NOT NULL колонки без DEFAULT
-- в непустые таблицы. Дотягиваем SessionConfig.autoAdvanceRounds (T-076) явно
-- и идемпотентно до появления полноценной миграции (T-044).
ALTER TABLE session
    ADD COLUMN IF NOT EXISTS auto_advance_rounds BOOLEAN NOT NULL DEFAULT FALSE
```

Filter `!it.startsWith("--")` отсекает **весь блок**, потому что trim'нутый chunk
начинается с `--`. Реальный `ALTER TABLE` теряется.

## Фикс

Два варианта:

1. **Быстрый**: убрать `--`-комменты перед `ALTER TABLE` в `index.sql` (или
   перенести их выше первого `CREATE EXTENSION`).

2. **Правильный**: в `IndexSqlInitializer` фильтровать построчно — оставлять
   только не-`--` строки, а затем проверять `isNotBlank()`:
   ```kotlin
   .map { chunk -> chunk.lines().filter { !it.trim().startsWith("--") }.joinToString("\n").trim() }
   .filter { it.isNotBlank() }
   ```

## Как проверить

После fix'а лог должен показывать «4 statements», POST /session вернёт 201.

## Frontend affected

- Всё, что упирается в POST /session и в любой GET, читающий `session` entity
  (то есть GET /session/{id}/*, GET /statistics/{id}/csv и т.д.).
- Manual smoke Stats-страницы (T-020) требует хотя бы одной успешно
  проигранной сессии.
