# Mobile-adaptive UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Устранить horizontal scroll на iPhone (375–430px portrait) на всех текущих route'ах, гарантировать тач-таргеты ≥44px, не деградировать десктоп.

**Architecture:** In-place mobile-first Tailwind-классы: заменить фиксированные `px-8/py-16/text-Xxl/tracking-*` на `base sm:` пары. Safety-guard `overflow-x-hidden` на html+body. Никаких новых компонентов, никаких изменений UX-логики или анимаций.

**Tech Stack:** TailwindCSS v4, React 19, Vite 6, react-router 7 (BrowserRouter в dev, HashRouter в prod), Framer Motion, Recharts, Playwright.

## Global Constraints

- Не трогать бизнес-логику, WS/API-код, react-query, motion-варианты в `lib/motion.ts`.
- Не менять пути route'ов (`/`, `/register`, `/lobby`, `/lobby/new`, `/session/:id`, `/session/:id/stats`, `/npc`, `/_style-guide`).
- Не менять зависимости.
- Follow existing Tailwind-стиль проекта — inline utility classes, никаких `@apply`.
- Desktop viewport ≥1024px: структура/размеры не деградируют — все правки только через `sm:`/`md:` upgrade.
- Playwright BrowserRouter в dev (`import.meta.env.PROD === false`) — e2e-пути не меняются.

---

## Task 1: Global overflow guard + snapshot baseline

**Files:**
- Modify: `src/index.css`
- Baseline images (не коммитятся): `/tmp/pre-<name>-390.png`

**Interfaces:**
- Consumes: n/a
- Produces: n/a (базовая инфраструктура для последующих визуальных сравнений)

- [ ] **Step 1: Убедиться что dev-сервер поднят**

```bash
curl -sf http://localhost:5173/ > /dev/null && echo "up" || (pnpm dev > /tmp/dev.log 2>&1 & until curl -sf http://localhost:5173/ > /dev/null; do sleep 1; done)
```

Expected: `up` или запуск + ready.

- [ ] **Step 2: Снять baseline (mobile 390px) для auth-free экранов**

```bash
pnpm snap --path / --viewport 390x844 --out /tmp/pre-title-390.png
pnpm snap --path /register --viewport 390x844 --out /tmp/pre-register-390.png
pnpm snap --path /_style-guide --viewport 390x844 --out /tmp/pre-style-390.png
```

Expected: 3 PNG в /tmp. Через Read tool просмотреть — убедиться что видны текущие проблемы (например длинные тексты близко к краю).

- [ ] **Step 3: Добавить overflow-x guard в index.css**

Открыть `src/index.css`. После `@import './styles/tokens.css';` (строка 3) добавить блок:

```css
/*
 * Safety-guard: если один child случайно пробьёт viewport (long word,
 * широкий SVG, фиксированный min-width), не тянуть скролл всей страницы.
 * На iPhone это устраняет самый неприятный класс regression'ов.
 */
html,
body {
  overflow-x: hidden;
}
```

Финальный `src/index.css` — существующий контент плюс этот блок.

- [ ] **Step 4: Проверить что снапшот на 390px не сдвинулся**

```bash
pnpm snap --path / --viewport 390x844 --out /tmp/post-title-390.png
```

Через Read tool сравнить `/tmp/post-title-390.png` с `/tmp/pre-title-390.png`. Изменений быть не должно (safety-guard пока ничего не режет).

- [ ] **Step 5: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: `Test Files 11 passed (11)` и tsc без ошибок.

- [ ] **Step 6: Commit**

```bash
git add src/index.css
git commit -m "$(cat <<'EOF'
style(T-024): safety-guard overflow-x-hidden на html/body

Первый шаг мобильной адаптации: даже если один child случайно пробьёт viewport,
страница не будет тянуться горизонтально.

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 2: TitleCard + Welcome + Register

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/routes/Register.tsx`
- Modify: `src/components/RoleChoice.tsx`

**Interfaces:**
- Consumes: overflow-x guard из Task 1
- Produces: адаптивные обёртки, крупные заголовки, кнопки min-h-11, tracking mobile-first

