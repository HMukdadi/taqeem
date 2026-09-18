const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING PHASE 6 VERIFICATION TEST SUITE ===');

const rootDir = path.join(__dirname, '..');
const demoHtml = fs.readFileSync(path.join(rootDir, 'demo.html'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const winnersHtml = fs.readFileSync(path.join(rootDir, 'winners', 'index.html'), 'utf8');
const winnersCss = fs.readFileSync(path.join(rootDir, 'winners', 'style.css'), 'utf8');
const winnersJs = fs.readFileSync(path.join(rootDir, 'winners', 'app.js'), 'utf8');

let passCount = 0;
function test(desc, fn) {
  try {
    fn();
    console.log(`  ✓ ${desc}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. winners/index.html tests
test('winners/index.html has stage audio toggle button', () => {
  assert(winnersHtml.includes('id="stage-audio-toggle"'));
  assert(winnersHtml.includes('id="stage-audio-icon"'));
  assert(winnersHtml.includes('onclick="toggleStageAudio()"'));
});

// 2. winners/style.css tests
test('winners/style.css has styling for stage-audio-toggle and muted state', () => {
  assert(winnersCss.includes('.stage-audio-toggle'));
  assert(winnersCss.includes('.stage-audio-toggle.muted'));
});

// 3. winners/app.js tests
test('winners/app.js implements Web Audio Context and Chimes', () => {
  assert(winnersJs.includes('function getWebAudioContext()'));
  assert(winnersJs.includes('function playWebAudioChime(type)'));
  assert(winnersJs.includes('type === \'warning-30s\''));
  assert(winnersJs.includes('880'));
  assert(winnersJs.includes('1174.66'));
  assert(winnersJs.includes('type === \'overtime\''));
  assert(winnersJs.includes('523.25'));
  assert(winnersJs.includes('659.25'));
  assert(winnersJs.includes('783.99'));
});

test('winners/app.js implements stage audio toggle', () => {
  assert(winnersJs.includes('function toggleStageAudio()'));
  assert(winnersJs.includes('stageAudioMuted = !stageAudioMuted'));
  assert(winnersJs.includes("btn.classList.add('muted')"));
});

test('winners/app.js triggers 30s and overtime chimes in handleStageTimerSync', () => {
  assert(winnersJs.includes("playWebAudioChime('warning-30s')"));
  assert(winnersJs.includes("playWebAudioChime('overtime')"));
  assert(winnersJs.includes("payload.chimesEnabled !== false"));
});

test('winners/app.js supports custom school anthem in playCelebration', () => {
  assert(winnersJs.includes("localStorage.getItem('taqeem_custom_anthem')"));
});

test('winners/app.js exports audio functions to window', () => {
  assert(winnersJs.includes('window.playWebAudioChime = playWebAudioChime;'));
  assert(winnersJs.includes('window.toggleStageAudio = toggleStageAudio;'));
});

// 4. demo.html tests
test('demo.html has stage timer chimes and judge device chimes switches', () => {
  assert(demoHtml.includes('id="cfg-timer-chimes"'));
  assert(demoHtml.includes('id="cfg-judge-timer-chimes"'));
  assert(demoHtml.includes('data-i18n="label-timer-chimes"'));
  assert(demoHtml.includes('data-i18n="label-judge-chimes"'));
});

test('demo.html has custom anthem upload and preview card', () => {
  assert(demoHtml.includes('data-i18n="title-audio-settings"'));
  assert(demoHtml.includes('id="cfg-anthem-upload"'));
  assert(demoHtml.includes('id="btn-preview-anthem"'));
  assert(demoHtml.includes('id="btn-reset-anthem"'));
  assert(demoHtml.includes('id="cfg-anthem-status"'));
});

// 5. app.js tests
test('app.js has English translations for Phase 6 audio settings', () => {
  assert(appJs.includes("'label-timer-chimes': '🔔 Stage Warning Bells"));
  assert(appJs.includes("'label-judge-chimes': '🔊 Also Play Chimes"));
  assert(appJs.includes("'title-audio-settings': '🎵 Stage Music & Celebration Audio'"));
  assert(appJs.includes("'anthem-saved'"));
});

test('app.js has Arabic translations for Phase 6 audio settings', () => {
  assert(appJs.includes("'label-timer-chimes': '🔔 جرس التنبيه للمسرح"));
  assert(appJs.includes("'label-judge-chimes': '🔊 تشغيل التنبيه الصوتي"));
  assert(appJs.includes("'title-audio-settings': '🎵 موسيقى المسرح ونشيد التتويج'"));
});

test('app.js initializes audio settings on init()', () => {
  assert(appJs.includes('loadAudioSettings();'));
});

test('app.js loads and saves timer chime checkboxes in loadSettings and saveSettings', () => {
  assert(appJs.includes('cfg-timer-chimes'));
  assert(appJs.includes('cfg-judge-timer-chimes'));
  assert(appJs.includes('settings.timerChimes'));
  assert(appJs.includes('settings.judgeTimerChimes'));
});

test('app.js broadcasts chimesEnabled in broadcastStageTimer', () => {
  assert(appJs.includes('chimesEnabled: chimesEnabled'));
});

test('app.js plays judge warning and overtime chimes in startTimer()', () => {
  assert(appJs.includes("playWebAudioChime('warning-30s')"));
  assert(appJs.includes("playWebAudioChime('overtime')"));
});

test('app.js implements Web Audio synthesizer, anthem upload, preview, and reset', () => {
  assert(appJs.includes('function getAppWebAudioContext()'));
  assert(appJs.includes('function playWebAudioChime(type)'));
  assert(appJs.includes('function handleAnthemUpload(event)'));
  assert(appJs.includes('function playAnthemPreview()'));
  assert(appJs.includes('function resetAnthemDefault()'));
  assert(appJs.includes('function updateAnthemStatusUI()'));
  assert(appJs.includes('function loadAudioSettings()'));
});

test('app.js exports Phase 6 functions to window', () => {
  assert(appJs.includes('window.playWebAudioChime = playWebAudioChime;'));
  assert(appJs.includes('window.handleAnthemUpload = handleAnthemUpload;'));
  assert(appJs.includes('window.playAnthemPreview = playAnthemPreview;'));
  assert(appJs.includes('window.resetAnthemDefault = resetAnthemDefault;'));
  assert(appJs.includes('window.loadAudioSettings = loadAudioSettings;'));
  assert(appJs.includes('window.updateAnthemStatusUI = updateAnthemStatusUI;'));
});

console.log(`\n🎉 ALL ${passCount}/${passCount} PHASE 6 TESTS PASSED SUCCESSFULLY!`);
