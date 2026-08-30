const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

html = html.replace(
  /<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">/,
  '<div class="philosophy-grid">'
);

html = html.replace(
  /<h2 style="font-size: 3rem; margin-bottom: 1rem; color: var\(--color-primary\); text-transform: uppercase;">/,
  '<h2 class="philosophy-heading">'
);

html = html.replace(
  /<h3 style="font-size: 2\.2rem; color: var\(--color-accent\); font-weight: bold; text-transform: uppercase;">/,
  '<h3 class="philosophy-subheading">'
);

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

let css = fs.readFileSync('C:/Projects/LANZAR/homepage/css/main.css', 'utf8');

css += `
/* Philosophy Section */
.philosophy-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
    align-items: center;
}

.philosophy-heading {
    font-size: 3rem;
    margin-bottom: 1rem;
    color: var(--color-primary);
    text-transform: uppercase;
}

.philosophy-subheading {
    font-size: 2.2rem;
    color: var(--color-accent);
    font-weight: bold;
    text-transform: uppercase;
}

@media (max-width: 900px) {
    .philosophy-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
    
    .philosophy-heading {
        font-size: 2rem;
    }
    
    .philosophy-subheading {
        font-size: 1.5rem;
    }
    
    .philosophy-image {
        order: -1; /* Put image above text on mobile */
    }
}
`;

fs.writeFileSync('C:/Projects/LANZAR/homepage/css/main.css', css, 'utf8');
