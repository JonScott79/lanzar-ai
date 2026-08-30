const fs = require('fs');
let css = fs.readFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', 'utf8');

css = css.replace(/padding: 2\.5rem;/g, 'padding: 2rem;');
css = css.replace(/max-width: 440px;/g, 'max-width: 380px;');
css = css.replace(/font-size: 2\.2rem;/g, 'font-size: 1.8rem;');
css = css.replace(/margin-bottom: 1\.8rem;/g, 'margin-bottom: 1.2rem;');
css = css.replace(/font-size: 1\.1rem;/g, 'font-size: 0.95rem;');
css = css.replace(/padding: 1rem;/g, 'padding: 0.8rem;');
css = css.replace(/padding: 0\.85rem 1\.5rem;/g, 'padding: 0.7rem 1.2rem;');
css = css.replace(/font-size: 1rem;/g, 'font-size: 0.85rem;');
css = css.replace(/min-height: 52px;/g, 'min-height: 44px;');
css = css.replace(/padding: 12px 24px;/g, 'padding: 8px 16px;');
css = css.replace(/width: 24px;/g, 'width: 20px;');
css = css.replace(/height: 24px;/g, 'height: 20px;');
css = css.replace(/margin-top: 1\.5rem;/g, 'margin-top: 1.2rem;');
css = css.replace(/margin-bottom: 0\.75rem;/g, 'margin-bottom: 0.5rem;');
css = css.replace(/border: 4px solid/g, 'border: 3px solid');
css = css.replace(/border: 3px solid/g, 'border: 2px solid');
css = css.replace(/box-shadow: 8px 8px 0px/g, 'box-shadow: 6px 6px 0px');

fs.writeFileSync('C:/Projects/LANZAR/auth/src/pages/Login.css', css, 'utf8');
