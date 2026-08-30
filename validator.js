const fs = require('fs');
const path = require('path');

const projects = [
    { name: 'Mothership', dir: path.join('C:', 'Projects', 'LANZAR', 'homepage') },
    { name: 'Web', dir: path.join('C:', 'Projects', 'LANZAR', 'web') },
    { name: 'IT', dir: path.join('C:', 'Projects', 'LANZAR', 'IT') }
];

let errors = 0;

function checkJSON(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (matches) {
        matches.forEach(match => {
            const jsonStr = match.replace('<script type="application/ld+json">', '').replace('</script>', '').trim();
            try {
                JSON.parse(jsonStr);
                console.log(`[PASS] Valid JSON-LD in ${filePath}`);
            } catch (e) {
                console.error(`[FAIL] Invalid JSON-LD in ${filePath}: ${e.message}`);
                errors++;
            }
        });
    }
}

function checkRobots(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('Disallow: /') && !content.includes('Disallow: /blog/_template.html')) {
            console.error(`[FAIL] robots.txt is blocking all traffic in ${filePath}`);
            errors++;
        } else {
            console.log(`[PASS] robots.txt looks good in ${filePath}`);
        }
    } else {
        console.error(`[FAIL] Missing robots.txt in ${filePath}`);
        errors++;
    }
}

function checkSitemap(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content.includes('<urlset')) {
            console.error(`[FAIL] Invalid sitemap XML in ${filePath}`);
            errors++;
        } else {
            console.log(`[PASS] sitemap.xml exists and has urlset in ${filePath}`);
        }
    } else {
        console.error(`[FAIL] Missing sitemap.xml in ${filePath}`);
        errors++;
    }
}

projects.forEach(proj => {
    console.log(`\n--- Validating ${proj.name} ---`);
    
    // Check files recursively for JSON-LD
    function walk(dir) {
        if (!fs.existsSync(dir)) return;
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            if (stat && stat.isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') walk(fullPath);
            } else if (file.endsWith('.html')) {
                checkJSON(fullPath);
            }
        });
    }
    walk(proj.dir);

    // Check robots & sitemap
    checkRobots(path.join(proj.dir, 'robots.txt'));
    checkSitemap(path.join(proj.dir, 'sitemap.xml'));
});

if (errors === 0) {
    console.log('\n✅ ALL VALIDATION CHECKS PASSED');
    process.exit(0);
} else {
    console.log(`\n❌ FOUND ${errors} ERRORS`);
    process.exit(1);
}
