const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const { resolve } = require('path');

const DIST_PATH = resolve(__dirname, '../dist/index.html');
const FIXTURE_PATH = resolve(__dirname, '../tests/fixtures/four-projects.json');
const LOGO_PATH = resolve(__dirname, '../src/pictures/Logo/logo_variant2.svg');
const OUTPUT_DIR = resolve(__dirname, '../../documentation/static/demo-board');
const OUTPUT_PATH = resolve(OUTPUT_DIR, 'index.html');

if (!existsSync(DIST_PATH)) {
    console.error('dist/index.html not found. Run "npm run build" first.');
    process.exit(1);
}

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf-8'));
let html = readFileSync(DIST_PATH, 'utf-8');

// Replaces the inner content of a <div id="..."> with newContent,
// correctly handling nested <div> tags by counting depth.
function replaceDivContent(source, divId, newContent) {
    const marker = `id="${divId}"`;
    const startIdx = source.indexOf(marker);
    if (startIdx === -1) return source;

    const tagClose = source.indexOf('>', startIdx);
    if (tagClose === -1) return source;

    const contentStart = tagClose + 1;
    let depth = 1;
    let pos = contentStart;

    while (depth > 0 && pos < source.length) {
        const nextOpen = source.indexOf('<div', pos);
        const nextClose = source.indexOf('</div>', pos);
        if (nextClose === -1) break;

        if (nextOpen !== -1 && nextOpen < nextClose) {
            depth++;
            pos = nextOpen + 4;
        } else {
            depth--;
            if (depth === 0) {
                return source.substring(0, contentStart) + newContent + source.substring(nextClose);
            }
            pos = nextClose + 6;
        }
    }
    return source;
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

const { headers, blocks } = buildStatusesHtml(fixture);
const projectsJson = JSON.stringify(fixture.projects);
const settingsJson = JSON.stringify(fixture.settings);

html = html.replace(
    /(<script[^>]*id="projects-data"[^>]*>)[\s\S]*?(<\/script>)/,
    `$1${projectsJson}$2`
);
html = html.replace(
    /(<script[^>]*id="board-settings"[^>]*>)[\s\S]*?(<\/script>)/,
    `$1${settingsJson}$2`
);

html = replaceDivContent(html, 'kanban_header', headers);
html = replaceDivContent(html, 'kanban-board', `<div class="kanban_body">${blocks}</div>`);

if (existsSync(LOGO_PATH)) {
    const logoSvg = readFileSync(LOGO_PATH, 'utf-8');
    const logoDataUri = 'data:image/svg+xml,' + encodeURIComponent(logoSvg);
    const srcMarker = 'id="logo_img"';
    const srcIdx = html.indexOf(srcMarker);
    if (srcIdx !== -1) {
        const srcAttr = html.indexOf('src="', srcIdx);
        if (srcAttr !== -1 && srcAttr - srcIdx < 200) {
            const srcValStart = srcAttr + 5;
            const srcValEnd = html.indexOf('"', srcValStart);
            if (srcValEnd !== -1) {
                html = html.substring(0, srcValStart) + logoDataUri + html.substring(srcValEnd);
            }
        }
    }
}

const sendResponsePayload = {
    ...fixture.settings,
    tasks: fixture.tasks,
};

const initScript = `
<script>
window.addEventListener('load', function() {
    window.V8Proxy.fetch = function(eventName, params) {
        console.log('Demo mode — V8Proxy.fetch:', eventName, params);
    };

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
