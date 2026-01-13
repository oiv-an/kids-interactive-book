# План MVP1: интерактивные истории для детей (встраиваем в текущий React-шаблон)

Основано на требованиях из [`AI_INSTRUCTIONS.md`](AI_INSTRUCTIONS.md:1) и текущем каркасе приложения на CRA + React + i18n (см. [`package.json`](package.json:1), [`src/App.tsx`](src/App.tsx:1), [`src/i18n/config.ts`](src/i18n/config.ts:1)).

---

## 1) Цель MVP1 (что будет “готово”)

- В приложении есть **детский режим историй**:
  - сверху: кнопка **Выбор истории** и переключатель языка **RU/EN**
  - по нажатию **Выбор истории** открывается полноэкранный оверлей с **сеткой больших карточек** (MVP1: 2 истории, вторая может быть заглушкой)
- При выборе истории:
  - загружается **только выбранная история** (lazy load)
  - предыдущая история **выгружается из состояния** (чтобы не держать все истории в памяти)
  - ассеты (картинки, mp3, json) грузятся с `public/` через `fetch`
- Внутри истории: **несколько сцен** (стартово 5), переключение сцен **свайпами** (и опционально крупными prev/next).
- Интерактивные зоны поверх картинки:
  - координаты и размеры в процентах
  - минимум hit-area: 60x60 px (допускаем увеличение зоны при малом размере)
  - на tap: звук/tts + визуальный фидбек
- Озвучивание:
  - сейчас: **TTS** (fallback на тексте зоны)
  - далее: **mp3 audio-sprite** на историю и на язык + **разметка стартов** (startMs); конец = следующий startMs

---

## 2) Данные и загрузка (lazy-load)

### 2.1 Где храним
Для CRA проще всего хранить контент в `public/`, чтобы грузить как статические файлы без импорта:

- `public/stories/manifest.json`
- `public/stories/story-001/story.json`
- `public/stories/story-001/scenes/*.png`
- `public/stories/story-001/audio/ru.mp3`, `public/stories/story-001/audio/en.mp3`

Код, типы и компоненты — в `src/`.

### 2.2 Manifest (легкий список для экрана выбора)
Файл: [`public/stories/manifest.json`](public/index.html:1) (путь от корня сайта, хранится в `public/`)

Содержит минимум для рендера карточек:

- `id`
- `titleKey` (строки UI — через i18n)
- `coverImageUrl`
- `storyUrl`
- `isPlaceholder` (для второй заглушки в MVP1)

### 2.3 Story JSON (грузится только при выборе истории)
Файл: [`public/stories/story-001/story.json`](public/index.html:1)

Структура:

- `scenes[]`: 5 стартовых сцен, расширяемо
- `zones[]` внутри сцены: геометрия и аудио-ключ
- `audioSprite` по языкам: `url` mp3 и `cues[]`

---

## 3) Формат аудио-разметки (mp3 sprite)

### 3.1 Почему startMs без endMs
- проще редактировать (добавили точку старта — следующий старт автоматически закрывает предыдущий)
- RU/EN могут иметь разные темпы, поэтому разметка отдельная на язык

### 3.2 Формат cues
`cues[]`: список объектов `{ id, startMs }` в порядке возрастания `startMs`.

Правило конца:
- `endMs = cues[i+1].startMs`
- последний `endMs = audio.duration * 1000`

---

## 4) Аудио-слой (поведение)

### 4.1 Интерфейс (на уровне логики)
- `playCue(storyId, lang, cueId, ttsTextFallback)`
- `stop()`
- при новом tap:
  - останавливаем предыдущее
  - стартуем новое (cue или TTS)
- double-tap: `stop()` (в MVP1 проще и стабильнее, чем pause/resume)
- long-press (>500ms): повтор `playCue`

Технически для mp3:
- один `HTMLAudioElement` на активную историю/язык
- на `playCue`: выставить `currentTime = startMs/1000` и `play()`
- остановка на конце сегмента:
  - основной вариант: `setTimeout(stop, durationMs)`
  - страховка: слушать `timeupdate` и стопать если `currentTime >= endSec - epsilon`

Важно для iOS:
- первый запуск аудио должен произойти после пользовательского действия; значит “прогрев”/unlock делаем на первом тапе в приложении.

---

## 5) UI/UX (минимум текста, крупные зоны)

