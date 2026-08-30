const fs = require('fs');

const mainContent = `
            <main>
                <!-- 1. HERO -->
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

                <!-- 2. PHILOSOPHY -->
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
                                    I'm a veteran web designer, developer, and lifelong builder with an obsession for creating things people actually remember.
                                </p>
                                
                                <p style="margin-bottom: 2.5rem; font-family: var(--font-code); color: var(--color-text-light); border-left: 4px solid var(--color-accent); padding-left: 1.5rem;">
                                    Technology isn't going anywhere. Don't fight it. Understand it. Learn it. Use it. Build with it. Make it work for people.<br><br>
                                    There is always a person. We just give that person better tools.
                                </p>
                                
                                <div style="height: 2px; background: var(--color-accent); width: 80px; margin: 3rem 0; opacity: 0.3;"></div>

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

                <!-- 3. MISSIONS -->
                <section id="projects" class="content-section" style="background: var(--color-primary); padding: 6rem 0;">
                    <div class="container" style="max-width: 1200px;">
                        
                        <div style="text-align: center; margin-bottom: 4rem;">
                            <h2 style="color: var(--color-cream); font-family: var(--font-heading); font-size: 3rem; text-transform: uppercase; letter-spacing: 2px;">Mission Control</h2>
                            <p style="color: var(--color-accent); font-family: var(--font-code); font-size: 1.2rem; text-transform: uppercase;">Tracking active LANZAR developments & live operations.</p>
                        </div>

                        <div class="mission-layout" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 4rem; align-items: start;">
                            
                            <!-- Left: Mission Artwork -->
                            <div class="mission-art">
                                <img src="assets/mission-control.jpg" alt="LANZAR Mission Control" style="width: 100%; border-radius: 8px; border: 3px solid var(--color-accent); box-shadow: 8px 8px 0px rgba(0,0,0,0.5);" />
                                <div style="margin-top: 2rem; color: var(--color-cream); font-size: 1.1rem; line-height: 1.6;">
                                    <p style="margin-bottom: 1rem;"><strong>Come watch us build.</strong></p>
                                    <p style="margin-bottom: 1rem;">Unlike most agencies, we don't disappear until launch day. We believe the best systems are built through collaboration, giving clients the opportunity to follow progress and help shape the final result.</p>
                                    <p>For our own projects, we build in public whenever possible because we believe progress is more interesting than perfection.</p>
                                </div>
                            </div>

                            <!-- Right: Mission Log (from web.lanzar.me) -->
                            <div class="mission-log" style="display: flex; flex-direction: column; gap: 1.5rem;">
                                
                                <!-- Threadline -->
                                <div class="mission-panel" style="background: var(--color-background); border: 2px solid var(--color-accent); border-radius: 6px; padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                        <span style="font-family: var(--font-code); background: var(--color-accent); color: var(--color-primary); padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: bold; border-radius: 4px;">● ACTIVE DEVELOPMENT</span>
                                        <a href="https://threadline.lanzar.me" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; text-decoration: none;">THREADLINE</a>
                                    </div>
                                    <p style="color: var(--color-text); font-size: 1.05rem;">AI-powered communication intelligence platform that analyzes conversations, identifies behavioral patterns, and transforms complex interactions into actionable insights.</p>
                                </div>

                                <!-- Thermo-Predict -->
                                <div class="mission-panel" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                        <span style="font-family: var(--font-code); background: #E0E0E0; color: var(--color-primary); padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: bold; border-radius: 4px;">BUILDING</span>
                                        <a href="https://thermo-predict.wpi.edu" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; text-decoration: none;">THERMO-PREDICT</a>
                                    </div>
                                    <p style="color: var(--color-text); font-size: 1.05rem;">AI-powered chemical prediction platform developed in collaboration with Worcester Polytechnic Institute.</p>
                                </div>

                                <!-- LANZAR -->
                                <div class="mission-panel" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                        <span style="font-family: var(--font-code); background: var(--color-primary); color: var(--color-cream); padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: bold; border-radius: 4px;">★ FLAGSHIP</span>
                                        <a href="https://lanzar.me" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; text-decoration: none;">LANZAR.ME</a>
                                    </div>
                                    <p style="color: var(--color-text); font-size: 1.05rem;">You're looking at it. The mothership of LANZAR, showcasing custom web design, software development, IT, and digital experiences.</p>
                                </div>

                                <!-- Stirmycoffee -->
                                <div class="mission-panel" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                        <span style="font-family: var(--font-code); background: #2E7D32; color: white; padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: bold; border-radius: 4px;">✓ LIVE</span>
                                        <a href="https://stirmycoffee.com" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; text-decoration: none;">STIR MY COFFEE</a>
                                    </div>
                                    <p style="color: var(--color-text); font-size: 1.05rem;">Community-powered coffee ratings helping people discover consistently great coffee shops.</p>
                                </div>

                                <!-- HomeNetHudson -->
                                <div class="mission-panel" style="background: var(--color-background); border: 2px solid var(--color-primary); border-radius: 6px; padding: 1.5rem;">
                                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.5rem;">
                                        <span style="font-family: var(--font-code); background: #2E7D32; color: white; padding: 0.25rem 0.5rem; font-size: 0.8rem; font-weight: bold; border-radius: 4px;">✓ LIVE</span>
                                        <a href="https://homenethudson.com" target="_blank" style="font-family: var(--font-heading); color: var(--color-primary); font-size: 1.2rem; text-decoration: none;">HOMENET HUDSON</a>
                                    </div>
                                    <p style="color: var(--color-text); font-size: 1.05rem;">Technology support, managed services, web design, and digital solutions for homes and small businesses.</p>
                                </div>

                            </div>
                        </div>
                    </div>
                </section>

                <!-- 4. WHAT WE DO (ECOSYSTEM) -->
                <section id="what-we-do" class="content-section" style="padding: 6rem 0;">
                    <div class="container">
                        <div style="text-align: center; margin-bottom: 4rem;">
                            <h2 style="font-size: 3rem; margin-bottom: 1rem; color: var(--color-primary); text-transform: uppercase;">The LANZAR Ecosystem</h2>
                            <p style="font-size: 1.2rem; color: var(--color-text-light);">Purpose-built divisions for every aspect of your digital infrastructure.</p>
                        </div>
                        
                        <div class="grid-placeholder" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem;">
                            
                            <a href="https://web.lanzar.me" class="card-placeholder" style="background-image: linear-gradient(rgba(16, 42, 67, 0.8), rgba(16, 42, 67, 0.8)), url('assets/city/cosmic-diner.jpg'); background-size: cover; background-position: center; border: 2px solid var(--color-accent); color: var(--color-cream); text-decoration: none; padding: 3rem 2rem; border-radius: 8px; text-align: center; transition: all 0.2s;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Web Design & Development</h3>
                                <p style="font-family: var(--font-code); color: var(--color-accent);">web.lanzar.me</p>
                            </a>
                            
                            <a href="https://it.lanzar.me" class="card-placeholder" style="background-image: linear-gradient(rgba(16, 42, 67, 0.8), rgba(16, 42, 67, 0.8)), url('assets/city/lanzar-hq.jpg'); background-size: cover; background-position: center; border: 2px solid var(--color-accent); color: var(--color-cream); text-decoration: none; padding: 3rem 2rem; border-radius: 8px; text-align: center; transition: all 0.2s;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Managed IT & Networks</h3>
                                <p style="font-family: var(--font-code); color: var(--color-accent);">it.lanzar.me</p>
                            </a>
                            
                            <a href="https://threadline.lanzar.me" class="card-placeholder" style="background-image: linear-gradient(rgba(16, 42, 67, 0.8), rgba(16, 42, 67, 0.8)), url('assets/services/software-applications.jpg'); background-size: cover; background-position: center; border: 2px solid var(--color-accent); color: var(--color-cream); text-decoration: none; padding: 3rem 2rem; border-radius: 8px; text-align: center; transition: all 0.2s;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Software & Applications</h3>
                                <p style="font-family: var(--font-code); color: var(--color-accent);">threadline.lanzar.me</p>
                            </a>

                            <a href="https://ai.lanzar.me" class="card-placeholder" style="position: relative; background-image: linear-gradient(rgba(16, 42, 67, 0.8), rgba(16, 42, 67, 0.8)), url('assets/services/ai-automation.jpg'); background-size: cover; background-position: center; border: 2px solid rgba(226, 184, 77, 0.4); color: var(--color-cream); text-decoration: none; padding: 3rem 2rem; border-radius: 8px; text-align: center; transition: all 0.2s;">
                                <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">AI & Automation</h3>
                                <p style="font-family: var(--font-code); color: var(--color-accent); opacity: 0.7;">ai.lanzar.me</p>
                                <span style="position: absolute; top: 1rem; right: 1rem; background: var(--color-primary); color: var(--color-cream); padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: bold; border: 1px solid var(--color-accent);">COMING SOON</span>
                            </a>
                        </div>
                    </div>
                </section>

                <!-- 5. CUSTOMER ACCESS -->
                <section id="support" class="content-section" style="background: rgba(16, 42, 67, 0.05); border-top: 1px solid rgba(0,0,0,0.1); border-bottom: 1px solid rgba(0,0,0,0.1); padding: 4rem 0;">
                    <div class="container" style="text-align: center;">
                        <h2 style="color: var(--color-primary); margin-bottom: 0.5rem; font-size: 1.8rem;">ALREADY A CUSTOMER?</h2>
                        <p style="margin-bottom: 2rem; color: var(--color-text-light);">Access the LANZAR Customer Portal or open a support ticket.</p>
                        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                            <a href="https://portal.lanzar.me" class="btn-primary" style="padding: 0.75rem 2rem; font-size: 1rem;">CUSTOMER PORTAL</a>
                            <a href="https://tickets.lanzar.me" class="btn-secondary" style="padding: 0.75rem 2rem; font-size: 1rem; background: white;">OPEN A TICKET</a>
                        </div>
                    </div>
                </section>

                <!-- 6. CONTACT -->
                <section id="contact" class="content-section" style="background: var(--color-primary); padding: 8rem 0; color: var(--color-cream);">
                    <div class="container" style="max-width: 800px; text-align: center;">
                        <h2 style="font-size: 3rem; color: var(--color-accent); margin-bottom: 1.5rem; text-transform: uppercase;">Let's Build Something Worth Remembering.</h2>
                        
                        <p style="font-size: 1.3rem; margin-bottom: 1.5rem; line-height: 1.6;">
                            Whether you're launching a new business, refreshing an outdated website, or building custom software, every successful project starts with a conversation.
                        </p>
                        
                        <p style="font-size: 1.2rem; margin-bottom: 3rem; line-height: 1.6; opacity: 0.9;">
                            We'll discuss your goals, your audience, your budget, and what success looks like—then build a solution tailored specifically to your business.<br><br>
                            No sales pressure. No obligation. Just honest advice and a clear plan forward.
                        </p>
                        
                        <div class="cta-actions" style="display: flex; flex-direction: column; gap: 1rem; align-items: center;">
                            <a href="mailto:jon@lanzar.me" class="btn-primary btn-large" style="background: var(--color-accent); color: var(--color-primary); border: none; font-size: 1.3rem; padding: 1.2rem 3rem;">SEND AN EMAIL</a>
                            <a href="tel:+15085718819" style="color: var(--color-cream); font-family: var(--font-code); margin-top: 1rem; text-decoration: none; font-size: 1.1rem; border-bottom: 1px dashed var(--color-accent);">Call (508) 571-8819</a>
                        </div>
                    </div>
                </section>
            </main>
`;

