/**
 * Подменяет в каждом макете YAXUnit только <head> из свежего dist/index.html,
 * сохраняя <body>… со сценарием доски (эталоны остаются привязаны к данным).
 */
const { readFileSync, writeFileSync, readdirSync, statSync } = require('fs');
const { join } = require('path');

const DIST = join(__dirname, '../dist/index.html');
const YAX_ROOT = join(__dirname, '../../Управление_задачами.YAXUNIT/src/CommonTemplates');

const dist = readFileSync(DIST, 'utf8');
const bodyIdxDist = dist.indexOf('<body>');
if (bodyIdxDist === -1) {
    console.error('dist/index.html: <body> not found');
    process.exit(1);
}
const newHead = dist.slice(0, bodyIdxDist);

let updated = 0;
const entries = readdirSync(YAX_ROOT, { withFileTypes: true });
for (const ent of entries) {
    if (!ent.isDirectory() || !ent.name.startsWith('канбан_')) continue;
    const tplPath = join(YAX_ROOT, ent.name, 'Template.txt');
    try {
        if (!statSync(tplPath).isFile()) continue;
    } catch {
        continue;
    }
    const old = readFileSync(tplPath, 'utf8');
    const bodyIdxOld = old.indexOf('<body>');
    if (bodyIdxOld === -1) {
        console.warn('Skip (no <body>):', tplPath);
        continue;
    }
    const bodyAndRest = old.slice(bodyIdxOld);
    writeFileSync(tplPath, newHead + bodyAndRest, 'utf8');
    updated++;
}
console.log('YAXUnit templates updated:', updated);