### `src/App.tsx`

- [ ] **Step 1: Заменить главную `<main>` обёртку**

Old (line 118):
```tsx
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <Parchment className="w-full max-w-xl">
```

New:
```tsx
    <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6 sm:py-16">
      <Parchment className="w-full max-w-xl">
```

- [ ] **Step 2: TitleCard — уменьшить крупный заголовок и tracking sub-caps на mobile**

Old (line 79):
```tsx
        <h1 className="font-display text-5xl font-semibold uppercase tracking-[0.16em] text-ink-950">
```

New:
```tsx
        <h1 className="font-display text-4xl font-semibold uppercase tracking-[0.16em] text-ink-950 sm:text-5xl">
```

Old (lines 74):
```tsx
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
```

New:
```tsx
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600 sm:tracking-[0.4em]">
```

Аналогичный replace для той же строки в Welcome (line 31): `tracking-[0.4em]` → `tracking-[0.3em] sm:tracking-[0.4em]`.

- [ ] **Step 3: Welcome nickname — предотвратить overflow длинного ника**

Old (line 37):
```tsx
        <h1 className="font-display text-4xl uppercase tracking-[0.16em] text-ink-950">
          {user.nickname}
        </h1>
```

New:
```tsx
        <h1 className="w-full break-words font-display text-3xl uppercase tracking-[0.16em] text-ink-950 sm:text-4xl">
          {user.nickname}
        </h1>
```

- [ ] **Step 4: Обе CTA-кнопки (TitleCard + Welcome) — mobile-friendly padding + touch-target**

Обе кнопки имеют одинаковый длинный class-string (App.tsx lines 54 и 99). Найти и заменить `replace_all`:

Old:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)]
```

New:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] sm:px-8 sm:tracking-[0.24em]
```

Использовать `Edit` с `replace_all: true`.

### `src/components/RoleChoice.tsx`

- [ ] **Step 5: Прочитать текущее состояние**

Read `src/components/RoleChoice.tsx` полностью.

- [ ] **Step 6: Обеспечить `min-h-11` на radio-label'ах**

RoleChoice — grid-cols-2 с двумя `<label>`. Проверить touch-target: если тач-цель < 44px по высоте, добавить `min-h-11` на inner-div. Точечная правка (после прочтения файла определить точный class-string).

### `src/routes/Register.tsx`

- [ ] **Step 7: Main wrapper**

Old (line 53):
```tsx
    <main className="grid min-h-screen place-items-center px-6 py-16">
```

New:
```tsx
    <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6 sm:py-16">
```

- [ ] **Step 8: Sub-caps и heading**

Old (line 58):
```tsx
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
              Запись в книгу играющих
            </p>
            <h1 className="font-display text-3xl uppercase tracking-[0.16em] text-ink-950">
              Присесть за стол
            </h1>
```

New:
```tsx
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600 sm:tracking-[0.4em]">
              Запись в книгу играющих
            </p>
            <h1 className="font-display text-2xl uppercase tracking-[0.16em] text-ink-950 sm:text-3xl">
              Присесть за стол
            </h1>
```

- [ ] **Step 9: Submit CTA — full-width на mobile + touch-target**

Old (line 99):
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60"
```

New:
```
className="w-full rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-8 sm:tracking-[0.24em]"
```

### Верификация

- [ ] **Step 10: Snap after (390px + 375px SE)**

```bash
pnpm snap --path / --viewport 390x844 --out /tmp/post-title-390.png
pnpm snap --path / --viewport 375x667 --out /tmp/post-title-375.png
pnpm snap --path /register --viewport 390x844 --out /tmp/post-register-390.png
pnpm snap --path /register --viewport 375x667 --out /tmp/post-register-375.png
```

Через Read tool посмотреть все 4 — убедиться: (a) 0 горизонтального overflow, (b) кнопки с высотой ≥44px, (c) шрифты уменьшились но остались читаемыми.

- [ ] **Step 11: Regression desktop (1280x900)**

```bash
pnpm snap --path / --viewport 1280x900 --out /tmp/post-title-desktop.png
pnpm snap --path /register --viewport 1280x900 --out /tmp/post-register-desktop.png
```

Прочитать через Read — сравнить с ощущением «как было». Структура должна быть идентична (sm-breakpoint = 640px, десктоп получает те же классы что и до правок).

- [ ] **Step 12: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: 11 test files passed.

- [ ] **Step 13: Commit**

```bash
git add src/App.tsx src/routes/Register.tsx src/components/RoleChoice.tsx
git commit -m "$(cat <<'EOF'
style(T-024): TitleCard + Welcome + Register — mobile-adaptive

