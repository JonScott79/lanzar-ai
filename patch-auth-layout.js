const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/auth/src/App.jsx', 'utf8');

// Replace portal-container with a tighter wrapper
code = code.replace(
  /<div className="portal-container" style=\{\{ alignItems: 'center', justifyContent: 'center' \}\}>/g,
  '<div className="auth-wrapper">'
);

fs.writeFileSync('C:/Projects/LANZAR/auth/src/App.jsx', code, 'utf8');
