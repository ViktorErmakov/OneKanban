/**
 * Захват скриншотов HTML-доски для documentation/static/img/.
 * Требует: npm run build в OneKanban-html, playwright в OneKanban-html/node_modules.
 *
 * Запуск из каталога documentation:
 *   node scripts/capture-board-screenshots.mjs
 */
import { chromium } from '../../OneKanban-html/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '../..');
const DIST = resolve(REPO, 'OneKanban-html/dist/index.html');
const FIXTURES = resolve(REPO, 'OneKanban-html/tests/fixtures');
const OUT = resolve(REPO, 'documentation/static/img');
const VIEWPORT = { width: 1400, height: 900 };

function loadFixture(name) {
    return JSON.parse(readFileSync(resolve(FIXTURES, `${name}.json`), 'utf-8'));
}

function buildStatusesHtml(fixture) {
    const headers = fixture.statuses.map((s) => {
        const addBtn = s.hasAddButton
            ? `<div id="add_task_${s.id}" class="add_task status${s.id}" fullNameObjectStatus="${s.fullName}" data-full-name-object-status="${s.fullName}" data-status-id="${s.id}">` +
              '<svg viewBox="0 0 24 24"><path d="M12 4V20M4 12H20" stroke="rgb(121, 121, 121)" stroke-width="2" stroke-linecap="round"></path></svg></div>'
            : '';
        return `<div class="block_header"><strong class="kanban-block__name">${s.name}</strong><strong class="kanban-block__number">0</strong>${addBtn}</div>`;
    }).join('');
    const blocks = fixture.statuses.map(
        (s) => `<div class="kanban-block" id="${s.id}" fullNameObjectStatus="${s.fullName}"></div>`
    ).join('');
    return { headers, blocks };
}

async function openBoard(page, fixtureName, options = {}) {
    const fixture = loadFixture(fixtureName);
    let html = readFileSync(DIST, 'utf-8');
    const { headers, blocks } = buildStatusesHtml(fixture);
    const settingsPayload = { ...fixture.settings, ...options.settings };
    html = html.replace(/(<script[^>]*id="projects-data"[^>]*>)\s*\[\]\s*(<\/script>)/, `$1${JSON.stringify(fixture.projects)}$2`);
    html = html.replace(/(<script[^>]*id="board-settings"[^>]*>)\s*\{\}\s*(<\/script>)/, `$1${JSON.stringify(settingsPayload)}$2`);
    html = html.replace(/(<div\s+id="kanban_header"[^>]*>)\s*(<\/div>)/, `$1${headers}$2`);
    html = html.replace(/(<div\s+id="kanban-board"[^>]*>)\s*(<\/div>)/, `$1<div class="kanban_body">${blocks}</div>$2`);
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const payload = { ...fixture.settings, tasks: fixture.tasks, ...options.payload };
    await page.evaluate((data) => window.V8Proxy.sendResponse('init', data), payload);
    await page.waitForTimeout(300);
    if (options.grouping) {
        await page.click('#grouping_toggle');
        await page.locator(`.grouping_option[data-value="${options.grouping}"]`).click();
        await page.waitForTimeout(400);
    }
}

async function shot(page, name, locator, opts = {}) {
    const path = resolve(OUT, name);
    const el = typeof locator === 'string' ? page.locator(locator) : locator;
    if (opts.fullPage) {
        await page.screenshot({ path, fullPage: true });
    } else {
        await el.screenshot({ path });
    }
    console.log('  +', name);
}

