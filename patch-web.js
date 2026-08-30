const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/web/index.html', 'utf8');

// The button for "Mission Log" is btn-journal
html = html.replace(/<button id="btn-journal" class="console-link">[\s\S]*?<\/button>/, '');

fs.writeFileSync('C:/Projects/LANZAR/web/index.html', html, 'utf8');
