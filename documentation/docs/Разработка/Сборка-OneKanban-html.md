---
sidebar_position: 1
description: Сборка инлайн-HTML доски и обновление эталонов YAXUnit
---

# Сборка OneKanban-html

Исходники фронта доски лежат в каталоге **`OneKanban-html`** репозитория [Kanban_for_1C](https://github.com/ViktorErmakov/Kanban_for_1C) (вместе с конфигурацией тестов **`Управление_задачами.YAXUNIT`**).

## Зависимости и сборка

```bash
cd OneKanban-html
npm install
npm run build
```

Команда **`npm run build`** запускает **webpack** (инлайн-бандл в **`dist/index.html`**) и скрипт демо (**`scripts/build-demo.js`**). Результат встраивается в макеты обработки **`Канбан_Доска_HTML`** в расширении 1С.

## Эталоны HTML в YAXUnit

Клиентские и серверные тесты сравнивают HTML доски с общими макетами **`канбан_*`** в **`Управление_задачами.YAXUNIT/src/CommonTemplates/`**.

В настройках YAXUnit **`projectPath`** — каталог проекта в EDT; в этом репозитории используется **корень `Kanban_for_1C`**. Снимки: **`<projectPath>/yaxunit-html-snapshots/test_templates/ИмяМакета.snapshot.txt`** (то есть **`Kanban_for_1C/yaxunit-html-snapshots/test_templates/`**). Эти ветки в git **не коммитятся** по умолчанию (см. `.gitignore`). Перед клиентской фазой модуля **`канбан_Тесты`** вызывается **`канбан_ТестыВызовСервера.ОчиститьКаталогСнимковHTMLДляМакетов()`** — удаляются **`*.snapshot.txt`** прошлого прогона; в ходе текущего прогона уже созданный файл с тем же именем **не перезаписывается** при повторном **`ПроверитьТекстHTMLКанбанДоски`**. Ту же очистку можно вызвать вручную при необходимости.

Скрипт **`apply-yaxunit-html-snapshots.js`** при **`npm run yaxunit:apply-snapshots`** читает снимки **только** из **`Kanban_for_1C/yaxunit-html-snapshots/test_templates/`**.

Чтобы перенести актуальные снимки в макеты EDT после прогона тестов:

```bash
cd OneKanban-html
npm run yaxunit:apply-snapshots
```

Имя **`yaxunit:apply-snapshots`** — это **ключ** в **`package.json`** в секции **`scripts`**, а не имя файла; npm подставляет команду **`node scripts/apply-yaxunit-html-snapshots.js`**.

Скрипт **`scripts/apply-yaxunit-html-snapshots.js`** версионируется в репозитории. Краткая памятка по путям — **`yaxunit-html-snapshots/README.md`** в корне репозитория.

После **`npm run yaxunit:apply-snapshots`** макеты **`Template.txt`** в **`Управление_задачами.YAXUNIT`** обновляются на диске. Если EDT уже открыт, выполните **обновление ресурсов** проекта (или узла **`CommonTemplates`**) через контекстное меню → *Обновить* / **F5**; при необходимости перезапустите EDT. Скрипт не закрывает IDE.

Проверка без записи в макеты:

```bash
npm run yaxunit:apply-snapshots -- --dry-run
```

## Веб-тесты Playwright

```bash
cd OneKanban-html
npm test
```
