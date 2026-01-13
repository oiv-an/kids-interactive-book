# Changelog

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