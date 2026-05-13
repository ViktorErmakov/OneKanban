/**
 * Переносит *.snapshot.txt в макеты Управление_задачами.YAXUNIT/src/CommonTemplates/<имя>/Template.txt
 *
 * Снимки 1С пишет в <projectPath YAXUnit>/yaxunit-html-snapshots/test_templates/ (см. канбан_Тесты.КаталогСнимковHTMLДляМакетов).
 * Скрипт читает снимки только из каталога репозитория:
 *   <корень репо>/yaxunit-html-snapshots/test_templates/
 * (ожидается projectPath = корень Kanban_for_1C в настройках YAXUnit).
 *
 * Запуск из каталога OneKanban-html:
 *   npm run yaxunit:apply-snapshots
 * Имя yaxunit:apply-snapshots — ключ в package.json → "scripts", не имя файла.
 *
 * Опции: --dry-run — только список файлов без записи
 *
 * После записи: в EDT обновите проект Управление_задачами.YAXUNIT (F5 / Обновить) или перезапустите IDE — см. yaxunit-html-snapshots/README.md.
 */
const { readdirSync, readFileSync, writeFileSync, existsSync, statSync } = require('fs');
const { join } = require('path');

const REPO_ROOT = join(__dirname, '..', '..');

const SNAPSHOT_DIR = join(REPO_ROOT, 'yaxunit-html-snapshots', 'test_templates');

const TEMPLATES_ROOT = join(
    REPO_ROOT,
    'Управление_задачами.YAXUNIT',
    'src',
    'CommonTemplates'
);

const SUFFIX = '.snapshot.txt';
const dryRun = process.argv.includes('--dry-run');

/**
 * @returns {Map<string, string>} имя макета (без суффикса) -> полный путь к .snapshot.txt
 */
function collectSnapshotFiles() {
    const byName = new Map();
    if (!existsSync(SNAPSHOT_DIR) || !statSync(SNAPSHOT_DIR).isDirectory()) {
        return byName;
    }
    for (const n of readdirSync(SNAPSHOT_DIR)) {
        if (!n.endsWith(SUFFIX)) {
            continue;
        }
        const templateName = n.slice(0, -SUFFIX.length);
        byName.set(templateName, join(SNAPSHOT_DIR, n));
    }
    return byName;
}

function main() {
    const byName = collectSnapshotFiles();

    if (byName.size === 0) {
        if (!existsSync(SNAPSHOT_DIR)) {
            console.log('Каталог снимков ещё не создан:');
            console.log(' ', SNAPSHOT_DIR);
            console.log('Сначала прогоните YAXUnit-тесты доски (ПроверитьТекстHTMLКанбанДоски) с projectPath = корень репозитория.');
        } else {
            console.log('Нет файлов *' + SUFFIX + ' в:', SNAPSHOT_DIR);
        }
        process.exit(0);
    }

    let applied = 0;
    let skipped = 0;

    for (const [templateName, fromPath] of byName) {
        const toDir = join(TEMPLATES_ROOT, templateName);
        const toPath = join(toDir, 'Template.txt');

        if (!existsSync(toDir) || !statSync(toDir).isDirectory()) {
            console.warn('Пропуск (нет папки макета):', templateName);
            skipped += 1;
            continue;
        }

        const body = readFileSync(fromPath, 'utf8');
        if (dryRun) {
            console.log('[dry-run]', fromPath, '->', toPath, '(' + body.length + ' chars)');
        } else {
            writeFileSync(toPath, body, 'utf8');
            console.log('OK', templateName, '<-', fromPath);
        }
        applied += 1;
    }

    console.log(
        dryRun ? `Dry-run: ${applied} файл(ов), пропущено ${skipped}` : `Готово: ${applied} макет(ов), пропущено ${skipped}`
    );
    if (!dryRun && applied > 0) {
        console.log('');
        console.log(
            'EDT: обновите ресурсы проекта Управление_задачами.YAXUNIT (F5 / «Обновить») или перезапустите EDT, чтобы увидеть новые Template.txt.'
        );
    }
}

main();