let html = fs.readFileSync('C:/Projects/LANZAR/homepage/index.html', 'utf8');

// Replace everything inside <main>
html = html.replace(/<main>[\s\S]*?<\/main>/, mainContent);

// Ensure navigation is correct
html = html.replace(/<ul class="nav-list">[\s\S]*?<\/ul>/, `<ul class="nav-list">
                        <li><a href="#what-we-do" class="nav-link">ECOSYSTEM</a></li>
                        <li><a href="#projects" class="nav-link">MISSIONS</a></li>
                        <li><a href="#philosophy" class="nav-link">PHILOSOPHY</a></li>
                        <li><a href="https://portal.lanzar.me" class="nav-link">PORTAL</a></li>
                        <li><a href="#contact" class="nav-link btn-primary">CONTACT</a></li>
                    </ul>`);

fs.writeFileSync('C:/Projects/LANZAR/homepage/index.html', html, 'utf8');

// Add specific CSS for hover effects
let css = fs.readFileSync('C:/Projects/LANZAR/homepage/css/style.css', 'utf8');
css += `
/* Hover effects for new cards */
.card-placeholder:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
    border-color: var(--color-cream) !important;
}
.mission-panel {
    transition: transform 0.2s;
}
.mission-panel:hover {
    transform: translateX(10px);
}
@media (max-width: 1024px) {
    .mission-layout {
        grid-template-columns: 1fr !important;
    }
}
`;
fs.writeFileSync('C:/Projects/LANZAR/homepage/css/style.css', css, 'utf8');
