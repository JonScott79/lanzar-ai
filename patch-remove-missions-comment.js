const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

html = html.replace(/<!-- 3\. MISSIONS -->/g, '<!-- 3. PROJECTS -->');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');