- Main wrappers: px-4 py-10 sm:px-6 sm:py-16
- Крупные heading'и: text-4xl sm:text-5xl, text-3xl sm:text-4xl
- Sub-caps tracking: 0.3em → 0.4em начиная с sm:
- CTA-кнопки: min-h-11, px-6 sm:px-8, tracking 0.2em sm:0.24em
- Register submit: w-full на mobile
- Welcome nickname: break-words против overflow длинных имён

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 3: Lobby + SessionCard

**Files:**
- Modify: `src/routes/Lobby.tsx`
- Modify: `src/components/SessionCard.tsx`

**Interfaces:**
- Consumes: правила замены из спеки §Rules
- Produces: адаптивная сетка сессий, читаемые карточки на mobile

### `src/routes/Lobby.tsx`

- [ ] **Step 1: Main wrapper (line 158)**

Old:
```tsx
    <div className="mx-auto max-w-5xl px-8 py-16">
```

New:
```tsx
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
```

- [ ] **Step 2: Прочитать LobbyHeader (первые ~50 строк) и определить какие CTA-кнопки нужно поправить**

Read `src/routes/Lobby.tsx` строки 1–100. Identify: `Учредить партию` link CTA + `в лобби` навигация.

- [ ] **Step 3: LobbyHeader «Учредить партию» CTA**

Old (line 34):
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-5 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_3px_0_var(--color-ember-700)] transition hover:translate-y-[-1px]"
```

New:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-5 py-2 font-display text-xs uppercase tracking-[0.2em] text-night-950 shadow-[0_3px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] sm:tracking-[0.24em]"
```

- [ ] **Step 4: Empty/Error state CTA (line 63 и 80)**

Old wrapper:
```tsx
    <Parchment className="mx-auto max-w-lg text-center">
```

New (обе Parchment-обёртки уже max-w-lg, оставить). Внутри — CTA button на line 92:

Old:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2 font-display text-xs uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px]"
```

New:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-2 font-display text-xs uppercase tracking-[0.2em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] sm:tracking-[0.24em]"
```

### `src/components/SessionCard.tsx`

- [ ] **Step 5: Прочитать SessionCard (полный файл)**

Read `src/components/SessionCard.tsx`.

- [ ] **Step 6: Кнопки Join / Спектатор (lines 118 и 152)**

Найти длинные class-string'и (`rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2 ... tracking-[0.24em]`) — заменить (`replace_all: true`):

Old:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2
```

Проверить что только 2 совпадения в файле (Edit с `replace_all` требует единого варианта). Если больше — редактировать по одной. Заменить на:

New:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-2
```

И отдельно `tracking-[0.24em]` → `tracking-[0.2em] sm:tracking-[0.24em]` (replace_all по class-string кнопки).

- [ ] **Step 7: Grid счёт `<dl grid-cols-3>` — 3 узких числа, оставить как есть**

Правки не требуется. `grid-cols-3` с 3 короткими числами помещается на 390-64=326px. Оставить.

### Верификация

- [ ] **Step 8: Snap Lobby (390px) — нужен auth-token**

Backend локально может быть не поднят. В этом случае /lobby без auth редиректится на /. Тогда снимок Lobby делать НЕ через локальный snap, а вручную открыть prod после деплоя.

Попытаться через snap:
```bash
pnpm snap --path /lobby --viewport 390x844 --out /tmp/post-lobby-390.png
```

Если landing на /, значит backend недоступен — пропустить визуальную верификацию Lobby, полагаться на post-deploy prod check пользователем.

