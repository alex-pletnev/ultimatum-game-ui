---
id: T-005
title: Экран регистрации — «Присесть за стол»
status: done
priority: high
created: 2026-07-15
updated: 2026-07-15
related_code:
  - src/routes/Register.tsx
  - src/routes/Register.test.tsx
  - src/App.tsx
  - src/App.test.tsx
  - src/main.tsx
  - src/components/InkField.tsx
  - src/components/RoleChoice.tsx
related_docs:
  - docs/04-components.md
  - docs/05-api.md
tags: [ui, auth, screen]
---

## Контекст

Первый настоящий экран, который дёргает backend. Пользователь называет никнейм → `POST /auth/quick-register` → сохраняем JWT → redirect на главную. Главная теперь ветвится: не залогинен → CTA «Присесть за стол» (уводит на /register); залогинен → приветствие с ником, кнопка «Выйти».

Форма проектируется в стилистике настолки: не «input с бордером», а «книжная запись», не «Submit», а «Присесть за стол».

## Acceptance criteria

- [x] Route `/register` → `src/routes/Register.tsx`.
- [x] Форма: `nickname` (клиентская валидация 3..42 символа), toggle роли Играющий/Ведущий (PLAYER default).
- [x] Отправка через `useQuickRegister()`. Loading state — кнопка disabled с текстом «занимаете место…» и `cursor-wait`.
- [x] Ошибки: 400 (валидация с сервера) — `message` в blood-alert-record; 5xx / сеть — «Стол не отвечает — попробуй ещё раз».
- [x] При успехе — `navigate('/')`.
- [x] `App.tsx` ветвится: залогинен → `Welcome` (приветствие + монограмма + placeholder-описание + disabled CTA «Открыть лобби» + logout); не залогинен → `TitleCard` с CTA на `/register`.
- [x] Кнопка «Встать из-за стола» использует `useLogout()`, при завершении — `authStorage.clear()` → главная показывает `TitleCard`.
- [x] Дизайн выдержан: пергамент, восковая печать §, тиснёный титул Cinzel, brass-разделители, ember-кнопка, радио как «выбор персонажа» с монограммами P/A на восковых печатях.
- [x] Тесты: (a) короткий nickname → local validation + fetch не вызван; (b) valid + PLAYER default → правильный body + tokens в storage + navigate; (c) ADMIN toggle → role: ADMIN; (d) 400 → message в alert.
- [x] Все проверки: typecheck ✅, lint ✅, test **18/18** ✅ (5 + 6 + 3 + 4), build ✅ (322 KB → 100 KB gzip).
- [x] `docs/04-components.md` дополнен InkField и RoleChoice.

## План

1. `src/components/InkField.tsx` — «пергаментное поле» (label + input) в тон.
2. `src/components/RoleChoice.tsx` — 2 радио-карточки (Игрок / Ведущий), keyboard-accessible.
3. `src/routes/Register.tsx` — форма, обработка mutate, error UI, navigate.
4. Обновить `src/App.tsx` — 2 ветки (залогинен / нет).
5. `src/main.tsx` — добавить route `/register`.
6. Тесты (React Testing Library + mocked fetch) + smoke `pnpm dev`.
7. Проверки + `/task-done`.

## Лог

- 2026-07-15: заведена, переведена в `in_progress`. Первый экран с реальным API.
- 2026-07-15: реализовано. Установил `@testing-library/user-event` (был нужен для симуляции ввода + кликов в тестах). Никаких сюрпризов — интеграция с `useQuickRegister` + `useLogout` заработала с первого раза, race condition c client'ом (в отличие от T-004) не всплыл потому что мутации на разных экранах не пересекаются. Дизайн получился «книжный» — форма ощущается как запись в регистр, а не «Sign Up screen». Переведена в `done`.
