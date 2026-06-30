# План (отложен): статистика OneKanban на README и сайте документации

**Статус:** не реализовано. Фаза 1 (отправка из 1С) — отдельно.

## Цель

Показывать на [README.md](../../README.md) и главной [documentation/src/pages/index.js](../src/pages/index.js) актуальные показатели использования канбан-доски и динамику за 30 дней. Данные — из счётчика Яндекс.Метрики **110197747**.

## Показатели

- уникальные пользователи (`ym:s:users`)
- уникальные информационные базы (по параметру визита `ib_id`)
- всего открытий доски (`ym:s:pageviews` / `ym:s:visits`)
- график за 30 дней

## Что нужно подготовить

1. OAuth-приложение на [oauth.yandex.ru](https://oauth.yandex.ru/) с правом **metrika:read**
2. OAuth-токен (получить через `authorize?response_type=token`)
3. GitHub Secret `YANDEX_METRIKA_OAUTH_TOKEN` в репозитории

Инструкция: см. раздел «Шаг 2–3» в основном плане статистики.

## Реализация (когда будет время)

1. `documentation/scripts/fetch-metrika-stats.mjs` — запросы к `api-metrika.yandex.net/stat/v1/data` и `/bytime`
2. `prebuild` в `documentation/package.json`
3. Артефакты: `documentation/static/usage-stats.json`, `usage-chart.svg`, опционально `users.svg` / `bases.svg` / `opens.svg`
4. React-компонент `HomepageUsageStats` на главной документации
5. Секция в README с картинками с gh-pages (`viktorermakov.github.io/OneKanban/...`)
6. `.github/workflows/deploy-docs.yml` — сборка и публикация на `gh-pages`

## Зависимости

- В Метрике уже идут хиты из 1С (Measurement Protocol, параметры `ib_id`, `user_id`)
- После первых хитов уточнить имя измерения API для `ib_id` в отчётах

## Ссылки

- [Reporting API](https://yandex.ru/dev/metrika/doc/api2/api_v1/intro.html)
- [Примеры запросов](https://yandex.com/dev/metrika/en/stat/examples)
