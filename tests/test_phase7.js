const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== RUNNING PHASE 7 VERIFICATION TEST SUITE ===');

const rootDir = path.join(__dirname, '..');
const demoHtml = fs.readFileSync(path.join(rootDir, 'demo.html'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');

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

// 1. demo.html tests
test('demo.html has advance-qualifiers-btn and btn-open-archive in toolbar', () => {
  assert(demoHtml.includes('id="advance-qualifiers-btn"'));
  assert(demoHtml.includes('id="btn-open-archive"'));
  assert(demoHtml.includes('data-i18n="btn-advance-qualifiers"'));
  assert(demoHtml.includes('data-i18n="btn-open-archive"'));
});

test('demo.html has qualifiers-modal with pill counts and preview list', () => {
  assert(demoHtml.includes('id="qualifiers-modal"'));
  assert(demoHtml.includes('id="target-finals-name"'));
  assert(demoHtml.includes('id="qualifiers-preview-list"'));
  assert(demoHtml.includes('id="confirm-advance-btn"'));
  assert(demoHtml.includes('onclick="advanceStudentsToFinals()"'));
  assert(demoHtml.includes('setQualifierCount(3)'));
  assert(demoHtml.includes('setQualifierCount(5)'));
});

test('demo.html has archive-modal with student search and timeline', () => {
  assert(demoHtml.includes('id="archive-modal"'));
  assert(demoHtml.includes('id="student-history-search"'));
  assert(demoHtml.includes('id="student-growth-results"'));
  assert(demoHtml.includes('id="competitions-archive-timeline"'));
  assert(demoHtml.includes('searchStudentHistoricalProgress(this.value)'));
});

// 2. styles.css tests
test('styles.css has Phase 7 styling classes', () => {
  assert(stylesCss.includes('.qualifier-pill'));
  assert(stylesCss.includes('.qualifier-pill.active'));
  assert(stylesCss.includes('.qualifier-row'));
  assert(stylesCss.includes('.archive-timeline-card'));
  assert(stylesCss.includes('.growth-badge'));
});

// 3. app.js tests
test('app.js has English translations for Phase 7', () => {
  assert(appJs.includes("'btn-advance-qualifiers': '🏆 Advance Qualifiers'"));
  assert(appJs.includes("'title-advance-qualifiers': '🏆 Advance Qualifiers to Finals'"));
  assert(appJs.includes("'btn-open-archive': '📜 School Archive'"));
  assert(appJs.includes("'title-archive': '📜 School Historical Archive & Student Portfolio'"));
  assert(appJs.includes("'qualifiers-advanced-toast'"));
});

test('app.js has Arabic translations for Phase 7', () => {
  assert(appJs.includes("'btn-advance-qualifiers': '🏆 تأهيل للمرحلة النهائية'"));
  assert(appJs.includes("'title-advance-qualifiers': '🏆 تأهيل الأوائل للنهائيات'"));
  assert(appJs.includes("'btn-open-archive': '📜 أرشيف المدرسة'"));
  assert(appJs.includes("'title-archive': '📜 الأرشيف التاريخي وسجل أداء الطلاب'"));
});

test('app.js implements qualifiers modal and selection functions', () => {
  assert(appJs.includes('function openQualifiersModal()'));
  assert(appJs.includes('function closeQualifiersModal()'));
  assert(appJs.includes('function setQualifierCount(count)'));
  assert(appJs.includes('function getAdvancingStudents()'));
  assert(appJs.includes('function renderQualifiersPreview()'));
  assert(appJs.includes('function advanceStudentsToFinals()'));
});

test('app.js implements historical archive and student growth tracking', () => {
  assert(appJs.includes('function openArchiveModal()'));
  assert(appJs.includes('function closeArchiveModal()'));
  assert(appJs.includes('function renderHistoricalArchive()'));
  assert(appJs.includes('function searchStudentHistoricalProgress(query)'));
});

test('app.js exports Phase 7 functions to window', () => {
  assert(appJs.includes('window.openQualifiersModal = openQualifiersModal;'));
  assert(appJs.includes('window.closeQualifiersModal = closeQualifiersModal;'));
  assert(appJs.includes('window.setQualifierCount = setQualifierCount;'));
  assert(appJs.includes('window.advanceStudentsToFinals = advanceStudentsToFinals;'));
  assert(appJs.includes('window.openArchiveModal = openArchiveModal;'));
  assert(appJs.includes('window.closeArchiveModal = closeArchiveModal;'));
  assert(appJs.includes('window.searchStudentHistoricalProgress = searchStudentHistoricalProgress;'));
  assert(appJs.includes('window.renderHistoricalArchive = renderHistoricalArchive;'));
});

console.log(`\n🎉 ALL ${passCount}/${passCount} PHASE 7 INTEGRITY TESTS PASSED!`);
