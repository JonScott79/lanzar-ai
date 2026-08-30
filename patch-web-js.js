const fs = require('fs');
let js = fs.readFileSync('C:/Projects/LANZAR/web/js/app.js', 'utf8');

js = js.replace(/const btnJournal = document\.querySelector\("#btn-journal"\);/, '');
js = js.replace(/btnJournal\.addEventListener\("click", \(\) => {[\s\S]*?}\);/, '');

fs.writeFileSync('C:/Projects/LANZAR/web/js/app.js', js, 'utf8');
