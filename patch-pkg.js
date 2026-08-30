const fs = require('fs');
let pkg = JSON.parse(fs.readFileSync('C:/Projects/LANZAR/auth/auth-backend/package.json', 'utf8'));
pkg.scripts.start = "node server.js";
fs.writeFileSync('C:/Projects/LANZAR/auth/auth-backend/package.json', JSON.stringify(pkg, null, 2), 'utf8');
