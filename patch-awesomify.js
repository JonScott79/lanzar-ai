const fs = require('fs');

// 1. Update HTML
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

const oldTerminalUIRegex = /<div class="terminal-scene"[\s\S]*?<\/div>\s*<\/div>/;

const newTerminalUI = `
                        <div class="terminal-scene" style="width: 100%; margin-top: 2rem;">
                            <div class="terminal-enclosure">
                                <div class="terminal-casing">
                                    <!-- Header / Indicators -->
                                    <div class="terminal-header-bar">
                                        <span class="led-red"></span>
                                        <span class="led-green"></span>
                                        <span class="terminal-label">LANZAR MISSION LOG // SYS.01</span>
                                    </div>
                                    
                                    <!-- CRT Screen Bezel -->
                                    <div class="terminal-screen-bezel">
                                        <div class="crt-scanlines"></div>
                                        <div class="crt-glare"></div>
                                        <iframe id="blog-display" src="blog/philosophy.html" title="LANZAR Journal Transmission"></iframe>
                                    </div>
                                    
                                    <!-- Chunky Control Panel -->
                                    <div class="terminal-control-panel">
                                        <button id="blog-previous" class="retro-btn">◀ PREV</button>
                                        <div class="ventilation-grille">
                                            <span></span><span></span><span></span><span></span><span></span><span></span>
                                        </div>
                                        <button id="blog-next" class="retro-btn">NEXT ▶</button>
                                    </div>
                                </div>
                            </div>
                        </div>
`;

html = html.replace(oldTerminalUIRegex, newTerminalUI.trim());
fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

// 2. Update CSS
let css = fs.readFileSync('C:/Projects/LANZAR/homepage/css/style.css', 'utf8');

// Remove the old CSS block
css = css.replace(/\/\* ==========================================================\r?\n\s*BILLBOARD TERMINAL[\s\S]*?(?=\/\*|$)/, '');

// Append new CSS
const newCSS = `
/* ==========================================================
   PURE CSS RETRO TERMINAL
   ========================================================== */

.terminal-enclosure {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding: 1rem;
    perspective: 1000px;
}

.terminal-casing {
    background: #e3dec9; /* Vintage beige plastic */
    border-radius: 16px;
    padding: 24px;
    box-shadow: 
        inset -4px -4px 10px rgba(0,0,0,0.15),
        inset 4px 4px 10px rgba(255,255,255,0.7),
        0 25px 50px rgba(0,0,0,0.3);
    border: 2px solid #c4bfab;
    transform: rotateX(2deg); /* Slight upward tilt */
}

.terminal-header-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 0 10px;
}

.led-red, .led-green {
    width: 12px; 
    height: 12px; 
    border-radius: 50%;
    border: 1px solid rgba(0,0,0,0.2);
    box-shadow: inset 1px 1px 2px rgba(255,255,255,0.5);
}

.led-red { 
    background: #ff3b30; 
    box-shadow: 0 0 10px #ff3b30, inset 1px 1px 2px rgba(255,255,255,0.5); 
}

.led-green { 
    background: #34c759; 
    box-shadow: 0 0 10px #34c759, inset 1px 1px 2px rgba(255,255,255,0.5); 
    animation: led-blink 3s infinite; 
}

@keyframes led-blink {
    0%, 95% { opacity: 1; }
    96%, 99% { opacity: 0.3; }
    100% { opacity: 1; }
}

.terminal-label {
    font-family: var(--font-code, monospace);
    font-size: 0.8rem;
    color: #8c8774;
    letter-spacing: 3px;
    margin-left: auto;
    font-weight: bold;
    text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
}

.terminal-screen-bezel {
    background: #0a0a0c;
    padding: 24px;
    border-radius: 12px;
    border: 6px solid #2a2b2e;
    border-bottom-color: #1a1b1d;
    border-right-color: #1a1b1d;
    box-shadow: inset 0 0 30px #000, 0 5px 15px rgba(0,0,0,0.2);
    position: relative;
    height: 450px;
    overflow: hidden;
}

.terminal-screen-bezel iframe {
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
    background: #fcf9f2; /* Paper background of the blog */
    position: relative;
    z-index: 1;
}

.crt-scanlines {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.05) 50%);
    background-size: 100% 4px;
    pointer-events: none;
    z-index: 10;
}

.crt-glare {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 50%);
    pointer-events: none;
    z-index: 11;
}

.terminal-control-panel {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding: 0 10px;
}

.retro-btn {
    background: #e2b84d; /* LANZAR Accent */
    color: #102a43; /* LANZAR Primary */
    border: 2px solid #b89232;
    padding: 12px 24px;
    font-family: var(--font-code, monospace);
    font-weight: 800;
    font-size: 0.9rem;
    border-radius: 6px;
    cursor: pointer;
    box-shadow: 
        0 6px 0 #947424,
        0 10px 10px rgba(0,0,0,0.2),
        inset 1px 1px 2px rgba(255,255,255,0.5);
    transition: all 0.1s;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.retro-btn:active {
    transform: translateY(6px);
    box-shadow: 
        0 0px 0 #947424,
        0 2px 4px rgba(0,0,0,0.2),
        inset 1px 1px 2px rgba(255,255,255,0.5);
}

.ventilation-grille {
    display: flex;
    gap: 8px;
}

.ventilation-grille span {
    width: 6px;
    height: 24px;
    background: #2a2b2e;
    border-radius: 4px;
    box-shadow: inset 1px 1px 3px rgba(0,0,0,0.8), 1px 1px 0 rgba(255,255,255,0.4);
}

@media (max-width: 600px) {
    .terminal-casing {
        padding: 16px;
    }
    .terminal-screen-bezel {
        height: 350px;
        padding: 16px;
    }
    .retro-btn {
        padding: 10px 16px;
        font-size: 0.8rem;
    }
    .ventilation-grille {
        display: none;
    }
}
`;

fs.writeFileSync('C:/Projects/LANZAR/homepage/css/style.css', css + newCSS, 'utf8');

