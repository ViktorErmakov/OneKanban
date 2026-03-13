Как собрать проект:

1. В VSC открыть папку OneKanban-html
2. Запустить команду **npm i** в терминале для установки всех зависимостей
3. Настроить **webpack.config.js** при необходимости
4. Запустить команду **npm run build** в терминале для сборки единого файла HTML.

Тесты

Playwright:
1. npm test                    # Все тесты (headless)
2. npm run test:headed         # С видимым браузером
3. npm run test:ui             # Интерактивный UI Playwright
4. npm run test:report         # HTML-отчёт с деталями
5. npx playwright test --update-snapshots #если хотите запустить только скриншот-тесты для обновления эталонов:

allure:
1. npm run allure:generate — генерация отчёта
2. npm run allure:open — открыть готовый отчёт
3. npm run allure:report — генерация + открытие одной командой