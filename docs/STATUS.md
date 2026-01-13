# STATUS / TASKS (публично)

Этот файл — **единая точка правды** по прогрессу проекта.  
Если контекст/чат сбросился — открывай **этот файл** и продолжай с ближайших пунктов.

---

## TL;DR: что уже работает

- React/TS приложение с “детским режимом” и **ленивой загрузкой историй**:
  - грузим [`public/stories/manifest.json`](public/stories/manifest.json)
  - по выбору — грузим `story.json` выбранной истории
- **Выбор истории**: полноэкранный оверлей с крупными карточками.
- **Переключатель языка RU/EN** через i18n.
- **Сцена фуллскрин** (под top bar), зоны поверх изображения.
- Интеракции зон:
  - tap → play
  - long-press → repeat
  - double-tap → stop
- Озвучка: **TTS (Web Speech API) как базовый режим**, подготовлен слой под mp3-sprite (по `startMs`).

---

## Done (сделано)

- [x] Структура контента: `manifest.json` → `story.json` → scenes → zones.
- [x] Истории грузятся **лениво**, не держим все истории в памяти.
- [x] RU/EN переключатель.
- [x] В story.json зоны поддерживают `ttsKey` (i18n) и `audioCueId` (под mp3-sprite).
- [x] Исправлена структура i18n ресурсов (ключи не “светятся” как текст).
- [x] Добавлена реальная сцена-изображение 1-й истории:
  - [`public/assets/images/story-001/scene-001.png`](public/assets/images/story-001/scene-001.png)
- [x] Зоны на сцене 1 расставлены (дом/солнце/курица/дерево/забор) в:
  - [`public/stories/story-001/story.json`](public/stories/story-001/story.json)
- [x] Подготовка к GitHub open-source:
  - [`README.md`](README.md)
  - [`LICENSE`](LICENSE)
  - [`CONTRIBUTING.md`](CONTRIBUTING.md)
  - [`SECURITY.md`](SECURITY.md)
  - [`.github/ISSUE_TEMPLATE/bug_report.md`](.github/ISSUE_TEMPLATE/bug_report.md)
  - [`.github/ISSUE_TEMPLATE/feature_request.md`](.github/ISSUE_TEMPLATE/feature_request.md)
  - [`.github/pull_request_template.md`](.github/pull_request_template.md)
  - [`docs/README.md`](docs/README.md)
- [x] Валидация: `npx tsc -b && npm run lint` проходит.

---

## In progress / Next (следующие задачи)

### 1) PWA / Offline-first (без оверобещаний)
- [ ] Принять стратегию: precache “shell”, runtime-cache только выбранной истории (json/images/audio), без precache всех историй.
- [ ] Добавить PWA основы: `manifest.json` + service worker (минимальный, безопасный).

### 2) Аудио mp3-sprite (перейти от TTS к файлам)
- [ ] Добавить реальные `audioSprite.ru.url` и `audioSprite.en.url` в `story.json`.
- [ ] Проверить корректность `cues[]` (`startMs`), останов на границе сегмента.
- [ ] Убедиться, что на iOS всё играет после первого user gesture (unlock).

### 3) Свайпы по сценам (детская навигация)
- [ ] Свайп влево/вправо: prev/next scene.
- [ ] Дублировать крупными кнопками prev/next (как fallback).

### 4) Убрать локальные eslint-disable (если останутся)
- [ ] Привести ESLint к “TS-aware” правилам без хака по месту (по возможности в рамках CRA).

---

## Где что лежит (важные файлы)

### Код
- UI/логика kids-режима: [`src/App.tsx`](src/App.tsx)
- Рендер сцены + слой зон: [`src/components/SceneView.tsx`](src/components/SceneView.tsx)
- Зона (tap/longpress/doubletap): [`src/components/InteractiveZone.tsx`](src/components/InteractiveZone.tsx)
- Оверлей выбора истории: [`src/components/StoryPickerOverlay.tsx`](src/components/StoryPickerOverlay.tsx)
- Загрузка контента: [`src/helpers/storyApi.ts`](src/helpers/storyApi.ts)
- Озвучка (TTS + mp3-sprite): [`src/helpers/audioManager.ts`](src/helpers/audioManager.ts)
- Типы контента: [`src/types/kidsStory.ts`](src/types/kidsStory.ts)

### Контент
- Манифест историй: [`public/stories/manifest.json`](public/stories/manifest.json)
- История 001: [`public/stories/story-001/story.json`](public/stories/story-001/story.json)
- Заглушка истории 002: [`public/stories/story-002/story.json`](public/stories/story-002/story.json)
- Плейсхолдеры: [`public/stories/placeholder.svg`](public/stories/placeholder.svg), [`public/stories/scene-placeholder.svg`](public/stories/scene-placeholder.svg)
- Картинки: [`public/assets/images/`](public/assets/images/)

### i18n
- Конфиг: [`src/i18n/config.ts`](src/i18n/config.ts)
- Ресурсы переводов: [`src/i18n/resources.ts`](src/i18n/resources.ts)

### План MVP
- [`plans/mvp1-kids-story.md`](plans/mvp1-kids-story.md)

---

## Команды (быстрый чек)

- dev: `npm run dev`
- типы + линт: `npx tsc -b && npm run lint`

---

## Принципы (чтобы не расползлось)

- i18n-first: озвучка и UI через ключи, не дублировать RU/EN текст в story.json без необходимости.
- content lazy-load: в памяти только выбранная история.
- kids UX: крупные зоны, безопасные анимации, без текста “для ребёнка”.