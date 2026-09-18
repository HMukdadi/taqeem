const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`PASS: ${message}`);
        passed++;
    } else {
        console.error(`FAIL: ${message}`);
        failed++;
    }
}

const root = 'd:\\Projects\\taqeem';

// 1. Check index.html App Builder sync
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(indexHtml.includes("path: 'vote.html'"), 'index.html includes vote.html in filesToInclude');
assert(indexHtml.includes("path: 'lib/qrcode.js'"), 'index.html includes lib/qrcode.js in filesToInclude');
assert(indexHtml.includes("targetPath === 'vote.html'"), 'index.html replaces Supabase credentials in vote.html');
assert(indexHtml.includes('AUDIENCE CHOICE LIVE VOTING'), 'index.html console lists Audience Choice Voting');
assert(indexHtml.includes('LIVE STAGE ARENA & PROJECTOR SPOTLIGHT'), 'index.html console lists Stage Arena');

// 2. Check sw.js
const swJs = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
assert(swJs.includes('taqeem-v2.0'), 'sw.js cache upgraded to taqeem-v2.0');
assert(swJs.includes('/vote.html'), 'sw.js pre-caches /vote.html');
assert(swJs.includes('/lib/qrcode.js'), 'sw.js pre-caches /lib/qrcode.js');
assert(swJs.includes('/winners/index.html'), 'sw.js pre-caches /winners/index.html');
assert(swJs.includes('Promise.allSettled'), 'sw.js uses resilient caching strategy');

// 3. Check demo.html
const demoHtml = fs.readFileSync(path.join(root, 'demo.html'), 'utf8');
assert(demoHtml.includes('id="install-pwa-btn"'), 'demo.html contains install-pwa-btn');
assert(demoHtml.includes('id="analytics-modal-btn"'), 'demo.html contains analytics-modal-btn');
assert(demoHtml.includes('id="analytics-modal"'), 'demo.html contains analytics-modal');
assert(demoHtml.includes('id="analytics-total-evals"'), 'demo.html contains analytics-total-evals');
assert(demoHtml.includes('id="analytics-criteria-bars"'), 'demo.html contains analytics-criteria-bars');
assert(demoHtml.includes('id="analytics-judge-tbody"'), 'demo.html contains analytics-judge-tbody');
assert(demoHtml.includes('id="cfg-cert-org"'), 'demo.html contains cfg-cert-org');
assert(demoHtml.includes('id="cfg-cert-sig1"'), 'demo.html contains cfg-cert-sig1');
assert(demoHtml.includes('id="cfg-cert-sig2"'), 'demo.html contains cfg-cert-sig2');
assert(demoHtml.includes('id="save-cert-settings-btn"'), 'demo.html contains save-cert-settings-btn');

// 4. Check vote.html
const voteHtml = fs.readFileSync(path.join(root, 'vote.html'), 'utf8');
assert(voteHtml.includes("navigator.serviceWorker.register('sw.js')"), 'vote.html registers service worker');

// 5. Check app.js
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert(appJs.includes('initPwaInstall'), 'app.js defines initPwaInstall');
assert(appJs.includes('saveCertificateSettings'), 'app.js defines saveCertificateSettings');
assert(appJs.includes('loadCertificateSettings'), 'app.js defines loadCertificateSettings');
assert(appJs.includes('openCompetitionAnalytics'), 'app.js defines openCompetitionAnalytics');
assert(appJs.includes('closeCompetitionAnalytics'), 'app.js defines closeCompetitionAnalytics');
assert(appJs.includes('renderCompetitionAnalytics'), 'app.js defines renderCompetitionAnalytics');
assert(appJs.includes('customCertOrg'), 'app.js supports customCertOrg in certificate header');
assert(appJs.includes('customSig1'), 'app.js supports customSig1 in certificate signatures');
assert(appJs.includes('customSig2'), 'app.js supports customSig2 in certificate signatures');
assert(appJs.includes('title-analytics'), 'app.js contains Phase 4 translations');

console.log(`\nPhase 4 Test Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
