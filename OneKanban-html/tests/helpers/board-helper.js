const { readFileSync } = require('fs');
const { resolve } = require('path');

const DIST_PATH = resolve(__dirname, '../../dist/index.html');
const FIXTURES_DIR = resolve(__dirname, '../fixtures');

function loadFixture(name) {
    return JSON.parse(readFileSync(resolve(FIXTURES_DIR, name + '.json'), 'utf-8'));
}

function buildSendResponsePayload(fixture) {
    return {
        ...fixture.settings,
        tasks: fixture.tasks,
    };
}

function buildStatusesHtml(fixture) {
    const headers = fixture.statuses.map(s => {
        const addBtn = s.hasAddButton
            ? `<div id="add_task" class="add_task status${s.id}" fullNameObjectStatus="${s.fullName}">` +
              `<svg viewBox="0 0 24 24"><path d="M12 4V20M4 12H20" stroke="rgb(121, 121, 121)" stroke-width="2" stroke-linecap="round"></path></svg></div>`
            : '';
        return `<div class="block_header"><strong class="kanban-block__name">${s.name}</strong><strong class="kanban-block__number">0</strong>${addBtn}</div>`;
    }).join('');

    const blocks = fixture.statuses.map(s =>
        `<div class="kanban-block" id="${s.id}" fullNameObjectStatus="${s.fullName}"></div>`
    ).join('');

    return { headers, blocks };
}

async function openBoard(page, fixtureName, options = {}) {
    const fixture = loadFixture(fixtureName);
    let htmlContent = readFileSync(DIST_PATH, 'utf-8');
    const { headers, blocks } = buildStatusesHtml(fixture);

    const projectsJson = JSON.stringify(fixture.projects);
    const settingsPayload = { ...fixture.settings };
    if (options.theme) settingsPayload.theme = options.theme;
    if (options.grouping) settingsPayload.grouping = options.grouping;
    const settingsJson = JSON.stringify(settingsPayload);

    htmlContent = htmlContent.replace(
        /(<script[^>]*id="projects-data"[^>]*>)\s*\[\]\s*(<\/script>)/,
        `$1${projectsJson}$2`
    );
    htmlContent = htmlContent.replace(
        /(<script[^>]*id="board-settings"[^>]*>)\s*\{\}\s*(<\/script>)/,
        `$1${settingsJson}$2`
    );
    htmlContent = htmlContent.replace(
        /(<div\s+id="kanban_header"[^>]*>)\s*(<\/div>)/,
        `$1${headers}$2`
    );
    htmlContent = htmlContent.replace(
        /(<div\s+id="kanban-board"[^>]*>)\s*(<\/div>)/,
        `$1<div class="kanban_body">${blocks}</div>$2`
    );

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(200);

    const payload = buildSendResponsePayload(fixture);
    if (options.theme) payload.theme = options.theme;
    if (options.grouping) payload.grouping = options.grouping;

    await page.evaluate((data) => {
        window.V8Proxy.sendResponse('init', data);
    }, payload);

    await page.evaluate(() => {
        window._v8Calls = [];
        window.V8Proxy.fetch = (eventName, params) => {
            window._v8Calls.push({ eventName, params, timestamp: Date.now() });
        };
    });

    await page.waitForTimeout(100);
    return fixture;
}

async function getV8Calls(page) {
    return page.evaluate(() => window._v8Calls || []);
}

async function clearV8Calls(page) {
    await page.evaluate(() => { window._v8Calls = []; });
}

async function getVisibleCards(page, statusId) {
    if (statusId) {
        return page.locator(`#${statusId} .card:not(.card__inactive):not(.card__search_hidden)`);
    }
    return page.locator('.card:not(.card__inactive):not(.card__search_hidden)');
}

async function getAllCards(page) {
    return page.locator('.card');
}

async function sendResponse(page, data) {
    await page.evaluate((d) => {
        window.V8Proxy.sendResponse('update', d);
    }, data);
    await page.waitForTimeout(100);
}

module.exports = {
    openBoard,
    getV8Calls,
    clearV8Calls,
    getVisibleCards,
    getAllCards,
    sendResponse,
    loadFixture,
    DIST_PATH,
};
