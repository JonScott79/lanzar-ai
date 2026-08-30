const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

html = html.replace('<li><a href="/about/" class="nav-link">ABOUT</a></li>', '');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');