- [ ] **Step 9: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: 11 passed.

- [ ] **Step 10: Commit**

```bash
git add src/routes/Lobby.tsx src/components/SessionCard.tsx
git commit -m "$(cat <<'EOF'
style(T-024): Lobby + SessionCard — mobile-adaptive

- Обёртка: px-4 py-10 sm:px-8 sm:py-16
- CTA (Учредить, Join, Спектатор): min-h-11 + tracking 0.2em sm:0.24em
- SessionCard счёт grid-cols-3 оставлен — 3 коротких числа помещаются

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 4: CreateSession

**Files:**
- Modify: `src/routes/CreateSession.tsx`

**Interfaces:**
- Consumes: правила замены из спеки
- Produces: адаптивная форма учреждения партии

- [ ] **Step 1: Main wrapper (line 93)**

Old:
```tsx
    <main className="grid min-h-screen place-items-center px-6 py-16">
```

New:
```tsx
    <main className="grid min-h-screen place-items-center px-4 py-10 sm:px-6 sm:py-16">
```

- [ ] **Step 2: Sub-caps + heading (lines 98, 101)**

Old:
```tsx
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
              Устав новой партии
            </p>
            <h1 className="font-display text-3xl uppercase tracking-[0.16em] text-ink-950">
              Учредить партию
            </h1>
```

New:
```tsx
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600 sm:tracking-[0.4em]">
              Устав новой партии
            </p>
            <h1 className="font-display text-2xl uppercase tracking-[0.16em] text-ink-950 sm:text-3xl">
              Учредить партию
            </h1>
```

- [ ] **Step 3: NumberStepper grid (line 153) — стакнуть на 1 колонку на mobile**

Old:
```tsx
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
```

New:
```tsx
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3">
```

- [ ] **Step 4: Submit CTA (line 207) — full-width на mobile**

Old:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-8 py-3 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60"
```

New:
```
className="w-full rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-3 font-display text-sm uppercase tracking-[0.2em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] hover:shadow-[0_5px_0_var(--color-ember-700)] active:translate-y-[1px] active:shadow-[0_2px_0_var(--color-ember-700)] disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:px-8 sm:tracking-[0.24em]"
```

- [ ] **Step 5: Sub-caps в fieldset legend (line 118)**

Old:
```tsx
            <legend className="font-mono text-[10px] uppercase tracking-[0.35em] text-brass-600">
```

New:
```tsx
            <legend className="font-mono text-[10px] uppercase tracking-[0.25em] text-brass-600 sm:tracking-[0.35em]">
```

### Верификация

- [ ] **Step 6: Snap CreateSession — только через ADMIN, backend нужен**

```bash
pnpm snap --path /lobby/new --viewport 390x844 --register admin --out /tmp/post-create-390.png
```

Если backend не поднят — команда упадёт при регистрации. Пропустить визуальную верификацию, оставить пользователю проверить на prod.

- [ ] **Step 7: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: 11 passed. Register/CreateSession-тесты не должны падать — правки чисто стилевые.

- [ ] **Step 8: Commit**

```bash
git add src/routes/CreateSession.tsx
git commit -m "$(cat <<'EOF'
style(T-024): CreateSession — mobile-adaptive

- Main wrapper: px-4 py-10 sm:px-6 sm:py-16
- Heading: text-2xl sm:text-3xl, sub-caps tracking mobile-first
- NumberStepper grid: 1-col mobile → 2/3-col на sm/md
- Submit CTA: w-full mobile, min-h-11, px-6 sm:px-8

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 5: Session (gameplay + результаты) + AddNpcPanel

**Files:**
- Modify: `src/routes/Session.tsx`
- Modify: `src/components/AddNpcPanel.tsx`

**Interfaces:**
- Consumes: правила замены
- Produces: играбельная в портрете session-панель, adjusted score-grid

### `src/routes/Session.tsx`

Session.tsx длинный (~950 строк). Замены — точечные по правилам спеки.

- [ ] **Step 1: Main wrappers (loading state, error state, main render)**

Все три обёртки:

Loading (line 678): `<div className="mx-auto max-w-3xl px-8 py-16">`
Error (line 690): `<div className="mx-auto max-w-lg px-8 py-16">`
Main (line 717): `<div className="mx-auto max-w-3xl px-8 py-16">`

Заменить каждый `px-8 py-16` на `px-4 py-10 sm:px-8 sm:py-16` (три отдельных Edit).

- [ ] **Step 2: Header tracking (line 720)**

Old:
```tsx
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
```

New:
```tsx
          <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500 sm:tracking-[0.4em]">
