---
id: T-019
title: Round abort + мелкая полировка Session-панели
status: done
priority: medium
created: 2026-07-16
updated: 2026-07-16
related_code:
  - src/routes/Session.tsx
related_docs:
  - docs/05-api.md
tags: [gameplay, ui, admin, polish]
---

## Контекст

ADMIN должен уметь прервать текущий раунд: SEND `/app/session/{id}/round.abort`
→ `phase=ABORTED`. После abort — раунд не переходит автоматически, ADMIN
должен вызвать `round.start` заново (либо перейти к следующему, либо
завершить партию, если abort'нули последний).

Плюс — короткая полировка Session-панели (мелкие CSS/wording'и).

## Acceptance criteria

- [x] `AbortRoundButton` рендерится для ADMIN в active phases (WAIT_OFFERS,
      ALL_OFFERS_RECEIVED, OFFERS_SENT) — под Round-panel, стилизован как
      «опасный» акцент (blood-outline).
- [x] ABORTED-фаза: сообщение «Раунд прерван ведущим» + `RoundResultPanel`
      (там же ADMIN получает кнопку «Следующий раунд» / «Завершить партию»).
- [x] Vitest на новую кнопку. Total 50/50.
- [x] typecheck / lint / vitest — зелёные. Non-gameplay e2e 7/7. Gameplay e2e
      (create/start/full) заблокированы **backend-багом** — см. `BACKEND-FIX-session-column-missing.md`
      (POST /session → 500, `column "auto_advance_rounds" does not exist`).
      Мой код проверен unit'ами; e2e разблокируются после backend-fix'а.

## План

1. Кнопка «Прервать раунд» — маленький компонент inline или в Round-панели.
2. RoundResultPanel показывается и для ABORTED.
3. Vitest.
4. `/task-done`.

## Лог

- 2026-07-16: заведена.
- 2026-07-16: реализовано. По ходу обнаружен backend-баг с недостающей
  колонкой `auto_advance_rounds` (POST /session → 500). Оформлен в
  `BACKEND-FIX-session-column-missing.md` — блокирует gameplay e2e, но не
  мой T-019 код (проверен unit'ами).
