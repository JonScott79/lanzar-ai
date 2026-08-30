const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

const terminalUI = `
                        <div class="terminal-scene" style="display: flex; flex-direction: column; align-items: center; width: 100%; position: relative; margin-top: 2rem;">
                            <!-- BILLBOARD -->
                            <div class="journal-billboard">
                                <img src="assets/images/billboard.png" alt="LANZAR Future Information Terminal" />
                                <div class="terminal-screen">
                                    <iframe id="blog-display" src="blog/philosophy.html" title="LANZAR Journal Transmission"></iframe>
                                </div>
                            </div>
                            
                            <!-- CONTROLS -->
                            <div class="terminal-controls">
                                <button id="blog-previous" type="button">◀ PREV</button>
                                <button id="blog-next" type="button">NEXT ▶</button>
                            </div>
                        </div>
`;

html = html.replace('<div class="artwork-placeholder">[ PHILOSOPHY ARTWORK ]</div>', terminalUI);

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

// Also inject the CSS
let css = fs.readFileSync('C:/Projects/LANZAR/homepage/css/style.css', 'utf8');
css += `
/* ==========================================================
   BILLBOARD TERMINAL
   ========================================================== */

.journal-billboard {
  position: relative;
  width: min(850px, 90vw);
  z-index: 10;
  margin: 0 auto;
}

.journal-billboard > img {
  display: block;
  width: 100%;
  height: auto;
}

.terminal-screen {
  position: absolute;
  top: 27%;
  left: 26%;
  width: 47%;
  height: 30%;
  overflow: hidden;
  border-radius: 18px;
}

.terminal-screen iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.terminal-controls {
  display: flex;
  gap: 20px;
  margin-top: -35px;
  z-index: 20;
}

.terminal-controls button {
  padding: 12px 24px;
  font-family: var(--font-code);
  font-size: 0.85rem;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--color-background);
  background: var(--color-accent);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.2s, background 0.2s;
  font-weight: bold;
}

.terminal-controls button:hover {
  transform: translateY(-3px);
  background: var(--color-primary);
  color: var(--color-cream);
}

@media (max-width: 768px) {
  .journal-billboard {
    width: 100%;
    max-width: 100%;
    background: #fdfaf4;
    border: 2px solid rgba(42, 114, 143, 0.15);
    border-radius: 8px;
    padding: 15px;
  }
  .journal-billboard > img {
    display: none;
  }
  .terminal-screen {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    height: 380px;
    border-radius: 8px;
    border: 1px solid rgba(42, 114, 143, 0.1);
    background: #fffdf8;
  }
  .terminal-controls {
    margin-top: 20px;
    width: 100%;
    justify-content: center;
    gap: 15px;
  }
  .terminal-controls button {
    flex: 1;
    max-width: 120px;
    padding: 10px 15px;
    font-size: 0.75rem;
  }
}
`;
fs.writeFileSync('C:/Projects/LANZAR/homepage/css/style.css', css, 'utf8');

// Now inject the JS into main.js
let js = fs.readFileSync('C:/Projects/LANZAR/homepage/js/main.js', 'utf8');
js += `
// =====================================
// Blog Display Controls
// =====================================
document.addEventListener("DOMContentLoaded", () => {
    const blogs = [
        "blog/philosophy.html",
        "blog/public-built.html",
        "blog/origin.html",
        "blog/digital-frontier.html",
        "blog/catting-code.html",
        "blog/ninety-nine-login.html"
    ];
    let currentBlog = 0;
    
    const screen = document.getElementById("blog-display");
    const btnPrev = document.getElementById("blog-previous");
    const btnNext = document.getElementById("blog-next");
    
    if (screen && btnPrev && btnNext) {
        btnPrev.addEventListener("click", () => {
            currentBlog--;
            if (currentBlog < 0) currentBlog = blogs.length - 1;
            screen.src = blogs[currentBlog];
        });
        
        btnNext.addEventListener("click", () => {
            currentBlog++;
            if (currentBlog >= blogs.length) currentBlog = 0;
            screen.src = blogs[currentBlog];
        });
    }
});
`;
fs.writeFileSync('C:/Projects/LANZAR/homepage/js/main.js', js, 'utf8');
