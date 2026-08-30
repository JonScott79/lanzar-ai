const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', 'utf8');

css = css.replace(/padding: 2rem;/g, 'padding: 1.5rem;');
css = css.replace(/max-width: 380px;/g, 'max-width: 340px;');
css = css.replace(/margin: 2rem auto;/g, 'margin: 1rem auto;');

css = css.replace(/font-size: 1\.8rem;/g, 'font-size: 1.5rem;');
css = css.replace(/margin-bottom: 1rem;/g, 'margin-bottom: 0.5rem;');

css = css.replace(/font-size: 0\.95rem;/g, 'font-size: 0.85rem;');
css = css.replace(/margin-bottom: 1\.2rem;/g, 'margin-bottom: 1rem;');

css = css.replace(/margin-bottom: 2rem;/g, 'margin-bottom: 1rem;'); /* form group */

css = css.replace(/margin-bottom: 0\.5rem;/g, 'margin-bottom: 0.25rem;'); /* label */

css = css.replace(/padding: 0\.8rem;/g, 'padding: 0.6rem;'); /* input */

css = css.replace(/margin-top: 2rem;/g, 'margin-top: 1rem;'); /* form-actions */

css = css.replace(/padding: 0\.7rem 1\.2rem;/g, 'padding: 0.6rem 1rem;'); /* primary btn */
css = css.replace(/min-height: 44px;/g, 'min-height: 38px;'); /* google btn */
css = css.replace(/margin-top: 1\.2rem;/g, 'margin-top: 0.75rem;'); /* google btn */
css = css.replace(/padding: 8px 16px;/g, 'padding: 6px 12px;'); /* google btn */

css = css.replace(/margin: 2\.5rem 0 1rem 0;/g, 'margin: 1.25rem 0 0.75rem 0;'); /* divider */

fs.writeFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', css, 'utf8');
