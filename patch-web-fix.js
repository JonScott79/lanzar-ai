const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/web/index.html', 'utf8');

html = html.replace(/<button id="btn-journal" class="console-link">[\s\S]*?<\/button>/, '');

fs.writeFileSync('C:/Projects/LANZAR/web/index.html', html, 'utf8');