```

- [ ] **Step 3: Session displayName (line 730)**

Old:
```tsx
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
```

New:
```tsx
          <h1 className="mt-2 font-display text-2xl uppercase tracking-[0.16em] text-parchment-100 sm:text-3xl">
```

- [ ] **Step 4: Header flex — стакнуть navigation на mobile**

Header использует `flex items-baseline justify-between` (line 718). На узком экране левый блок с длинным session-name может теснить правый navigation. Заменить:

Old:
```tsx
      <header className="mb-10 flex items-baseline justify-between border-b border-brass-500/30 pb-6">
```

New:
```tsx
      <header className="mb-8 flex flex-col gap-4 border-b border-brass-500/30 pb-6 sm:mb-10 sm:flex-row sm:items-baseline sm:justify-between">
```

- [ ] **Step 5: Round-панель heading (line 826)**

Old:
```tsx
              <h2 className="font-display text-2xl uppercase tracking-[0.16em] text-ink-950">
                Раунд {round.roundNumber} / {session.config.numRounds}
              </h2>
```

New:
```tsx
              <h2 className="font-display text-xl uppercase tracking-[0.16em] text-ink-950 sm:text-2xl">
                Раунд {round.roundNumber} / {session.config.numRounds}
              </h2>
```

- [ ] **Step 6: Sub-caps «Партия идёт/окончена/etc» tracking (line 820)**

Old:
```tsx
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-600">
```

New:
```tsx
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-600 sm:tracking-[0.4em]">
```

- [ ] **Step 7: Section-caps «За столом / Устав партии» (lines 756, 780)**

Найти паттерн `tracking-[0.35em] text-brass-500` во всём файле и заменить `replace_all`:

Old:
```
tracking-[0.35em] text-brass-500
```

New:
```
tracking-[0.25em] text-brass-500 sm:tracking-[0.35em]
```

- [ ] **Step 8: Все CTA-кнопки в Session (start round, next round, submit offer, accept/reject, abort, complete)**

Много кнопок с одинаковыми class-string'ами. Их надо найти и заменить пропатчить каждую (или через replace_all по паттернам).

Основные паттерны:

Pattern A (ember primary): `px-6 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950` → добавить `min-h-11`, заменить tracking на `tracking-[0.2em] ... sm:tracking-[0.24em]`.

Pattern B (verdigris accept): `bg-verdigris-500/90 px-4 py-2 font-display text-sm uppercase tracking-[0.2em]` (line 260) — добавить `min-h-11`.

Pattern C (blood reject): `bg-blood-500/90 px-4 py-2 font-display text-sm uppercase tracking-[0.2em]` (line 268) — добавить `min-h-11`.

Pattern D (ember big CTA line 938): `px-8 py-3 font-display text-sm uppercase tracking-[0.24em]` — заменить `px-8` на `px-6 sm:px-8`, добавить `min-h-11`, tracking mobile-first.

Через Grep найти каждый паттерн, через Edit заменить точечно (либо replace_all если паттерн уникален).

Конкретные Edit-операции определить в момент исполнения, читая соответствующие строки файла.

- [ ] **Step 9: Score-grid `<dl grid-cols-2>` (line 785) — оставить как есть**

`grid-cols-2` для 4 stat-cells (Мест/Раундов/Ставка/Тип) — на mobile 2 колонки помещаются. Не трогаем.

### `src/components/AddNpcPanel.tsx`

- [ ] **Step 10: Read AddNpcPanel полностью**

Read `src/components/AddNpcPanel.tsx`.

- [ ] **Step 11: Обе CTA-кнопки (line 204 и 275)**

Одинаковый class-string:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-4 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)]
```

