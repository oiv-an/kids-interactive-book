# Changelog

## [1.0.5] - 2026-01-27
### RU
- **Добавлено**: Аудио-спрайт (RU) для story-001 и файл аудио: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1), [`public/stories/story-001/audio/ru.opus`](public/stories/story-001/audio/ru.opus:1)
- **Добавлено**: WebAudio проигрывание сегментов для мгновенного старта и точных таймингов: [`src/helpers/audioManager.ts`](src/helpers/audioManager.ts:1)
- **Добавлено**: Оверлей для настройки таймингов `?tuner=1` (скрыт по умолчанию): [`src/components/AudioCueTunerOverlay.tsx`](src/components/AudioCueTunerOverlay.tsx:1), [`src/App.tsx`](src/App.tsx:1)
- **Изменено**: Обновлены таймкоды `audioSprite.ru.cues` под финальную разметку: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1)
- **Изменено**: Обновлены переводы для UI тюнера: [`src/i18n/resources.ts`](src/i18n/resources.ts:1)
- **Изменено**: Стили таблицы тюнера: [`src/App.css`](src/App.css:1)
- **Изменено**: Добавлено игнорирование `.lh/` артефактов: [`.gitignore`](.gitignore:1)
### EN
- **Added**: RU audio sprite for story-001 and audio file: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1), [`public/stories/story-001/audio/ru.opus`](public/stories/story-001/audio/ru.opus:1)
- **Added**: WebAudio segment playback for instant start and precise timings: [`src/helpers/audioManager.ts`](src/helpers/audioManager.ts:1)
- **Added**: Timing tuner overlay `?tuner=1` (hidden by default): [`src/components/AudioCueTunerOverlay.tsx`](src/components/AudioCueTunerOverlay.tsx:1), [`src/App.tsx`](src/App.tsx:1)
- **Changed**: Updated `audioSprite.ru.cues` to final timings: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1)
- **Changed**: Added/updated tuner UI translations: [`src/i18n/resources.ts`](src/i18n/resources.ts:1)
- **Changed**: Added tuner table styles: [`src/App.css`](src/App.css:1)
- **Changed**: Ignored `.lh/` artifacts: [`.gitignore`](.gitignore:1)

## [1.0.4] - 2026-01-22
### RU
- **Добавлено**: Редактор зон `?edit=1` (drag/resize) + копирование JSON в буфер: [`src/components/ZoneEditorOverlay.tsx`](src/components/ZoneEditorOverlay.tsx:1)
- **Изменено**: Слой зон теперь привязан к реальному прямоугольнику отображаемого изображения (учтён `object-fit: contain`): [`src/components/SceneView.tsx`](src/components/SceneView.tsx:1)
- **Изменено**: Координаты зон поддерживают формат `0..1` с обратной совместимостью со старым `0..100`: [`src/components/InteractiveZone.tsx`](src/components/InteractiveZone.tsx:1)
- **Изменено**: Обновлены зоны в контенте (story-001) под новые координаты `0..1`: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1)
- **Исправлено**: «Убегание» рамки при hover из-за `translate(-50%, -50%)`: [`src/App.css`](src/App.css:1)
### EN
- **Added**: Zones editor `?edit=1` (drag/resize) + copy JSON to clipboard: [`src/components/ZoneEditorOverlay.tsx`](src/components/ZoneEditorOverlay.tsx:1)
- **Changed**: Zones layer is now bound to the actual rendered image rect (handles `object-fit: contain`): [`src/components/SceneView.tsx`](src/components/SceneView.tsx:1)
- **Changed**: Zone coordinates support `0..1` with backward compatible `0..100`: [`src/components/InteractiveZone.tsx`](src/components/InteractiveZone.tsx:1)
- **Changed**: Updated story content zones (story-001) to normalized `0..1` coordinates: [`public/stories/story-001/story.json`](public/stories/story-001/story.json:1)
- **Fixed**: Zone hover "jump" caused by `translate(-50%, -50%)`: [`src/App.css`](src/App.css:1)

## [1.0.2] - 2026-01-13
### RU
- **Добавлено**: Deploy-скрипт по SSH ключу: [`scripts/deploy.js`](scripts/deploy.js:1)
- **Добавлено**: Шаблон переменных окружения деплоя: [`.env.example`](.env.example:1)
- **Изменено**: `npm run build` теперь запускает `postbuild` (деплой), но деплой безопасно пропускается без `DEPLOY_ENABLED=1`.
### EN
- **Added**: SSH key based deploy script: [`scripts/deploy.js`](scripts/deploy.js:1)
- **Added**: Deployment env template: [`.env.example`](.env.example:1)
- **Changed**: `npm run build` now runs `postbuild` (deploy), but deploy is safely skipped unless `DEPLOY_ENABLED=1`.

## [1.0.1] - 2026-01-13
### RU
- **Изменено**: В [`README.md`](README.md:1) добавлена ссылка на публичный devlog/«ритм разработки» ([`docs/steps/01-step-01.md`](docs/steps/01-step-01.md:1)), который ведёт только Иван.
### EN
- **Changed**: Added a link in [`README.md`](README.md:1) to the public project devlog/rhythm ([`docs/steps/01-step-01.md`](docs/steps/01-step-01.md:1)), maintained by Ivan only.

## [1.0.0] - 2026-01-13
### RU
- **Добавлено**: Инициализация проекта React для изображений для детей.
- **Добавлено**: Создание базовых файлов: AI_INSTRUCTIONS.md, VERSION.json, CHANGELOG.md.
### EN
- **Added**: Project initialization for React app with images for kids.
- **Added**: Creation of basic files: AI_INSTRUCTIONS.md, VERSION.json, CHANGELOG.md.