const fs = require('fs');
const d = fs.readFileSync(require('path').join(__dirname, '../dist/index.html'), 'utf8');
const m = '<script type="application/json" id="projects-data">';
console.log('found', d.includes(m), 'at', d.indexOf(m));
