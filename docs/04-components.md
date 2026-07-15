# 04. Components

Карта UI-компонентов. Пока плейсхолдер — кода нет.

## Планируемая иерархия

```
src/components/
  ui/              # shadcn-style примитивы (Button, Card, Dialog, Input)
  game/            # игровые элементы
    Board          # игровое поле
    Card           # игровая карта / предложение
    Token          # фишка / индикатор игрока
    Deck           # колода
    OfferPanel     # интерфейс предложения (Proposer)
    ResponsePanel  # интерфейс принятия/отклонения (Responder)
    RoundLog       # лента раундов, как в настолке
  layout/          # обёртки, «стол», «полки правил»
```

Правило naming: **не «Modal» — а «RulesBook»**, **не «Toast» — а «HerderCallout»** (голос ведущего). Компоненты должны читаться как элементы настолки, а не веб-приложения.

## Готовые компоненты

| Имя | Файл | Назначение | Пропсы |
|-----|------|------------|--------|
| `Parchment` | `src/components/Parchment.tsx` | Базовая «карта / свиток» — тёплый бежевый фон, edge-vignette, brass-рамка, глубокая тень «лист под свечой». Обёртка для содержимого игровых карт | `children`, `className?` |
| `WaxSeal` | `src/components/WaxSeal.tsx` | Восковая печать с монограммой — SVG (radial-gradient + noise-filter). Основной акцент титульных экранов, декоративный разделитель | `size?` (default 88), `monogram?` (default `"U"`), `className?` |
| `InkField` | `src/components/InkField.tsx` | «Чернильная запись» — поле ввода на пергаменте с brass-подчёркиванием, italic body-шрифт, ember-каретка. Поддерживает `hint` и `error`, ARIA-атрибуты корректны | `label`, `hint?`, `error?` + все `<input>`-атрибуты |
| `RoleChoice` | `src/components/RoleChoice.tsx` | Radio-toggle «выбор персонажа» — 2 карточки с восковой печатью, ember-акцент на выбранной | `value: AssignableRole`, `onChange`, `name?` |

## Design tokens

Живут в `src/styles/tokens.css` (Tailwind v4 `@theme`-блок). Доступны как Tailwind-утилиты автоматически.

### Палитра

| Группа | Метафора | Shades | Использование |
|--------|----------|--------|---------------|
| `night` | Стол в полутьме | 50–950 | Фоны, тёмные поверхности («войлок стола») |
| `parchment` | Пергамент, свитки | 50–500 | Игровые карты, тексты на пергаменте |
| `ink` | Чернила | 900, 950 | Текст на пергаменте, тиснение |
| `ember` | Свеча, Claude-accent | 300–700 | Действия, hover, «пламя» |
| `brass` | Латунь | 300–600 | Рамки, инициалы, разделители |
| `blood` | Сургуч, отказ | 400–600 | Reject, danger, wax-seal ядро |
| `verdigris` | Окисленная медь | 500, 600 | Cool balance, secondary tokens |

### Типографика

| Роль | Шрифт (Tailwind class) | Когда |
|------|------------------------|-------|
| Заголовки, титулы, wax-seal | `font-display` → Cinzel | Все uppercase-тексты, номера раундов, названия сессий |
| Body, «книга правил» | `font-body` → EB Garamond | Описания, инструкции, тексты офферов |
| System, «голос ведущего» | `font-mono` → JetBrains Mono | Служебные подписи, счётчики, session-id, роли |

### Тени

| Токен | Метафора |
|-------|----------|
| `--shadow-parchment` | Лист над столом (нижняя тень + мягкая рассеянная) |
| `--shadow-candlelit` | Тёплое пятно свечи + inset-highlight |
| `--shadow-wax-inset` | Оттиск в воске (inset-тень для рельефа) |

### Радиусы

| Токен | Метафора |
|-------|----------|
| `--radius-panel` (2px) | Жёсткие деревянные панели |
| `--radius-card` (6px) | Потёртые игровые карты |
| `--radius-inset` (3px) | Внутренние декор-элементы |
| `--radius-token` (999px) | Круглые фишки |

Живая демонстрация — dev-route `/_style-guide` (`src/routes/StyleGuide.tsx`).

## Правила добавления компонента

1. Проверить, нет ли уже.
2. Использовать `wheel-check` для non-trivial случая.
3. Файл в правильной подпапке (см. иерархию).
4. Обновить таблицу «Готовые компоненты» выше.
