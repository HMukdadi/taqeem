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

// 1. Check demo.html
const demoHtml = fs.readFileSync(path.join(root, 'demo.html'), 'utf8');
assert(demoHtml.includes('id="batch-reports-btn"'), 'demo.html contains batch-reports-btn');
assert(demoHtml.includes('id="report-card-modal"'), 'demo.html contains report-card-modal');
assert(demoHtml.includes('id="report-card-canvas"'), 'demo.html contains report-card-canvas');
assert(demoHtml.includes('id="cfg-blind-judging"'), 'demo.html contains cfg-blind-judging');
assert(demoHtml.includes('id="cfg-score-locking"'), 'demo.html contains cfg-score-locking');
assert(demoHtml.includes('id="save-fairness-settings-btn"'), 'demo.html contains save-fairness-settings-btn');

// 2. Check styles.css
const stylesCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert(stylesCss.includes('.report-btn-table'), 'styles.css contains .report-btn-table');
assert(stylesCss.includes('.blind-mode-badge'), 'styles.css contains .blind-mode-badge');
assert(stylesCss.includes('.score-locked-badge'), 'styles.css contains .score-locked-badge');
assert(stylesCss.includes('@media print'), 'styles.css contains @media print rules');

// 3. Check app.js
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert(appJs.includes('title-report-preview'), 'app.js has Phase 5 EN translation');
assert(appJs.includes('بطاقة التقرير التقييمي للطالب'), 'app.js has Phase 5 AR translation');
assert(appJs.includes('report-btn-table'), 'app.js renders report button in results table');
assert(appJs.includes('saveFairnessSettings'), 'app.js defines saveFairnessSettings');
assert(appJs.includes('loadFairnessSettings'), 'app.js defines loadFairnessSettings');
assert(appJs.includes('renderReportCardOnCanvas'), 'app.js defines renderReportCardOnCanvas');
assert(appJs.includes('openStudentReportCard'), 'app.js defines openStudentReportCard');
assert(appJs.includes('closeReportCardModal'), 'app.js defines closeReportCardModal');
assert(appJs.includes('downloadReportCardPNG'), 'app.js defines downloadReportCardPNG');
assert(appJs.includes('printReportCard'), 'app.js defines printReportCard');
assert(appJs.includes('generateBatchReportCards'), 'app.js defines generateBatchReportCards');
assert(appJs.includes('taqeem_blind_judging'), 'app.js supports blind judging mode');
assert(appJs.includes('taqeem_score_locking'), 'app.js supports score locking');

console.log(`\nPhase 5 Test Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
