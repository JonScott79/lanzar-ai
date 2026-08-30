const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

// Remove the #about section
const aboutRegex = /<section id="about" class="content-section">[\s\S]*?<\/section>/;
html = html.replace(aboutRegex, '');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');
