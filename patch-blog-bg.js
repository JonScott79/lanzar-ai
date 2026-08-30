const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/blog.html', 'utf8');

const bgHtml = `
    <!-- BACKGROUND PATTERN -->
    <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; opacity: 0.15; background: url('assets/svg/background.svg') center center; background-size: cover;"></div>
`;

html = html.replace('<header class="site-header"', bgHtml + '\n    <header class="site-header"');

fs.writeFileSync('C:/Projects/LANZAR/homepage/blog.html', html, 'utf8');
