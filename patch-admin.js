const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', 'utf8');

// The admin bubble has "Hey, Boss!". We can find it by looking for that block.
const adminBlockRegex = /(viewMode === 'admin' && \([\s\S]*?)<div className="stella-dialogue">/g;

code = code.replace(adminBlockRegex, "$1<div className=\"stella-dialogue admin-dialogue\">");

fs.writeFileSync('C:/Projects/LANZAR/tickets/website/frontend/src/App.jsx', code, 'utf8');