Через `replace_all: true`:

Old:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-4 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950
```

New:
```
rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-4 py-2 font-display text-sm uppercase tracking-[0.2em] text-night-950 sm:tracking-[0.24em]
```

- [ ] **Step 12: Grid strategies-list (line 226)**

Old:
```tsx
          <div className="grid grid-cols-2 gap-3">
```

Оставить как есть — 2 колонки с короткими strategy-названиями помещаются на 390px.

### Верификация

- [ ] **Step 13: Snap Session (через backend, скорее всего скипается локально)**

Пропустить если backend нет. Оставить визуальную проверку пользователю после деплоя.

- [ ] **Step 14: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -20
```

Expected: 11 passed. Session.gameplay.test.tsx (11 тестов) не должен падать — правки стилевые.

- [ ] **Step 15: Commit**

```bash
git add src/routes/Session.tsx src/components/AddNpcPanel.tsx
git commit -m "$(cat <<'EOF'
style(T-024): Session gameplay + AddNpcPanel — mobile-adaptive

- Wrappers: px-4 py-10 sm:px-8 sm:py-16 (loading/error/main)
- Header: flex-col mobile → row sm+, sub-caps mobile tracking
- Round heading: text-xl sm:text-2xl
- Все CTA (start/next/accept/reject/abort/complete/npc): min-h-11
  + tracking 0.2em sm:0.24em, big-CTA px-6 sm:px-8

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 6: Stats + Npc

**Files:**
- Modify: `src/routes/Stats.tsx`
- Modify: `src/routes/Npc.tsx`

**Interfaces:**
- Consumes: правила замены
- Produces: адаптивные stats-cards, читаемая leaderboard-таблица, npc-кабинет

### `src/routes/Stats.tsx`

- [ ] **Step 1: Main wrappers (lines 469, 482)**

Обе `<div className="mx-auto max-w-4xl px-8 py-16">` — заменить `px-8 py-16` → `px-4 py-10 sm:px-8 sm:py-16`.

- [ ] **Step 2: Recharts margin — снять негативный left**

Найти в Stats.tsx все `margin={{ top: N, right: N, left: -N, bottom: N }}` — заменить `left: -20` на `left: 0` (на mobile -20 обрезает Y-axis label). Если есть несколько чартов — все аналогично.

Grep-найти `margin=`, посмотреть контексты, заменить точечно.

- [ ] **Step 3: Section titles tracking (line 129)**

Old:
```tsx
      <span className="font-mono text-[11px] uppercase tracking-[0.35em] text-brass-600">
```

New:
```tsx
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-brass-600 sm:tracking-[0.35em]">
```

- [ ] **Step 4: Leaderboard-таблица — обернуть в overflow-x-auto**

Leaderboard-функция начинается в line 81. Обёртка (line 83):
```tsx
    <div className="overflow-hidden rounded-panel border border-brass-500/30">
```

Заменить `overflow-hidden` на `overflow-x-auto`:
```tsx
    <div className="overflow-x-auto rounded-panel border border-brass-500/30">
```

- [ ] **Step 5: Sub-caps в headers**

Найти `tracking-[0.2em] text-brass-700` в Leaderboard `<thead>` (line 85) — 0.2em уже минимальный, оставить.

### `src/routes/Npc.tsx`

- [ ] **Step 6: Main wrapper (line 324)**

Old:
```tsx
    <div className="mx-auto max-w-5xl px-8 py-16">
```

New:
```tsx
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
```

- [ ] **Step 7: Header — стакнуть на mobile**

Old (line 325):
```tsx
      <header className="mb-10 flex items-end justify-between border-b border-brass-500/30 pb-6">
```

New:
```tsx
      <header className="mb-8 flex flex-col gap-4 border-b border-brass-500/30 pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
```

- [ ] **Step 8: Sub-caps (line 327)**

Old:
```tsx
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-brass-500">
            Кабинет ведущего
          </p>
```

New:
```tsx
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brass-500 sm:tracking-[0.4em]">
            Кабинет ведущего
          </p>