async function main() {
    if (!existsSync(DIST)) {
        console.error('Сначала выполните: cd OneKanban-html && npm run build');
        process.exit(1);
    }
    mkdirSync(OUT, { recursive: true });

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: VIEWPORT });

    console.log('CreateKindModal.png');
    await openBoard(page, 'four-projects');
    await page.locator('.add_task').first().click();
    await page.waitForTimeout(200);
    await shot(page, 'CreateKindModal.png', '#sticky_blok', {});

    console.log('CardAnatomy.png');
    await openBoard(page, 'four-projects');
    const bug = page.locator('.card-type-bug').first();
    const task = page.locator('.card:not(.card-type-bug)').first();
    await shot(page, 'CardAnatomy.png', page.locator('.kanban-block').first());

    console.log('ExecutorNoAssignee.png');
    await openBoard(page, 'four-projects');
    await page.click('#executor_toggle');
    await page.waitForTimeout(200);
    await shot(page, 'ExecutorNoAssignee.png', '.executor_dropdown.open');

    console.log('UrgencyHexRgb.png');
    await openBoard(page, 'four-projects');
    await page.click('#urgency_toggle');
    await page.waitForTimeout(150);
    await page.locator('.urgency_option_settings').first().click();
    await page.waitForTimeout(200);
    await shot(page, 'UrgencyHexRgb.png', '#urgency_settings_popover.open');

    console.log('UrgencyResetAll.png');
    await openBoard(page, 'four-projects');
    await page.click('#urgency_toggle');
    await page.waitForTimeout(200);
    await shot(page, 'UrgencyResetAll.png', '.urgency_dropdown.open');

    console.log('DnDForbidden.png');
    await openBoard(page, 'four-projects', { grouping: 'project' });
    const cardDnD = page.locator('.group .card').first();
    const groups = page.locator('.group[data-project-id]');
    const groupCount = await groups.count();
    if (groupCount >= 2) {
        const foreignGroup = groups.nth(1).locator('.kanban-block').first();
        const cbox = await cardDnD.boundingBox();
        const tbox = await foreignGroup.boundingBox();
        if (cbox && tbox) {
            await page.mouse.move(cbox.x + cbox.width / 2, cbox.y + cbox.height / 2);
            await page.mouse.down();
            await page.mouse.move(tbox.x + tbox.width / 2, tbox.y + 40, { steps: 15 });
            await page.waitForTimeout(400);
            await shot(page, 'DnDForbidden.png', '#kanban-board');
            await page.mouse.up();
        }
    }

    console.log('HiddenFilters.png');
    await openBoard(page, 'single-executor-tasks-only');
    await shot(page, 'HiddenFilters.png', '#sticky_blok');

    console.log('NoExecutorPhoto.png');
    await openBoard(page, 'four-projects', {
        settings: { showexecutorphoto: false },
        payload: { showexecutorphoto: false },
    });
    await shot(page, 'NoExecutorPhoto.png', page.locator('.kanban-block').first());

    await browser.close();

    await generate1cPlaceholders();
    console.log('\nГотово. Замените placeholder-*.png снимками из 1С — см. static/img/SCREENSHOTS_NEEDED.md');
}

/** Временные заглушки для снимков из 1С, пока их не добавит пользователь */
async function generate1cPlaceholders() {
    const labels = [
        'NoSettings.png',
        'status.png',
        'ОпределениеКнопкиДобавить.png',
        'project.png',
        'comparisonSetting.png',
        'comparison.png',
        'Commands.png',
        'PersonalSettings.png',
        'CardLinkOpen.png',
        'ReportHistory.png',
        'ReportHistorySummary.png',
    ];
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 700 } });
    for (const name of labels) {
        const outPath = resolve(OUT, name);
        if (existsSync(outPath)) continue;
        const label = name.replace('.png', '');
        await page.setContent(`<!DOCTYPE html><html><body style="margin:0;font-family:Segoe UI,sans-serif;background:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center;padding:2rem;border:2px dashed #999;border-radius:8px;background:#fff;max-width:80%"><p style="color:#666;margin:0 0 1rem">Скриншот из 1С (заглушка)</p><h2 style="margin:0;color:#333">${label}</h2><p style="color:#888;margin-top:1rem;font-size:14px">Замените файл — см. SCREENSHOTS_NEEDED.md</p></div></body></html>`);
        await page.screenshot({ path: outPath });
        console.log('  ~ placeholder', name);
    }
    await browser.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
