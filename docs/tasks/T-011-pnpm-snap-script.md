---
id: T-011
title: pnpm snap — ad-hoc screenshot скрипт из consolidation
status: done
priority: low
created: 2026-07-15
updated: 2026-07-15
related_code:
  - scripts/snap.mjs
  - package.json
  - CLAUDE.md
related_docs:
  - CLAUDE.md
tags: [meta, tooling]
---

## Контекст

Из consolidation (после T-010): агент 5 раз копировал inline-скрипт `snap-tmp.mjs`, чтобы сделать playwright-screenshot конкретной страницы и прочитать его через Read tool. Формализуем как `pnpm snap <path>` — скрипт `scripts/snap.mjs` c регистрацией уникального ника, path'ом и опциональным before-action.

## Acceptance criteria

- [x] `scripts/snap.mjs` — принимает `--path` (default `/`), `--out` (default `/tmp/snap.png`), `--register admin|player`, `--base`, `--viewport WxH`, `--wait`. Использует `chromium` из `@playwright/test`.
- [x] Скрипт `snap` в `package.json`. Использование (pnpm 11 без `--`): `pnpm snap --path /lobby --register admin --out /tmp/x.png`.
- [x] CLAUDE.md — «Ad-hoc snapshot без падающего теста» рядом с E2E-loop секцией.
- [x] Проверки: `pnpm snap --path /_style-guide` работает (512 KB PNG), `pnpm snap --path /lobby --register admin` работает (регистрирует ADMIN → snap на /lobby).

## План

1. Написать `scripts/snap.mjs`.
2. Добавить script в package.json.
3. Обновить CLAUDE.md.
4. Проверить работоспособность.
5. `/task-done`.

## Лог

- 2026-07-15: заведена по итогам /consolidate. Приоритет low — не блокирует ничего продуктового, но убирает копипаст.
- 2026-07-15: реализовано. Node `parseArgs` не любит `--` (получает как unexpected positional) — pnpm 11 не требует sentinel'а, обновил доку. Скрипт `scripts/snap.mjs` использует `chromium` из уже-установленного `@playwright/test`, регистрирует уникального `snap-<hex>` при `--register`. Переведена в `done`.
