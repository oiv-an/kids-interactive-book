# Contributing (RU/EN)

Этот репозиторий — open-source и build-in-public. Контент детский, поэтому у нас есть базовые правила.

---

## RU

### 1) Что можно присылать
- Новые истории/сцены (без агрессии, 1–6 лет)
- Улучшения UX, доступности, производительности
- Улучшения движка зон/аудио (TTS/mp3-sprite)
- Документацию (включая `docs/prompts/*`)

### 2) Что нельзя
- Секреты/ключи/токены
- Персональные данные детей/родителей
- Любые трекеры/3rd-party analytics (детский проект)

### 3) Правила разработки
- i18n-first: без хардкода RU/EN в UI — все строки через i18n (см. [`src/i18n/resources.ts`](src/i18n/resources.ts:1))
- Перед PR обязательно:
```bash
npx tsc -b && npm run lint
```

### 4) Как добавлять новую историю
1. Добавить карточку в [`public/stories/manifest.json`](public/stories/manifest.json:1)
2. Добавить `public/stories/<story-id>/story.json`
3. Положить изображения в [`public/assets/images/`](public/assets/images/.gitkeep:1)
4. Добавить ключи перевода (UI/ttsKey) в [`src/i18n/resources.ts`](src/i18n/resources.ts:1)

---

## EN

### 1) What you can contribute
- New kid-safe stories/scenes
- UX/accessibility/performance improvements
- Audio engine improvements (TTS/mp3-sprite)
- Documentation (including `docs/prompts/*`)

### 2) What you must NOT add
- Secrets/tokens/keys
- Any child/parent PII
- Any trackers / 3rd-party analytics (kids project)

### 3) Dev rules
- i18n-first: no hardcoded UI strings — use i18n resources
- Before PR:
```bash
npx tsc -b && npm run lint