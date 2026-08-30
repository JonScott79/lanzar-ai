const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', 'utf8');

css = css.replace(/padding: 3rem;/g, 'padding: 2.5rem;');
css = css.replace(/max-width: 500px;/g, 'max-width: 440px;');
css = css.replace(/font-size: 2\.5rem;/g, 'font-size: 2.2rem;');
css = css.replace(/min-height: 60px;/g, 'min-height: 52px;'); /* google button */
css = css.replace(/padding: 1rem 2rem;/g, 'padding: 0.85rem 1.5rem;'); /* primary btn */
css = css.replace(/font-size: 1\.2rem;/g, 'font-size: 1.1rem;'); /* primary btn font */
css = css.replace(/margin-bottom: 2\.5rem;/g, 'margin-bottom: 1.8rem;'); /* login desc */

fs.writeFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', css, 'utf8');
