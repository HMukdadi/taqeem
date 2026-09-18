const fs = require('fs');
const path = require('path');

const root = 'd:/Projects/taqeem';
const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const demoHtml = fs.readFileSync(path.join(root, 'demo.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const winnersHtml = fs.readFileSync(path.join(root, 'winners/index.html'), 'utf8');
const winnersCss = fs.readFileSync(path.join(root, 'winners/style.css'), 'utf8');
const winnersJs = fs.readFileSync(path.join(root, 'winners/app.js'), 'utf8');

const tests = [
  { name: 'demo.html has #voice-dictate-btn', pass: demoHtml.includes('id="voice-dictate-btn"') },
  { name: 'demo.html has #batch-cert-btn', pass: demoHtml.includes('id="batch-cert-btn"') },
  { name: 'demo.html has #push-podium-btn', pass: demoHtml.includes('id="push-podium-btn"') },
  { name: 'demo.html has #certificate-modal', pass: demoHtml.includes('id="certificate-modal"') },
  { name: 'demo.html has #certificate-canvas', pass: demoHtml.includes('id="certificate-canvas"') },
  { name: 'styles.css has .voice-btn', pass: stylesCss.includes('.voice-btn') },
  { name: 'styles.css has .cert-btn-table', pass: stylesCss.includes('.cert-btn-table') },
  { name: 'winners/index.html has #live-speaker-screen', pass: winnersHtml.includes('id="live-speaker-screen"') },
  { name: 'winners/index.html has #podium-screen', pass: winnersHtml.includes('id="podium-screen"') },
  { name: 'winners/index.html has #stage-timer-clock', pass: winnersHtml.includes('id="stage-timer-clock"') },
  { name: 'winners/style.css has #live-speaker-screen styles', pass: winnersCss.includes('#live-speaker-screen') },
  { name: 'winners/style.css has #podium-screen styles', pass: winnersCss.includes('#podium-screen') },
  { name: 'winners/app.js listens to stage-timer-sync', pass: winnersJs.includes("'stage-timer-sync'") },
  { name: 'winners/app.js listens to podium-reveal', pass: winnersJs.includes("'podium-reveal'") },
  { name: 'winners/app.js defines handleStageTimerSync', pass: winnersJs.includes('function handleStageTimerSync') },
  { name: 'winners/app.js defines revealPodium', pass: winnersJs.includes('function revealPodium') },
  { name: 'app.js defines initVoiceDictation', pass: appJs.includes('function initVoiceDictation()') },
  { name: 'app.js defines pushTop3Podium', pass: appJs.includes('async function pushTop3Podium()') },
  { name: 'app.js defines renderCertificateOnCanvas', pass: appJs.includes('function renderCertificateOnCanvas(') },
  { name: 'app.js defines openStudentCertificate', pass: appJs.includes('function openStudentCertificate(') },
  { name: 'app.js defines downloadCertificatePNG', pass: appJs.includes('function downloadCertificatePNG(') },
  { name: 'app.js defines printCertificate', pass: appJs.includes('function printCertificate(') },
  { name: 'app.js defines generateBatchCertificates', pass: appJs.includes('async function generateBatchCertificates(') },
  { name: 'app.js broadcasts stage-timer-sync', pass: appJs.includes("event: 'stage-timer-sync'") },
  { name: 'app.js renders Cert button in table', pass: appJs.includes('cert-btn-table') && appJs.includes('openStudentCertificate') }
];

let failed = 0;
tests.forEach(t => {
  if (t.pass) {
    console.log('✅ ' + t.name);
  } else {
    console.error('❌ ' + t.name);
    failed++;
  }
});

if (failed === 0) {
  console.log('\n🌟 ALL ' + tests.length + ' INTEGRITY CHECKS PASSED!');
} else {
  console.error('\n⚠️ ' + failed + ' checks failed.');
  process.exit(1);
}
