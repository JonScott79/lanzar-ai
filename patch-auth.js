const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/auth/src/App.jsx', 'utf8');

code = code.replace(
  "const response = await fetch('http://localhost:4001/authorize', {",
  `
            const authBackendUrl = window.location.hostname === 'localhost' ? 'http://localhost:4001' : 'https://auth-api.lanzar.me';
            const response = await fetch(authBackendUrl + '/authorize', {
  `
);

fs.writeFileSync('C:/Projects/LANZAR/auth/src/App.jsx', code, 'utf8');
