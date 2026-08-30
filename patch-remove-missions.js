const fs = require('fs');
let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

// Replace the entire Projects / Missions section
const oldProjectsRegex = /<section id="projects"[\s\S]*?<\/section>/;

const newProjectsSection = `
                <section id="projects" class="content-section" style="background: var(--color-primary); padding: 6rem 0;">
                    <div class="container" style="max-width: 1000px;">
                        
                        <div style="text-align: center; margin-bottom: 4rem;">
                            <h2 style="color: var(--color-cream); font-family: var(--font-heading); font-size: 3rem; text-transform: uppercase; letter-spacing: 2px;">PROJECTS</h2>
                            <p style="color: var(--color-accent); font-family: var(--font-code); font-size: 1.2rem; text-transform: uppercase;">Things we're building, things we've built, and things we're still figuring out.</p>
                        </div>

                        <div class="projects-list" style="display: flex; flex-direction: column; gap: 1.5rem;">
                            
                            <!-- Threadline -->
                            <div class="project-card" style="background: var(--color-background); border: 2px solid var(--color-accent); border-radius: 6px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                    <a href="https://threadline.lanzar.me" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; text-decoration: none;">THREADLINE</a>
                                    <span style="font-family: var(--font-code); color: var(--color-text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">In Development</span>
                                </div>
                                <p style="color: var(--color-text); font-size: 1.1rem; line-height: 1.6;">AI-powered communication intelligence platform that analyzes conversations, identifies behavioral patterns, and transforms complex interactions into actionable insights.</p>
                            </div>

                            <!-- Thermo-Predict -->
                            <div class="project-card" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                    <a href="https://thermo-predict.wpi.edu" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; text-decoration: none;">THERMO-PREDICT</a>
                                    <span style="font-family: var(--font-code); color: var(--color-text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">In Development</span>
                                </div>
                                <p style="color: var(--color-text); font-size: 1.1rem; line-height: 1.6;">AI-powered chemical prediction platform developed in collaboration with Worcester Polytechnic Institute.</p>
                            </div>

                            <!-- LANZAR -->
                            <div class="project-card" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                    <a href="https://lanzar.me" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; text-decoration: none;">LANZAR.ME</a>
                                    <span style="font-family: var(--font-code); color: var(--color-text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Flagship</span>
                                </div>
                                <p style="color: var(--color-text); font-size: 1.1rem; line-height: 1.6;">You're looking at it. The home of LANZAR, showcasing custom web design, development, branding, and digital experiences.</p>
                            </div>

                            <!-- Stirmycoffee -->
                            <div class="project-card" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                    <a href="https://stirmycoffee.com" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; text-decoration: none;">STIR MY COFFEE</a>
                                    <span style="font-family: var(--font-code); color: var(--color-text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Live</span>
                                </div>
                                <p style="color: var(--color-text); font-size: 1.1rem; line-height: 1.6;">Community-powered coffee ratings helping people discover consistently great coffee shops.</p>
                            </div>

                            <!-- HomeNetHudson -->
                            <div class="project-card" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 2rem;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                    <a href="https://homenethudson.com" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.5rem; text-decoration: none;">HOMENET HUDSON</a>
                                    <span style="font-family: var(--font-code); color: var(--color-text-light); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px;">Live</span>
                                </div>
                                <p style="color: var(--color-text); font-size: 1.1rem; line-height: 1.6;">Technology support, managed services, web design, and digital solutions for homes and small businesses.</p>
                            </div>

                        </div>
                    </div>
                </section>
`;

html = html.replace(oldProjectsRegex, newProjectsSection);

// Update nav links to remove MISSIONS
html = html.replace(/<li><a href="#projects" class="nav-link">MISSIONS<\/a><\/li>/g, '<li><a href="#projects" class="nav-link">PROJECTS</a></li>');

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

// Also remove mission-control.jpg from GRAPHICS_NEEDED.md
let graphics = fs.readFileSync('C:/Projects/LANZAR/homepage/GRAPHICS_NEEDED.md', 'utf8');
graphics = graphics.replace(/- Mission Control Console \(mission-control\.jpg\)/g, '');
fs.writeFileSync('C:/Projects/LANZAR/homepage/GRAPHICS_NEEDED.md', graphics, 'utf8');
