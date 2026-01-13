# Game Voice (IVOL) — интерактивные истории с озвучкой для детей (Web)

Открытый проект: интерактивные детские истории 1–3+ лет. Ребёнок нажимает на объекты на картинке — звучит озвучка (сейчас TTS, позже — mp3-sprite по таймкодам).  
Платформы: iOS Safari, Android Chrome, Desktop.

---
## RU — Документация (Build in Public)

Папка для публичного процесса (промпты, решения, заметки): [`docs/README.md`](docs/README.md:1)

**Как развивается проект (devlog / “ритм разработки”)** — читать здесь: [`docs/steps/01-step-01.md`](docs/steps/01-step-01.md:1)
Важно: этот файл ведёт **только Иван** (я его не редактирую).

---

## RU — Быстрый старт

### Требования
- Node.js 18+ (желательно)
- npm (ок)

### Установка
```bash
npm install
```

### Запуск
```bash
npm run dev
```
Открой: `http://localhost:3000`

### Проверка (обязательно перед PR)
```bash
npx tsc -b && npm run lint
```

---

## RU — Как устроен контент (истории/сцены/зоны)

Контент лежит в `public/` и грузится лениво через `fetch`, чтобы **не тянуть все истории сразу**.

- Манифест историй: [`public/stories/manifest.json`](public/stories/manifest.json:1)
- История: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1)
- Изображения (сюда можно класть свои): [`public/assets/images/`](public/assets/images/.gitkeep:1)

### Формат зон
Зона задаётся в процентах и имеет `audioCueId` + `ttsKey`:
- `ttsKey` — ключ i18n для озвучки (TTS), например `kids.elements.house`
- `audioCueId` — будущий id сегмента в mp3-sprite (по разметке `startMs`)

---

## RU — Озвучка (TTS сейчас, mp3 позже)

Сейчас, пока `audioSprite.<lang>.url = null`, используется TTS.

Переход на mp3-sprite:
- В `story.json` поставить:
  - `audioSprite.ru.url = "/stories/<id>/audio/ru.mp3"`
  - `audioSprite.en.url = "/stories/<id>/audio/en.mp3"`
- `cues[]` содержит `{ id, startMs }`. Конец сегмента считается как `startMs` следующего.

Реализация: [`src/helpers/audioManager.ts`](src/helpers/audioManager.ts:1)

---

## RU — i18n / Переводы

Все строки UI и TTS-лейблы должны идти через i18n (i18n-first).  
Ресурсы: [`src/i18n/resources.ts`](src/i18n/resources.ts:1)

---



## EN — Quick start

### Requirements
- Node.js 18+
- npm

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```
Open: `http://localhost:3000`

### Validate (before PR)
```bash
npx tsc -b && npm run lint
```

---

## Contributing
Пока без бюрократии: PR/Issue приветствуются.
Не добавляйте секреты/ключи/PII (детские проекты).

---

## Project devlog
If you want to see how the project evolves, read: [`docs/steps/01-step-01.md`](docs/steps/01-step-01.md:1)
Note: this file is maintained by **Ivan only** (I do not edit it).

---

## License
MIT (см. LICENSE)