### 5.1 Верхняя панель
- кнопка: `kids.ui.selectStory`
- отображение текущей истории (может быть маленьким, но не перегружаем)
- переключатель языка RU/EN:
  - влияет на i18n (UI)
  - влияет на `audioSprite[lang]`

### 5.2 Экран выбора истории (fullscreen overlay)
- сетка 2 карточки (MVP1)
- карточка: обложка + (минимальный) заголовок (можно скрыть, но ключи i18n всё равно есть)

### 5.3 Просмотр сцены
- картинка сцены на весь доступный экран
- поверх: зоны абсолютным позиционированием в процентах
- навигация:
  - свайп влево/вправо по сценам
  - опционально: большие кнопки prev/next (для desktop/доступности)

### 5.4 Анимации
- только мягкие (200–400ms)
- `prefers-reduced-motion` отключает анимации
- никакого мигания

---

## 6) PWA/кэширование (не “полный offline”, но задел)

Цель: создать инфраструктуру, чтобы:
- shell приложения можно было кэшировать (в будущем — полноценный offline)
- ресурсы выбранной истории после загрузки попадали в cache storage (runtime cache)

Стратегия:
- precache: минимум (shell)
- runtime cache:
  - `/stories/**.json` network-first (чтобы получать обновления)
  - `/stories/**.(png|jpg|webp|svg|mp3)` cache-first (быстро после первого посещения)
- при выборе новой истории приложение “выгружает” предыдущую из state; кэш можно не чистить в MVP1 (это отдельная стратегия лимитов для MVP2)

---

## 7) i18n ключи (RU/EN, без хардкода)

Расширяем [`src/i18n/resources.ts`](src/i18n/resources.ts:1) веткой `kids.*`, например:

- `kids.ui.selectStory`
- `kids.ui.language`
- `kids.ui.close`
- `kids.stories.story001.title`
- `kids.stories.story002.title`
- `kids.stories.placeholder`

---

## 8) Предлагаемая структура файлов (минимальный дифф)

Изменяем существующие:
- [`src/App.tsx`](src/App.tsx:1) — заменить текущий заголовок на KidsStory UI и state-машину выбора истории/сцены
- [`src/App.css`](src/App.css:1) — стили top bar, overlay, сцены, зон (или добавить отдельный css и подключить)
- [`src/i18n/resources.ts`](src/i18n/resources.ts:1) — добавить `kids.*`

Добавляем новые (предложение):
- [`src/types/kidsStory.ts`](src/types/kidsStory.ts:1) — типы StoryManifest/Story/Scene/Zone/AudioCue
- [`src/helpers/storyApi.ts`](src/helpers/storyApi.ts:1) — `loadManifest()` и `loadStory(storyUrl)`
- [`src/helpers/audioManager.ts`](src/helpers/audioManager.ts:1) — управление TTS + mp3 sprite
- [`src/hooks/useSwipe.ts`](src/hooks/useSwipe.ts:1) — обработка свайпа для сцен
- [`src/components/StoryPickerOverlay.tsx`](src/components/StoryPickerOverlay.tsx:1) — полноэкранная сетка карточек
- [`src/components/SceneView.tsx`](src/components/SceneView.tsx:1) — картинка + рендер зон
- [`src/components/InteractiveZone.tsx`](src/components/InteractiveZone.tsx:1) — зона с pointer/touch обработчиками и визуальным фидбеком

PWA (после утверждения способа реализации в CRA):
- [`public/sw.js`](public/index.html:1) — service worker (простой CacheStorage подход)
- регистрация SW из точки входа, вероятно в [`src/index.tsx`](src/index.tsx:1)

---

## 9) Acceptance criteria для MVP1

- Можно открыть оверлей выбора истории и переключать историю (2 карточки).
- При выборе истории загружается только она (manifest + story.json + сцены по мере надобности).
- Сцены (5) переключаются свайпом.
- Нажатие на зону даёт реакцию (анимация) и звук:
  - сейчас TTS (RU/EN)
  - затем легко подключается mp3 sprite + разметка
- При переключении истории звук останавливается, состояние сцены сбрасывается.
- Строки UI — только через i18n (см. [`src/i18n/resources.ts`](src/i18n/resources.ts:1)).

---

## 10) Следующий шаг

После вашего “ок, план устраивает”:
1) переключаемся в code-режим для реализации
2) делаем минимальный рабочий вертикальный срез: manifest -> picker -> story loader -> scene view -> zones -> TTS
3) затем подключаем mp3-sprite (по готовности файлов)