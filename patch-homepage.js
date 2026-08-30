const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

const philosophySection = `
                <section id="philosophy" class="content-section" style="background: var(--color-background); padding: 6rem 0;">
                    <div class="container" style="max-width: 1200px;">
                        
                        <div style="text-align: center; margin-bottom: 4rem;">
                            <h2 style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-primary); text-transform: uppercase;">The future isn't something we're waiting for.</h2>
                            <h3 style="font-size: 2.2rem; color: var(--color-accent); font-weight: bold; text-transform: uppercase;">It's something we're building.</h3>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">
                            <div class="philosophy-text" style="font-size: 1.15rem; line-height: 1.8; color: var(--color-text);">
                                <p style="font-weight: bold; font-size: 1.3rem; margin-bottom: 1.5rem; color: var(--color-primary);">Hi, I'm Jon. Welcome aboard.</p>
                                
                                <p style="margin-bottom: 1.5rem;">I'm a lifelong builder with an obsession for creating things people actually remember.</p>
                                
                                <p style="margin-bottom: 1.5rem;">Technology isn't going anywhere. Don't fight it. Understand it. Learn it. Use it. Build with it. Make it work for people. There is always a person—we just give that person better tools.</p>
                                
                                <div style="height: 2px; background: var(--color-accent); width: 60px; margin: 2rem 0; opacity: 0.5;"></div>

                                <p style="margin-bottom: 1.5rem;">I don't believe every business deserves a generic solution. Every company has a story, a personality, and something that makes it different. My job is to uncover that and build systems that feel like an extension of the business.</p>
                                
                                <p style="margin-bottom: 1.5rem;">That means thinking beyond the code. What builds trust? Every animation, every color, every button, and every sentence has a purpose.</p>
                                
                                <p style="margin-bottom: 1.5rem;">LANZAR is about possibility. We don't know exactly what tomorrow looks like. That's the fun part. We want to build it.</p>
                                
                                <p style="font-weight: bold; color: var(--color-primary); font-size: 1.2rem;">I'd love to build something remarkable together.</p>
                            </div>
                            
                            <div class="philosophy-image">
                                <img src="assets/philosophy-workshop.jpg" alt="LANZAR Workshop" style="width: 100%; border-radius: 8px; border: 4px solid var(--color-primary); box-shadow: 12px 12px 0px var(--color-accent);" />
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

// Also update the nav links
let finalHtml = updatedHtml.replace('<li><a href="/about/" class="nav-link">ABOUT</a></li>', '<li><a href="#philosophy" class="nav-link">PHILOSOPHY</a></li>');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', finalHtml, 'utf8');
