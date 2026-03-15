const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { resolve } = require('path');

const DIST_PATH = resolve(__dirname, '../dist/index.html');
const FIXTURE_PATH = resolve(__dirname, '../tests/fixtures/four-projects.json');
const OUTPUT_DIR = resolve(__dirname, '../../documentation/static/demo');
const OUTPUT_PATH = resolve(OUTPUT_DIR, 'index.html');

if (!existsSync(DIST_PATH)) {
    console.error('dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
}

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));
let html = readFileSync(DIST_PATH, 'utf-8');

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

const { headers, blocks } = buildStatusesHtml(fixture);
const projectsJson = JSON.stringify(fixture.projects);
const settingsJson = JSON.stringify(fixture.settings);

html = html.replace(
    /(<script[^>]*id="projects-data"[^>]*>)\s*\[\]\s*(<\/script>)/,
    `$1${projectsJson}$2`
);
html = html.replace(
    /(<script[^>]*id="board-settings"[^>]*>)\s*\{\}\s*(<\/script>)/,
    `$1${settingsJson}$2`
);
html = html.replace(
    /(<div\s+id="kanban_header"[^>]*>)([\s\S]*?)(<\/div>)/,
    `$1${headers}$3`
);
html = html.replace(
    /(<div\s+id="kanban-board"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<button)/,
    `$1<div class="kanban_body">${blocks}</div>$3`
);

const sendResponsePayload = {
    ...fixture.settings,
    tasks: fixture.tasks,
};

const initScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Stub V8Proxy.fetch for demo mode
    window.V8Proxy.fetch = function(eventName, params) {
        console.log('Demo mode — V8Proxy.fetch:', eventName, params);
    };

    // Initialize board with demo data
    var data = ${JSON.stringify(sendResponsePayload)};
    window.V8Proxy.sendResponse('init', data);
});
</script>
`;

html = html.replace('</body>', initScript + '</body>');

if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
}

writeFileSync(OUTPUT_PATH, html, 'utf-8');
console.log('Demo page generated: ' + OUTPUT_PATH);
