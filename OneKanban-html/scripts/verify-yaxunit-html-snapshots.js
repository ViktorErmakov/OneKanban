/**
 * Сравнивает *.snapshot.txt с Template.txt в CommonTemplates YAXUNIT.
 * Exit code 0 — все пары совпадают байт-в-байт; 1 — есть расхождения или пропуски.
 *
 * Запуск из OneKanban-html:
 *   npm run yaxunit:verify-snapshots
 */
const { readdirSync, readFileSync, existsSync, statSync } = require('fs');
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
        console.error('Нет снимков в:', SNAPSHOT_DIR);
        process.exit(1);
    }

    let same = 0;
    let diff = 0;
    let missingTemplate = 0;

    for (const [templateName, snapPath] of byName) {
        const tplPath = join(TEMPLATES_ROOT, templateName, 'Template.txt');
        if (!existsSync(tplPath)) {
            console.error('Нет макета:', templateName);
            missingTemplate += 1;
            continue;
        }
        const snap = readFileSync(snapPath, 'utf8');
        const tpl = readFileSync(tplPath, 'utf8');
        if (snap === tpl) {
            same += 1;
        } else {
            console.error(
                'РАСХОЖДЕНИЕ:',
                templateName,
                `(snapshot ${snap.length}, template ${tpl.length}, delta ${snap.length - tpl.length})`
            );
            diff += 1;
        }
    }

    let templatesWithoutSnapshot = 0;
    if (existsSync(TEMPLATES_ROOT)) {
        for (const dir of readdirSync(TEMPLATES_ROOT)) {
            if (!dir.startsWith('канбан_')) {
                continue;
            }
            const snapPath = join(SNAPSHOT_DIR, dir + SUFFIX);
            if (!existsSync(snapPath)) {
                console.warn('Нет снимка для макета:', dir);
                templatesWithoutSnapshot += 1;
            }
        }
    }

    console.log(
        `Снимков: ${byName.size}, совпадают: ${same}, расхождений: ${diff}, без макета: ${missingTemplate}, макетов без снимка: ${templatesWithoutSnapshot}`
    );

    if (diff > 0 || missingTemplate > 0) {
        process.exit(1);
    }
}

main();