```

- [ ] **Step 9: Heading (line 330)**

Old:
```tsx
          <h1 className="mt-2 font-display text-3xl uppercase tracking-[0.16em] text-parchment-100">
            Отряд ботов
          </h1>
```

New:
```tsx
          <h1 className="mt-2 font-display text-2xl uppercase tracking-[0.16em] text-parchment-100 sm:text-3xl">
            Отряд ботов
          </h1>
```

- [ ] **Step 10: NPC-forma «Выковать» CTA (line 435)**

Big CTA:
Old:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile px-6 py-2 font-display text-sm uppercase tracking-[0.24em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50"
```

New:
```
className="rounded-panel border border-ember-600/40 bg-ember-500 press-tactile min-h-11 px-6 py-2 font-display text-sm uppercase tracking-[0.2em] text-night-950 shadow-[0_4px_0_var(--color-ember-700)] transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50 sm:tracking-[0.24em]"
```

- [ ] **Step 11: NPC-cards в списке — «разжаловать» button min-h-11 (line 260)**

Old:
```
className="rounded-panel border border-blood-500/40 bg-transparent px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-blood-500 transition hover:bg-blood-500/10 disabled:cursor-not-allowed disabled:opacity-50"
```

New:
```
className="rounded-panel border border-blood-500/40 bg-transparent min-h-11 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.3em] text-blood-500 transition hover:bg-blood-500/10 disabled:cursor-not-allowed disabled:opacity-50"
```

- [ ] **Step 12: VENGEFUL/ADAPTIVE param-grids (lines 123, 174) — 1-col на mobile**

Old:
```tsx
        <div className="grid grid-cols-2 gap-3">
```

Обе (около 3-х параметров каждая) — стакнуть на mobile:

New:
```tsx
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
```

