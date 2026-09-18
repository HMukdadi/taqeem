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

// 1. Check lib/qrcode.js
const qrPath = path.join(root, 'lib', 'qrcode.js');
assert(fs.existsSync(qrPath), 'lib/qrcode.js exists');
const qrContent = fs.readFileSync(qrPath, 'utf8');
assert(qrContent.includes('TaqeemQR') && qrContent.includes('renderToCanvas'), 'lib/qrcode.js defines TaqeemQR and renderToCanvas');

// 2. Check demo.html
const demoContent = fs.readFileSync(path.join(root, 'demo.html'), 'utf8');
assert(demoContent.includes('lib/qrcode.js'), 'demo.html loads lib/qrcode.js');
assert(demoContent.includes('rubric-preset-select'), 'demo.html contains rubric-preset-select');
assert(demoContent.includes('apply-rubric-preset-btn'), 'demo.html contains apply-rubric-preset-btn');
assert(demoContent.includes('rubric-weight-total-badge'), 'demo.html contains rubric-weight-total-badge');
assert(demoContent.includes('matrix-export-btn'), 'demo.html contains matrix-export-btn');
assert(demoContent.includes('qr-pass-modal'), 'demo.html contains qr-pass-modal');
assert(demoContent.includes('judge-qr-canvas'), 'demo.html contains judge-qr-canvas');
assert(demoContent.includes('pushAudienceVotingToStage'), 'demo.html has button to display audience voting');
assert(demoContent.includes('revealAudienceFavoriteOnStage'), 'demo.html has button to reveal audience favorite');

// 3. Check vote.html
const votePath = path.join(root, 'vote.html');
assert(fs.existsSync(votePath), 'vote.html exists');
const voteContent = fs.readFileSync(votePath, 'utf8');
assert(voteContent.includes('viewport'), 'vote.html has mobile viewport');
assert(voteContent.includes('audience-vote-cast'), 'vote.html broadcasts audience-vote-cast');
assert(voteContent.includes('taqeem_vote_'), 'vote.html has localStorage fraud prevention');

// 4. Check winners/index.html & winners/app.js
const winnersHtml = fs.readFileSync(path.join(root, 'winners', 'index.html'), 'utf8');
assert(winnersHtml.includes('audience-vote-screen'), 'winners/index.html contains audience-vote-screen');
assert(winnersHtml.includes('stage-audience-qr'), 'winners/index.html contains stage-audience-qr');
assert(winnersHtml.includes('lib/qrcode.js'), 'winners/index.html loads lib/qrcode.js');

const winnersJs = fs.readFileSync(path.join(root, 'winners', 'app.js'), 'utf8');
assert(winnersJs.includes('show-audience-voting'), 'winners/app.js listens to show-audience-voting');
assert(winnersJs.includes('audience-vote-cast'), 'winners/app.js listens to audience-vote-cast');
assert(winnersJs.includes('reveal-audience-favorite'), 'winners/app.js listens to reveal-audience-favorite');

// 5. Check app.js
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert(appJs.includes('RUBRIC_PRESETS'), 'app.js defines RUBRIC_PRESETS');
assert(appJs.includes('applyRubricPreset'), 'app.js defines applyRubricPreset');
assert(appJs.includes('calculateWeightedTotal'), 'app.js defines calculateWeightedTotal');
assert(appJs.includes('openJudgeQrPass'), 'app.js defines openJudgeQrPass');
assert(appJs.includes('exportDetailedMatrixCSV'), 'app.js defines exportDetailedMatrixCSV');
assert(appJs.includes('pushAudienceVotingToStage'), 'app.js defines pushAudienceVotingToStage');
assert(!appJs.includes('tedtalk_students_template.csv'), 'app.js cleaned up tedtalk_students_template.csv');
assert(!appJs.includes('tedtalk-results-'), 'app.js cleaned up tedtalk-results-');

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
