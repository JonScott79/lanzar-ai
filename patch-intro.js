const fs = require('fs');

// 1. Update HTML
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

const checkboxHtml = `
        <label for="disable-intro-check" class="disable-intro-label" style="position: absolute; top: 2rem; right: 10rem; color: #fff; font-family: var(--font-code); font-size: 0.8rem; cursor: pointer; z-index: 10000; opacity: 0.6; transition: 0.3s; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase;">
            <input type="checkbox" id="disable-intro-check"> Don't show again
        </label>
`;
html = html.replace('<button id="skip-intro" class="btn-skip">SKIP INTRO</button>', '<button id="skip-intro" class="btn-skip">SKIP INTRO</button>\n' + checkboxHtml);
fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

// 2. Update animation.js
let js = fs.readFileSync('C:/Projects/LANZAR/homepage/js/animation.js', 'utf8');

const newInit = `export function initAnimation() {
    const introSequence = document.getElementById('intro-sequence');
    const worldWindow = document.getElementById('world-window');
    
    // Check if intro is skipped globally or for session
    if (localStorage.getItem('skip_lanzar_intro') === 'true' || sessionStorage.getItem('lanzar_intro_played') === 'true') {
        if(introSequence) introSequence.style.display = 'none';
        if(worldWindow) worldWindow.classList.remove('hidden');
        return;
    }
    
    // Mark as played for this session
    sessionStorage.setItem('lanzar_intro_played', 'true');
    
    const disableCheck = document.getElementById('disable-intro-check');
    if (disableCheck) {
        disableCheck.checked = (localStorage.getItem('skip_lanzar_intro') === 'true');
        disableCheck.addEventListener('change', (e) => {
            if (e.target.checked) {
                localStorage.setItem('skip_lanzar_intro', 'true');
            } else {
                localStorage.removeItem('skip_lanzar_intro');
            }
        });
    }

    const skipBtn = document.getElementById('skip-intro');`;

js = js.replace(/export function initAnimation\(\) {\s*const introSequence = document\.getElementById\('intro-sequence'\);\s*const worldWindow = document\.getElementById\('world-window'\);\s*const skipBtn = document\.getElementById\('skip-intro'\);/, newInit);

fs.writeFileSync('C:/Projects/LANZAR/homepage/js/animation.js', js, 'utf8');