Через `replace_all: true` на конкретной строке (если она уникальна для strategy-param'ов) — или два отдельных Edit после чтения контекста.

### Верификация

- [ ] **Step 13: pnpm typecheck && pnpm test**

```bash
pnpm typecheck && pnpm test 2>&1 | tail -10
```

Expected: 11 passed.

- [ ] **Step 14: Commit**

```bash
git add src/routes/Stats.tsx src/routes/Npc.tsx
git commit -m "$(cat <<'EOF'
style(T-024): Stats + NPC-кабинет — mobile-adaptive

- Wrappers: px-4 py-10 sm:px-8 sm:py-16
- Recharts margin.left: 0 (было -20 — обрезало Y-axis на mobile)
- Leaderboard-таблица: overflow-x-auto вместо overflow-hidden
- NPC header: flex-col mobile → row sm+
- Strategy param-grids (VENGEFUL/ADAPTIVE): 1-col mobile → 2-col sm
- CTA: min-h-11, tracking mobile-first

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
```

---

## Task 7: StyleGuide + final regression + task-done

**Files:**
- Modify: `src/routes/StyleGuide.tsx` (dev-only, low prio)
- Modify: `docs/tasks/T-024-mobile-adaptive-ui.md` (mark done)
- Modify: `docs/tasks/INDEX.md`

**Interfaces:**
- Consumes: все правки Task 1–6
- Produces: закрытая T-024 в трекере, prod-deploy запущен

- [ ] **Step 1: StyleGuide main wrapper (line 100)**

Old:
```tsx
    <div className="mx-auto max-w-5xl px-8 py-16">
```

New:
```tsx
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-16">
```

Остальные grid'ы `grid-cols-4/6/11` — dev-only и специфичны для tokens showcase, не трогаем.

- [ ] **Step 2: Final regression: build + все автоматические проверки**

```bash
pnpm typecheck && pnpm test && VITE_API_BASE_URL=https://158-160-48-113.nip.io/api/v1 VITE_WS_URL=wss://158-160-48-113.nip.io/api/v1/ws pnpm build 2>&1 | tail -20
```

Expected: 11 test files passed, tsc clean, build succeeded, dist ссылается на `/ultimatum-game-ui/`.

- [ ] **Step 3: Snap финальные (390px + 375px SE + 430px Plus + 1280x900 desktop)**

```bash
for VP in 375x667 390x844 430x932 1280x900; do
  pnpm snap --path / --viewport $VP --out /tmp/final-title-$VP.png
  pnpm snap --path /register --viewport $VP --out /tmp/final-register-$VP.png
  pnpm snap --path /_style-guide --viewport $VP --out /tmp/final-style-$VP.png
done
```

Прочитать все 12 через Read tool — визуально проверить: 0 горизонтального overflow, кнопки крупные, шрифты читаемы, desktop не деградировал.

- [ ] **Step 4: E2E-тесты (если backend поднят)**

```bash
curl -sf http://localhost:8080/api/v1/actuator/health && pnpm test:e2e 2>&1 | tail -20 || echo "backend down, skipping e2e"
```

Expected: если backend up — e2e зелёные (Playwright ходит по BrowserRouter в dev, стилевые правки не ломают селекторы). Если down — пропускаем.

- [ ] **Step 5: Обновить T-024 таск-файл — все AC отмечены, статус done**

Edit `docs/tasks/T-024-mobile-adaptive-ui.md`:
- Frontmatter: `status: done`, `updated: 2026-07-17`.
- Отметить все `[ ]` → `[x]` в `## Acceptance criteria`.
- Добавить в `## Лог`:
  ```
  - 2026-07-17: закрыта. Правки применены к App, Register, Lobby, SessionCard,
    CreateSession, Session, AddNpcPanel, Stats, Npc, StyleGuide + safety-guard
    overflow-x-hidden. Локальные snap'ы 375/390/430/1280 — 0 overflow, десктоп
    не деградировал. Осталось: пользователю проверить prod на iPhone после деплоя.
  ```

- [ ] **Step 6: Обновить INDEX.md**

Переместить T-024 из «Открытые задачи» в «Закрытые задачи», статус `done`, дата закрытия `2026-07-17`.

- [ ] **Step 7: Commit + push**

Единый финальный commit с StyleGuide + task-done изменениями:

```bash
git add src/routes/StyleGuide.tsx docs/tasks/T-024-mobile-adaptive-ui.md docs/tasks/INDEX.md
git commit -m "$(cat <<'EOF'
style(T-024): StyleGuide wrapper + close task

- StyleGuide: обёртка px-4 py-10 sm:px-8 sm:py-16
- T-024 → done, все AC отмечены
- INDEX.md: перемещена в закрытые

Refs: docs/tasks/T-024-mobile-adaptive-ui.md
EOF
)"
git push origin main 2>&1 | tail -5
```

Ждём GH Actions deploy (автоматически по push в main). Пользователь через ~2 минуты проверяет prod на iPhone.

- [ ] **Step 8: Отчитаться пользователю**

Финальное сообщение: «T-024 закрыта, все 7 коммитов запушены, GH Actions запустился. Через пару минут открывай https://alex-pletnev.github.io/ultimatum-game-ui/ на iPhone и проверяй: регистрация → лобби → создание партии → gameplay → stats без горизонтального свайпа. Если где-то ещё жмёт — заведу T-025.»

---

## Self-Review Checklist

**Spec coverage:**

| Spec §Success criteria | Purchase task |
|-----------------------|----------------|
| 0 горизонтального скролла на 375/390/430 | Task 1 (guard) + Task 2-6 (per-screen) + Task 7 (verify) |
| Тач-таргеты ≥44px | Task 2-6 добавляют `min-h-11` ко всем CTA |
| Читаемые шрифты (text-sm+ body, text-2xl+ headings) | Task 2-6 mobile-first heading sizes |
| Desktop не деградировал | Task 2 Step 11 (regression snap) + Task 7 Step 3 |
| `pnpm test/typecheck/build/test:e2e` зелёные | Каждый Task Verification + Task 7 final |
| Пользователь проходит happy-path без жалоб | Task 7 Step 8 (post-deploy check пользователем) |

**Placeholder scan:** Нет «TODO», нет «similar to X», код показан inline. ✓

**Type consistency:** правки чисто CSS-class-string, TypeScript не тронут. ✓

Готово.
