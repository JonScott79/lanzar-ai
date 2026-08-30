const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/auth/src/App.css', 'utf8');

css += `
.auth-wrapper {
  background: transparent;
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
}
`;

fs.writeFileSync('C:/Projects/LANZAR/auth/src/App.css', css, 'utf8');
