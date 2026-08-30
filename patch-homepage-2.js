const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

const philosophySection = `
                <section id="philosophy" class="content-section" style="background: var(--color-background); padding: 8rem 0; border-bottom: 2px solid var(--color-accent); position: relative; overflow: hidden;">
                    <div class="container" style="max-width: 1200px; position: relative; z-index: 2;">
                        
                        <!-- Header Statement -->
                        <div style="text-align: center; margin-bottom: 6rem; max-width: 900px; margin-left: auto; margin-right: auto;">
                            <h2 style="font-family: var(--font-heading); font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.1; margin-bottom: 1rem; color: var(--color-primary); text-transform: uppercase;">
                                The future isn't something we're waiting for.
                            </h2>
                            <h3 style="font-family: var(--font-heading); font-size: clamp(2rem, 4vw, 3rem); color: var(--color-accent); font-weight: bold; text-transform: uppercase; margin: 0;">
                                It's something we're building.
                            </h3>
                        </div>

                        <!-- Philosophy Grid -->
                        <div class="philosophy-grid" style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 5rem; align-items: start;">
                            
                            <!-- Left Column: Copy -->
                            <div class="philosophy-text" style="font-size: 1.2rem; line-height: 1.8; color: var(--color-text);">
                                
                                <p style="font-family: var(--font-heading); font-weight: bold; font-size: 1.8rem; margin-bottom: 2rem; color: var(--color-primary); text-transform: uppercase;">
                                    Hi, I'm Jon. Welcome aboard.
                                </p>
                                
                                <p style="margin-bottom: 1.5rem; font-size: 1.3rem;">
                                    I'm a lifelong builder with an obsession for creating things people actually remember.
                                </p>
                                
                                <p style="margin-bottom: 2.5rem; font-family: var(--font-code); color: var(--color-text-light); border-left: 4px solid var(--color-accent); padding-left: 1.5rem;">
                                    Technology isn't going anywhere. Don't fight it. Understand it. Learn it. Use it. Build with it. Make it work for people.<br><br>
                                    There is always a person. We just give that person better tools.
                                </p>
                                
                                <div style="height: 2px; background: var(--color-accent); width: 80px; margin: 3rem 0; opacity: 0.3;"></div>

                                <h4 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--color-primary); margin-bottom: 1rem; text-transform: uppercase;">Every business is different.</h4>

                                <p style="margin-bottom: 1.5rem;">
                                    I don't believe every business deserves another generic template or an out-of-the-box system that forces you to work the way <em>it</em> wants you to work.
                                </p>
                                
                                <p style="margin-bottom: 1.5rem;">
                                    Every company has a story, a personality, and something that makes it different. My job is to uncover that and build a solution that feels like an extension of the business—not just another piece of software.
                                </p>
                                
                                <p style="margin-bottom: 3rem;">
                                    That means thinking beyond the code. What builds trust? What makes someone stay... or leave? Every animation, every color, every button, and every sentence has a purpose.
                                </p>

                                <div style="background: rgba(226, 184, 77, 0.1); border: 2px solid var(--color-accent); padding: 2rem; border-radius: 8px;">
                                    <h4 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--color-accent); margin-bottom: 1rem; text-transform: uppercase; line-height: 1.2;">
                                        We don't know exactly what tomorrow looks like. That's the fun part.
                                    </h4>
                                    <p style="font-size: 1.3rem; margin-bottom: 1.5rem; font-weight: bold;">We want to build it.</p>
                                    <p style="font-family: var(--font-code); color: var(--color-primary); font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
                                        > I'd love to build something remarkable together.
                                    </p>
                                </div>
                            </div>
                            
                            <!-- Right Column: Artwork -->
                            <div class="philosophy-image" style="position: sticky; top: 120px;">
                                <div style="position: relative;">
                                    <div style="position: absolute; top: -15px; left: -15px; right: 15px; bottom: 15px; border: 4px solid var(--color-primary); z-index: 0; border-radius: 8px;"></div>
                                    <img src="assets/philosophy-workshop.jpg" alt="LANZAR Philosophy Workshop" style="width: 100%; height: auto; position: relative; z-index: 1; border-radius: 8px; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 2px solid var(--color-accent);" />
                                    <div style="position: absolute; bottom: -20px; right: 20px; background: var(--color-primary); color: var(--color-cream); padding: 0.5rem 1rem; font-family: var(--font-code); font-size: 0.85rem; font-weight: bold; z-index: 2; border-radius: 4px;">
                                        FIG 1. LANZAR MOTHERSHIP
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>
`;

// Extract what-we-do, support, projects, and contact
const whatWeDoMatch = html.match(/(<section id="what-we-do"[\s\S]*?<\/section>)/);
const supportMatch = html.match(/(<section id="support"[\s\S]*?<\/section>)/);
const projectsMatch = html.match(/(<section id="projects"[\s\S]*?<\/section>)/);
const contactMatch = html.match(/(<section id="contact"[\s\S]*?<\/section>)/);

// Build new main content
const newMainContent = `
                <section class="hero-section">
                    <div class="hero-content">
                        <h1 class="sr-only">LANZAR</h1>
                        <h2 class="hero-tagline">BUILD TOMORROW. STARTING TODAY.</h2>
                        <p class="hero-capabilities">Websites. Software. AI. Automation. IT. Digital Systems.</p>
                        
                        <div class="hero-actions">
                            <a href="#contact" class="btn-primary btn-large">LET'S GO</a>
                            <a href="#what-we-do" class="btn-secondary">SHALL WE SHOW YOU THE POSSIBILITIES?</a>
                        </div>
                    </div>
                </section>
                
${philosophySection}

${projectsMatch[1]}

${whatWeDoMatch[1]}

${supportMatch[1]}

${contactMatch[1]}
            </main>
`;

// Replace main tag content
const updatedHtml = html.replace(/<main>[\s\S]*?<\/main>/, `<main>${newMainContent}`);

// Update the nav links
let finalHtml = updatedHtml.replace('<li><a href="/about/" class="nav-link">ABOUT</a></li>', '<li><a href="#philosophy" class="nav-link">PHILOSOPHY</a></li>');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', finalHtml, 'utf8');

// Append CSS for mobile responsiveness
let css = fs.readFileSync('C:/Projects/LANZAR/homepage/css/style.css', 'utf8');
css += `
/* Philosophy Section Adjustments */
@media (max-width: 1024px) {
    .philosophy-grid {
        grid-template-columns: 1fr !important;
        gap: 4rem !important;
    }
    
    .philosophy-image {
        position: relative !important;
        top: 0 !important;
        order: -1; /* Put image above text on mobile/tablet */
    }
}
`;
fs.writeFileSync('C:/Projects/LANZAR/homepage/css/style.css', css, 'utf8');

