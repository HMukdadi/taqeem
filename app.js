const STORAGE_KEY = 'studentRoster';
const EVALUATIONS_KEY = 'evaluations';
const SETTINGS_KEY = 'taqeem_settings';

let roster = [];
let evaluations = [];
let allCustomUsers = [];
let competitions = [];
let currentChannel = null;
let currentTab = localStorage.getItem('taqeem_currentTab') || 'judging';
let currentSubTab = localStorage.getItem('taqeem_currentSubTab') || 'students';
let isAuthenticated = false;
let userRole = 'judge';
let currentUserId = null;
let resultsViewMode = 'highest';
let resultsGradeFilter = '';
let resultsSectionFilter = '';
let editingStudentId = null;
let editingUserId = null;
let selectedStudents = new Set();
let newStudentPhotoFile = null;
let newBulkStudentPhotoFile = null;

// Timer State
let timerInterval = null;
let timerRemaining = 180;
let timerIsRunning = false;
let defaultTimerDuration = 180;

let CRITERIA_KEYS = ['language', 'content', 'body', 'pronunciation', 'time', 'delivery'];
let criteriaLabels = {
    'language': 'Language accuracy',
    'content': 'Content & Idea',
    'body': 'Confidence & Body Language',
    'pronunciation': 'Pronunciation',
    'time': 'Time Management',
    'delivery': 'Delivery & Fluency'
};
let criteriaWeights = {
    'language': 15,
    'content': 25,
    'body': 20,
    'pronunciation': 15,
    'time': 10,
    'delivery': 15
};

const RUBRIC_PRESETS = {
  public_speaking: {
    name: 'Public Speaking & Oratory (خطابة وإلقاء)',
    criteria: [
      { id: 'content', label: 'Content & Core Message', weight: 30 },
      { id: 'delivery', label: 'Delivery & Fluency', weight: 25 },
      { id: 'body', label: 'Body Language & Confidence', weight: 20 },
      { id: 'language', label: 'Language & Grammar Accuracy', weight: 15 },
      { id: 'time', label: 'Time Management & Pace', weight: 10 }
    ]
  },
  debate: {
    name: 'Debate & Argumentation (مناظرات وحوار)',
    criteria: [
      { id: 'arguments', label: 'Strength of Arguments & Evidence', weight: 35 },
      { id: 'rebuttal', label: 'Cross-Examination & Rebuttal', weight: 25 },
      { id: 'delivery', label: 'Persuasiveness & Tone', weight: 20 },
      { id: 'structure', label: 'Structure & Time Discipline', weight: 20 }
    ]
  },
  science_fair: {
    name: 'Science Fair & STEM (معرض العلوم والابتكار)',
    criteria: [
      { id: 'method', label: 'Scientific Method & Hypothesis', weight: 30 },
      { id: 'innovation', label: 'Originality & Innovation', weight: 25 },
      { id: 'display', label: 'Clarity of Visual Display', weight: 25 },
      { id: 'defense', label: 'Oral Defense & Q&A Response', weight: 20 }
    ]
  },
  quran: {
    name: 'Quran Recitation & Tajweed (تلاوة وتجويد)',
    criteria: [
      { id: 'tajweed', label: 'Tajweed Rules & Articulation', weight: 40 },
      { id: 'memorization', label: 'Memorization & Accuracy', weight: 30 },
      { id: 'voice', label: 'Voice Modulation & Melody', weight: 20 },
      { id: 'stops', label: 'Proper Stops & Starts (Waqf)', weight: 10 }
    ]
  },
  storytelling: {
    name: 'Storytelling & Drama (قصة وإلقاء)',
    criteria: [
      { id: 'expression', label: 'Vocal Variety & Characterization', weight: 30 },
      { id: 'flow', label: 'Narrative Arc & Pacing', weight: 25 },
      { id: 'engagement', label: 'Audience Engagement', weight: 25 },
      { id: 'movement', label: 'Stage Movement & Expressions', weight: 20 }
    ]
  }
};

const translations = {
    en: {
        'login-title': 'Taqeem',
        'login-subtitle': 'Sign in to manage student evaluations',
        'label-username': 'Username',
        'label-password': 'Password',
        'ph-username': 'Enter your username',
        'ph-password': 'Enter your password',
        'btn-signin': 'Sign In',
        'demo-roles-title': '⚡ Instant Demo Roles',
        'demo-roles-badge': '1-Click Fill',
        'role-admin-title': 'Admin / Head',
        'role-judge-title': 'Panel Judge',
        'btn-logout': 'Logout',
        'btn-switch-comp': 'Switch Competition',
        'tab-admin': 'Admin',
        'tab-judging': 'Judging',
        'tab-results': 'Results',
        'subtab-students': 'Students',
        'subtab-users': 'Users',
        'subtab-config': 'Configuration',
        'form-add-student': 'Add Student',
        'form-edit-student': 'Edit Student',
        'ph-number': 'Number *',
        'ph-name': 'Name *',
        'ph-class': 'Class *',
        'ph-section': 'Section',
        'label-photo': 'Student Photo (optional)',
        'btn-choose-photo': '📷 Choose Photo',
        'btn-add-student': 'Add Student',
        'btn-update-student': 'Update Student',
        'btn-cancel': 'Cancel',
        'title-bulk': 'Bulk Import',
        'bulk-p1': 'Fill this',
        'bulk-link': 'CSV template',
        'bulk-p2': 'and upload it below.',
        'btn-choose-csv': 'Choose CSV File',
        'bulk-drop': 'or drag and drop here',
        'btn-import': 'Import Students',
        'title-roster': 'Student Roster',
        'label-filter-class': 'Filter Class',
        'label-filter-section': 'Filter Section',
        'opt-all-classes': 'All Classes',
        'opt-all-sections': 'All Sections',
        'label-search': 'Search',
        'ph-search-roster': 'Name or number...',
        'btn-bulk-edit': 'Bulk Edit',
        'btn-bulk-delete': 'Bulk Delete',
        'title-users': 'User Management',
        'form-create-user': 'Create New User',
        'form-edit-user': 'Edit User',
        'role-judge': 'Judge',
        'role-admin': 'Admin',
        'btn-create-user': 'Create User',
        'btn-update-user': 'Update User',
        'title-branding': '🎨 Branding',
        'label-app-name': 'App Name',
        'hint-app-name': 'Updates the header title, browser tab, login screen, and PWA name.',
        'label-login-subtitle': 'Login Subtitle',
        'hint-login-subtitle': 'The tagline shown below the title on the login screen.',
        'label-app-logo': 'App Logo',
        'btn-choose-img': '📂 Choose Image',
        'btn-reset-default': 'Reset to Default',
        'hint-app-logo': 'Applies to login screen, header, and PWA icon.',
        'label-primary-color': 'Primary Color',
        'hint-primary-color': 'Accent color for buttons, active states, and highlights.',
        'btn-reset': 'Reset',
        'btn-save-branding': '💾 Save Branding',
        'title-timer': '⏱️ Timer Settings',
        'label-duration': 'Default Speech Duration',
        'unit-seconds': 'Seconds',
        'hint-timer': 'Adjust the primary timer length (e.g., 180 for 3 minutes).',
        'btn-apply': 'Apply Changes',
        'title-criteria': '📊 Evaluation Criteria',
        'btn-add-criterion': '➕ Add Criterion',
        'ph-new-criterion': 'e.g. Stage Presence',
        'hint-criteria': 'Each criterion is scored from 1 to 10.',
        'title-danger': 'Dangerous Zone',
        'danger-p': 'Permanently wipe evaluations.',
        'btn-clear-data': 'Clear Data',
        'loading-roster': 'Loading roster...',
        'btn-timer-start': 'Start',
        'btn-timer-pause': 'Pause',
        'btn-timer-resume': 'Resume',
        'btn-timer-reset': 'Reset',
        'btn-timer-up': 'Time Up',
        'label-speaker-mgmt': 'Speaker Management',
        'opt-change-speaker': '-- Change Speaker --',
        'title-matrix': 'Evaluation Matrix',
        'label-comments': 'Judge Comments',
        'ph-comments': 'Enter feedback for the student...',
        'label-final-score': 'Final Score',
        'btn-save-eval': 'Save Evaluation',
        'btn-update-eval': 'Update Evaluation',
        'title-results-actions': 'Actions & Filters',
        'ph-search-results': 'Search by name...',
        'opt-all-grades': 'All Grades',
        'opt-best': 'Best Performances',
        'opt-raw': 'All Raw Scores',
        'btn-reset-filters': '↺ Reset',
        'btn-export': 'Export CSV',
        'th-rank': 'Rank',
        'th-num': 'Num',
        'th-name': 'Student Name',
        'th-class': 'Class',
        'th-section': 'Section',
        'th-highest': 'Highest',
        'th-avg': 'Average',
        'th-details': 'Details',
        'th-time': 'Time',
        'th-judge': 'Judge',
        'th-score': 'Score',
        'th-feedback': 'Feedback',
        'results-empty': 'No evaluations collected yet.',
        'comp-title': 'Select Competition',
        'comp-subtitle': 'Choose an active competition or create a new one.',
        'loading-comps': 'Loading competitions...',
        'comp-create-title': 'Create New Competition',
        'ph-comp-name': 'Competition Name',
        'btn-create-comp': 'Create Competition',
        'subtab-competitions': 'Competitions',
        'title-competitions': 'Competition Management',
        'form-create-competition': 'Create New Competition',
        'opt-no-comp': '-- Select Competition --',
        'btn-delete': 'Delete',
        'msg-delete-comp-confirm': 'Are you sure you want to delete this competition? All related students and evaluations will be permanently lost.',
        'msg-comp-deleted': 'Competition deleted successfully.',
        'title-winner': '🏆 Winner Announcement',
        'winner-p1': 'Push a winner to the',
        'winner-link': 'display screen',
        'winner-p2': 'Open the display screen on a projector, then control it here.',
        'label-select-winner': 'Select Winner',
        'opt-choose-student': '-- Choose a student --',
        'label-winner-photo': 'Winner Photo (optional)',
        'hint-winner-photo': 'If no photo is provided, a microphone icon will be shown.',
        'btn-push-winner': '🏅 Push to Winner Screen',
        'btn-clear-screen': 'Clear Screen',
        'title-bulk-edit': 'Bulk Edit Students',
        'bulk-edit-p': 'Leave a field blank to keep original values.',
        'label-bulk-class': 'Update Class/Grade',
        'label-bulk-section': 'Update Section',
        'label-bulk-photo': 'Bulk Student Photo (optional)',
        'btn-choose-bulk-photo': '📷 Choose Bulk Photo',
        'btn-update-selected': 'Update Selected',
        'msg-eval-exists': 'You have already evaluated this student. Update?',
        'msg-complete-criteria': 'Please complete all evaluation criteria.',
        'msg-eval-saved': 'Evaluation saved!',
        'msg-eval-updated': 'Evaluation updated!',
        'msg-all-done': 'All students have been evaluated!',
        'msg-delete-student': 'Are you sure you want to delete this student?',
        'msg-delete-user': 'Delete user?',
        'msg-clear-confirm': 'Type DELETE to confirm:',
        'msg-pushing': '⏳ Pushing...',
        'msg-pushed': '🏆 Winner pushed to display screen!',
        'msg-clear-display': 'Winner display cleared.',
        'msg-no-results': 'No results to export',
        'msg-duplicates-skipped': 'Duplicate student numbers were skipped.',
        'label-criterion': 'Criterion',
        'label-score': 'Score',
        'label-feedback': 'Feedback',
        'title-detailed-scores': 'Detailed Scores',
        'lang-btn': 'عربي',
        'judging-active': 'Judging:',
        'already-evaluated': '(Already Evaluated)',
        'empty-no-students': 'No students in roster.',
        'empty-go-setup': 'Go to "Setup" to add students.',
        'footer-p': 'Built for schools, by the community.',
        'waiting': 'Waiting for announcement...',
        'unlock-audio': 'Enable Sound for Reveal',
        'congrats': 'CONGRATULATIONS',
        'dyn_str_0': 'Please select a student first.',
        'dyn_str_1': 'Please complete all evaluation criteria.',
        'dyn_str_2': 'Evaluation updated!',
        'dyn_str_3': 'Evaluation saved!',
        'dyn_str_4': 'Evaluation updated (Offline).',
        'dyn_str_5': 'Evaluation saved (Offline).',
        'dyn_str_6': 'Username is required',
        'dyn_str_7': 'Password is required for new users',
        'dyn_str_8': 'User updated successfully',
        'dyn_str_9': 'User created successfully',
        'dyn_str_10': 'Number and Name are required',
        'dyn_str_11': 'Student updated successfully',
        'dyn_str_12': 'Student added successfully',
        'dyn_str_13': 'Please select a CSV file first',
        'dyn_str_14': 'No valid student data found in CSV',
        'dyn_str_15': 'Error importing students: ',
        'dyn_str_16': 'Reordered students...',
        'dyn_str_17': 'Error saving order to server',
        'dyn_str_18': 'Order saved successfully!',
        'dyn_str_19': 'Order saved locally.',
        'dyn_str_20': 'Criteria updated successfully! ✨',
        'dyn_str_21': 'Please enter a criterion name.',
        'dyn_str_22': 'Criterion added!',
        'dyn_str_23': 'Criterion removed.',
        'dyn_str_24': 'No results to export',
        'dyn_str_25': 'Timer settings saved!',
        'dyn_str_26': 'Branding saved! ✨',
        'dyn_str_27': 'Filters reset',
        'dyn_str_28': 'Data cleared',
        'dyn_str_29': 'Students deleted successfully',
        'dyn_str_30': 'No students selected',
        'dyn_str_31': 'Please drop a valid CSV file.',
        'dyn_str_32': 'All students in roster have been evaluated!',
        'dyn_str_33': 'Photo upload failed, pushing without photo.',
        'dyn_str_34': '🏆 Winner pushed to display screen!',
        'dyn_str_35': 'Winner display cleared.',
        'dyn_str_36': 'All Classes',
        'dyn_str_37': 'All Sections',
        'dyn_str_38': 'No results found',
        'dyn_str_39': 'No raw evaluations found',
        'dyn_str_40': 'All Grades',
        'dyn_str_41': '-- Select a student --',
        'dyn_str_42': 'No criteria defined.',
        'dyn_str_43': '-- Choose a student --',
        'dyn_str_44': '-- No students available --',
        'loading-init': 'Initializing System...',
        'sync-online': 'Online',
        'sync-offline': 'Offline',
        'sync-pending': 'pending sync',
        'sync-syncing': 'Syncing...',
        'sync-success': 'All offline scores synced to cloud!',
        'sync-offline-saved': 'Saved locally (Offline). Will auto-sync when online.',
        'btn-voice-dictate': 'Voice Dictation',
        'voice-listening': 'Listening... Speak now',
        'voice-stopped': 'Dictation stopped',
        'voice-unsupported': 'Voice recognition not supported in this browser.',
        'btn-batch-certs': '🎓 Batch Certificates',
        'btn-push-podium': '🏆 Reveal Top 3 Podium',
        'title-cert-preview': 'Award Certificate Preview',
        'cert-award-title': 'Certificate of Excellence',
        'cert-rank-1': '1st Place Winner',
        'cert-rank-2': '2nd Place Winner',
        'cert-rank-3': '3rd Place Winner',
        'cert-presented-to': 'This certificate is proudly awarded to',
        'cert-for-achievement': 'In recognition of outstanding performance and dedication in',
        'cert-judge-signature': 'Judging Panel Chair',
        'cert-director-signature': 'School Leadership',
        'cert-downloaded': 'Certificate downloaded!',
        'title-qr-pass': 'Judge Quick Access Pass',
        'btn-print-pass': 'Print Badge',
        'btn-copy-link': 'Copy Link',
        'hint-scan-pass': 'Scan with phone camera to log in and judge instantly.',
        'label-rubric-preset': 'Rubric Presets (1-Click Templates)',
        'btn-apply-preset': 'Apply Preset',
        'opt-preset-custom': 'Custom Criteria',
        'btn-matrix-export': 'Detailed Matrix',
        'btn-push-audience-vote': 'Display Audience Voting',
        'btn-reveal-audience-fav': 'Reveal Fan Favorite',
        'pass-copied': 'Judge login link copied to clipboard!',
        'vote-stage-pushed': 'Audience voting QR displayed on stage screen!',
        'vote-fav-pushed': 'Audience favorite announced on stage!',
        'btn-install-app': 'Install App',
        'title-cert-settings': '🎓 Certificate & Diploma Customization',
        'label-cert-org': 'School / Institution Name',
        'ph-cert-org': 'e.g. Al-Rowad International Academy',
        'hint-cert-org': 'Proudly printed at the top header of all certificates.',
        'label-cert-sig1': 'Left Signatory Title',
        'ph-cert-sig1': 'e.g. Head of Judging Panel',
        'label-cert-sig2': 'Right Signatory Title',
        'ph-cert-sig2': 'e.g. School Principal',
        'btn-save-cert-settings': '💾 Save Certificate Settings',
        'btn-analytics': '📈 Analytics',
        'title-analytics': '📊 Competition Insights & Judge Analytics',
        'sub-analytics': 'Overview of scoring consistency and student performance breakdown.',
        'lbl-total-evals': 'Evaluations',
        'lbl-comp-avg': 'Competition Avg',
        'lbl-highest-score': 'Top Score',
        'lbl-active-judges': 'Judges',
        'title-criterion-breakdown': '🎯 Criterion Performance Breakdown',
        'desc-criterion-breakdown': 'School-wide average achievement percentage per rubric criterion.',
        'title-judge-variance': '⚖️ Judge Scoring Consistency & Variance',
        'desc-judge-variance': 'Compares each judge\'s average against the panel median to spot strict or lenient outliers.',
        'th-judge': 'Judge',
        'th-eval-count': 'Evaluations',
        'th-judge-avg': 'Average Score',
        'th-variance': 'Variance',
        'th-consistency': 'Rating',
        'cert-settings-saved': 'Certificate settings saved successfully! ✨',
        'btn-batch-reports': '📄 Batch Reports',
        'title-report-preview': 'Student Evaluation Report Card',
        'btn-download-report': 'Download Report Card',
        'btn-print-report': 'Print Report Card',
        'title-fairness-settings': '⚖️ Fair Judging & Privacy Controls',
        'label-blind-judging': 'Blind Judging Mode (Zero Bias)',
        'hint-blind-judging': 'Hides student names and photos on judge scorecards to ensure impartial scoring.',
        'label-score-locking': 'Score Lock & Peer Privacy',
        'hint-score-locking': 'Locks scorecards once submitted to prevent tampering and shields peer judge marks.',
        'btn-save-fairness': 'Save Fairness Settings',
        'fairness-saved': 'Fair judging and privacy settings saved! ✨',
        'report-downloaded': 'Report card downloaded!',
        'btn-view-report': 'Report',
        'contestant-label': 'Contestant',
        'judging-label': 'Judging',
        'score-locked': 'Scorecard Locked',
        'top-strength': 'Top Strength',
        'focus-area': 'Area for Growth',
        'judge-feedback': 'Judges Feedback & Recommendations',
        'label-timer-chimes': '🔔 Stage Warning Bells (30s Warning & Time\'s Up Bell)',
        'label-judge-chimes': '🔊 Also Play Chimes on Judge Device',
        'title-audio-settings': '🎵 Stage Music & Celebration Audio',
        'label-anthem-upload': 'School Anthem / Custom Winner Celebration Audio (MP3)',
        'btn-choose-audio': '📂 Choose Audio File',
        'btn-preview-audio': '▶ Play Preview',
        'btn-reset-audio': 'Reset Default Cheer',
        'hint-anthem-status': 'Default celebration sound is currently active.',
        'anthem-saved': 'Custom celebration audio saved successfully! 🎵',
        'anthem-reset': 'Celebration sound reset to default cheer.',
        'anthem-playing': 'Playing audio preview...',
        'anthem-stopped': 'Audio preview stopped.',
        'btn-advance-qualifiers': '🏆 Advance Qualifiers',
        'title-advance-qualifiers': '🏆 Advance Qualifiers to Finals',
        'desc-advance-qualifiers': 'Select top-scoring contestants from this preliminary round to advance into the Grand Finals round. A new competition stage will be created automatically with their profiles and photos.',
        'label-qualifier-count': 'Advance Top:',
        'label-target-finals-name': 'Finals Competition Name',
        'label-qualifiers-preview': 'Advancing Contestants Preview',
        'btn-confirm-advance': '🚀 Create Finals & Transfer',
        'qualifiers-advanced-toast': 'Successfully advanced {n} qualifiers to the Grand Finals! 🏆',
        'no-eval-advance': 'No evaluated students available to advance.',
        'btn-open-archive': '📜 School Archive',
        'title-archive': '📜 School Historical Archive & Student Portfolio',
        'title-student-growth-tracker': '📈 Student Multi-Competition Growth Tracker',
        'desc-student-growth': 'Search any student to review their scores across all events and academic terms.',
        'ph-search-student-history': 'Enter student name or number...',
        'hint-search-student': 'Type a student\'s name above to see their historical performance trajectory.',
        'title-past-competitions': '🏛️ Past Competitions Timeline',
        'no-history-found': 'No historical evaluations found for this student.',
        'comp-participants': 'participants',
        'comp-top-score': 'Top Score',
        'growth-rate': 'Progression Rate',
    },
    ar: {
        'login-title': 'Taqeem',
        'login-subtitle': 'قم بتسجيل الدخول لإدارة تقييمات الطلاب',
        'label-username': 'اسم المستخدم',
        'label-password': 'كلمة المرور',
        'ph-username': 'أدخل اسم المستخدم الخاص بك',
        'ph-password': 'أدخل كلمة المرور الخاصة بك',
        'btn-signin': 'تسجيل الدخول',
        'demo-roles-title': '⚡ أدوار العرض التجريبي',
        'demo-roles-badge': 'دخول بضغطة زر',
        'role-admin-title': 'مدير الفعالية',
        'role-judge-title': 'عضو لجنة التحكيم',
        'btn-logout': 'تسجيل الخروج',
        'btn-switch-comp': 'تغيير المسابقة',
        'tab-admin': 'الإدارة',
        'tab-judging': 'التحكيم',
        'tab-results': 'النتائج',
        'subtab-students': 'الطلاب',
        'subtab-users': 'المستخدمون',
        'subtab-config': 'الإعدادات',
        'form-add-student': 'إضافة طالب',
        'form-edit-student': 'تعديل بيانات طالب',
        'ph-number': 'الرقم *',
        'ph-name': 'الاسم *',
        'ph-class': 'الصف *',
        'ph-section': 'الشعبة',
        'label-photo': 'صورة الطالب (اختياري)',
        'btn-choose-photo': '📷 اختر صورة',
        'btn-add-student': 'إضافة طالب',
        'btn-update-student': 'تحديث بيانات الطالب',
        'btn-cancel': 'إلغاء',
        'title-bulk': 'استيراد جماعي',
        'bulk-p1': 'قم بتعبئة هذا',
        'bulk-link': 'نموذج CSV',
        'bulk-p2': 'وقم برفع الملف أدناه.',
        'btn-choose-csv': 'اختر ملف CSV',
        'bulk-drop': 'أو قم بسحبه وإفلاته هنا',
        'btn-import': 'استيراد الطلاب',
        'title-roster': 'قائمة الطلاب',
        'label-filter-class': 'تصفية حسب الصف',
        'label-filter-section': 'تصفية حسب الشعبة',
        'opt-all-classes': 'جميع الصفوف',
        'opt-all-sections': 'جميع الشعب',
        'label-search': 'بحث',
        'ph-search-roster': 'الاسم أو الرقم...',
        'btn-bulk-edit': 'تعديل جماعي',
        'btn-bulk-delete': 'حذف جماعي',
        'title-users': 'إدارة المستخدمين',
        'form-create-user': 'إنشاء مستخدم جديد',
        'form-edit-user': 'تعديل مستخدم',
        'role-judge': 'حكم',
        'role-admin': 'مدير',
        'btn-create-user': 'إنشاء مستخدم',
        'btn-update-user': 'تحديث المستخدم',
        'title-branding': '🎨 الهوية البصرية',
        'label-app-name': 'اسم التطبيق',
        'hint-app-name': 'يقوم بتحديث عنوان الرأس، علامة تبويب المتصفح، وشاشة الدخول.',
        'label-login-subtitle': 'وصف شاشة الدخول',
        'hint-login-subtitle': 'الوصف الذي يظهر أسفل العنوان في شاشة تسجيل الدخول.',
        'label-app-logo': 'شعار التطبيق',
        'btn-choose-img': '📂 اختر صورة',
        'btn-reset-default': 'استعادة الافتراضي',
        'hint-app-logo': 'يطبق على شاشة الدخول، الرأس، وأيقونة التطبيق.',
        'label-primary-color': 'اللون الأساسي',
        'hint-primary-color': 'لون التمييز للأزرار والحالات النشطة.',
        'btn-reset': 'إعادة تعيين',
        'btn-save-branding': '💾 حفظ الهوية',
        'title-timer': '⏱️ إعدادات المؤقت',
        'label-duration': 'مدة الحديث الافتراضية',
        'unit-seconds': 'ثانية',
        'hint-timer': 'اضبط طول المؤقت الأساسي (مثلاً 180 لـ 3 دقائق).',
        'btn-apply': 'تطبيق التغييرات',
        'title-criteria': '📊 معايير التقييم',
        'btn-add-criterion': '➕ إضافة معيار',
        'ph-new-criterion': 'مثلاً: الثقة بالنفس',
        'hint-criteria': 'يتم تقييم كل معيار من 1 إلى 10.',
        'title-danger': 'منطقة الخطر',
        'danger-p': 'مسح جميع التقييمات نهائياً.',
        'btn-clear-data': 'مسح البيانات',
        'loading-roster': 'جاري تحميل القائمة...',
        'btn-timer-start': 'ابدأ',
        'btn-timer-pause': 'إيقاف مؤقت',
        'btn-timer-resume': 'استئناف',
        'btn-timer-reset': 'إعادة تعيين',
        'btn-timer-up': 'انتهى الوقت',
        'label-speaker-mgmt': 'إدارة المتحدثين',
        'opt-change-speaker': '-- تغيير المتحدث --',
        'title-matrix': 'مصفوفة التقييم',
        'label-comments': 'ملاحظات الحكم',
        'ph-comments': 'أدخل ملاحظاتك للطالب هنا...',
        'label-final-score': 'النتيجة النهائية',
        'btn-save-eval': 'حفظ التقييم',
        'btn-update-eval': 'تحديث التقييم',
        'title-results-actions': 'الإجراءات والفلاتر',
        'ph-search-results': 'بحث بالاسم...',
        'opt-all-grades': 'جميع الصفوف',
        'opt-best': 'أفضل العروض',
        'opt-raw': 'جميع الدرجات الخام',
        'btn-reset-filters': '↺ إعادة تعيين',
        'btn-export': 'تصدير CSV',
        'th-rank': 'الرتبة',
        'th-num': 'الرقم',
        'th-name': 'اسم الطالب',
        'th-class': 'الصف',
        'th-section': 'الشعبة',
        'th-highest': 'الأعلى',
        'th-avg': 'المعدل',
        'th-details': 'التفاصيل',
        'th-time': 'الوقت',
        'th-judge': 'الحكم',
        'th-score': 'الدرجة',
        'th-feedback': 'الملاحظات',
        'results-empty': 'لم يتم جمع أي تقييمات بعد.',
        'title-winner': '🏆 إعلان الفائز',
        'winner-p1': 'دفع الفائز إلى',
        'winner-link': 'شاشة العرض',
        'winner-p2': 'افتح شاشة العرض على جهاز عرض، ثم تحكم بها من هنا.',
        'label-select-winner': 'اختر الفائز',
        'opt-choose-student': '-- اختر طالباً --',
        'label-winner-photo': 'صورة الفائز (اختياري)',
        'hint-winner-photo': 'إذا لم يتم توفير صورة، سيتم عرض أيقونة ميكروفون.',
        'btn-push-winner': '🏅 دفع إلى شاشة الفوز',
        'btn-clear-screen': 'مسح الشاشة',
        'title-bulk-edit': 'تعديل جماعي للطلاب',
        'bulk-edit-p': 'اترك الحقل فارغاً للاحتفاظ بالقيم الأصلية.',
        'label-bulk-class': 'تحديث الصف',
        'label-bulk-section': 'تحديث الشعبة',
        'label-bulk-photo': 'صورة جماعية (اختياري)',
        'btn-choose-bulk-photo': '📷 اختر صورة جماعية',
        'btn-update-selected': 'تحديث المختار',
        'msg-eval-exists': 'لقد قمت بتقييم هذا الطالب بالفعل. هل تريد التحديث؟',
        'msg-complete-criteria': 'يرجى إكمال جميع معايير التقييم.',
        'msg-eval-saved': 'تم حفظ التقييم!',
        'msg-eval-updated': 'تم تحديث التقييم!',
        'msg-all-done': 'تم تقييم جميع الطلاب في القائمة!',
        'msg-delete-student': 'هل أنت متأكد من حذف هذا الطالب؟',
        'msg-delete-user': 'حذف المستخدم؟',
        'msg-clear-confirm': 'اكتب DELETE للتأكيد:',
        'msg-pushing': '⏳ جاري الدفع...',
        'msg-pushed': '🏆 تم دفع الفائز لشاشة العرض!',
        'msg-clear-display': 'تم مسح شاشة العرض.',
        'msg-no-results': 'لا توجد نتائج للتصدير',
        'lang-btn': 'English',
        'judging-active': 'يتم تقييم:',
        'already-evaluated': '(تم التقييم)',
        'empty-no-students': 'لا يوجد طلاب في القائمة.',
        'empty-go-setup': 'انتقل إلى "الإدارة" لإضافة طلاب.',
        'footer-p': 'بني للمدارس، بواسطة المجتمع.',
        'dyn_str_0': 'الرجاء اختيار طالب أولاً.',
        'dyn_str_1': 'الرجاء إكمال جميع معايير التقييم.',
        'dyn_str_2': 'تم تحديث التقييم!',
        'dyn_str_3': 'تم حفظ التقييم!',
        'dyn_str_4': 'تم تحديث التقييم (بدون اتصال).',
        'dyn_str_5': 'تم حفظ التقييم (بدون اتصال).',
        'dyn_str_6': 'اسم المستخدم مطلوب',
        'dyn_str_7': 'كلمة المرور مطلوبة للمستخدمين الجدد',
        'dyn_str_8': 'تم تحديث المستخدم بنجاح',
        'dyn_str_9': 'تم إنشاء المستخدم بنجاح',
        'dyn_str_10': 'الرقم والاسم مطلوبان',
        'dyn_str_11': 'تم تحديث الطالب بنجاح',
        'dyn_str_12': 'تمت إضافة الطالب بنجاح',
        'dyn_str_13': 'الرجاء تحديد ملف CSV أولاً',
        'dyn_str_14': 'لم يتم العثور على بيانات طالب صالحة في ملف CSV',
        'dyn_str_15': 'خطأ في استيراد الطلاب: ',
        'dyn_str_16': 'تمت إعادة ترتيب الطلاب...',
        'dyn_str_17': 'خطأ في حفظ الترتيب على الخادم',
        'dyn_str_18': 'تم حفظ الترتيب بنجاح!',
        'dyn_str_19': 'تم حفظ الترتيب محلياً.',
        'dyn_str_20': 'تم تحديث المعايير بنجاح! ✨',
        'dyn_str_21': 'الرجاء إدخال اسم المعيار.',
        'dyn_str_22': 'تمت إضافة المعيار!',
        'dyn_str_23': 'تمت إزالة المعيار.',
        'dyn_str_24': 'لا توجد نتائج للتصدير',
        'dyn_str_25': 'تم حفظ إعدادات المؤقت!',
        'dyn_str_26': 'تم حفظ الهوية البصرية! ✨',
        'dyn_str_27': 'تمت إعادة تعيين الفلاتر',
        'dyn_str_28': 'تم مسح البيانات',
        'dyn_str_29': 'تم حذف الطلاب بنجاح',
        'dyn_str_30': 'لم يتم تحديد أي طلاب',
        'dyn_str_31': 'الرجاء إفلات ملف CSV صالح.',
        'dyn_str_32': 'تم تقييم جميع الطلاب في القائمة!',
        'dyn_str_33': 'فشل رفع الصورة، يتم الدفع بدون صورة.',
        'dyn_str_34': '🏆 تم دفع الفائز لشاشة العرض!',
        'dyn_str_35': 'تم مسح شاشة عرض الفائز.',
        'dyn_str_36': 'جميع الصفوف',
        'dyn_str_37': 'جميع الشعب',
        'dyn_str_38': 'لم يتم العثور على نتائج',
        'dyn_str_39': 'لم يتم العثور على تقييمات خام',
        'dyn_str_40': 'جميع الصفوف',
        'dyn_str_41': '-- اختر طالباً --',
        'dyn_str_42': 'لم يتم تحديد معايير.',
        'dyn_str_43': '-- اختر طالباً --',
        'dyn_str_44': '-- لا يوجد طلاب متاحين --',
        'comp-title': 'اختر المسابقة',
        'comp-subtitle': 'اختر مسابقة نشطة أو أنشئ مسابقة جديدة.',
        'loading-comps': 'جاري تحميل المسابقات...',
        'comp-create-title': 'إنشاء مسابقة جديدة',
        'ph-comp-name': 'اسم المسابقة',
        'btn-create-comp': 'إنشاء مسابقة',
        'subtab-competitions': 'المسابقات',
        'title-competitions': 'إدارة المسابقات',
        'form-create-competition': 'إنشاء مسابقة جديدة',
        'opt-no-comp': '-- اختر المسابقة --',
        'btn-delete': 'حذف',
        'msg-delete-comp-confirm': 'هل أنت متأكد من حذف هذه المسابقة؟ سيتم فقدان جميع الطلاب والتقييمات المرتبطة بها نهائياً.',
        'msg-comp-deleted': 'تم حذف المسابقة بنجاح.',
        'msg-duplicates-skipped': 'تم تخطي أرقام الطلاب المكررة.',
        'label-criterion': 'المعيار',
        'label-score': 'الدرجة',
        'label-feedback': 'الملاحظات',
        'title-detailed-scores': 'تفاصيل الدرجات',
        'waiting': 'بانتظار الإعلان عن الفائز...',
        'unlock-audio': 'تفعيل الصوت للعرض',
        'congrats': 'ألف مبروك',
        'loading-init': 'جاري تهيئة النظام...',
        'sync-online': 'متصل',
        'sync-offline': 'غير متصل',
        'sync-pending': 'بانتظار المزامنة',
        'sync-syncing': 'جارٍ المزامنة...',
        'sync-success': 'تمت مزامنة جميع التقييمات بنجاح!',
        'sync-offline-saved': 'تم الحفظ محلياً (بدون اتصال). ستتم المزامنة تلقائياً عند عودة الإنترنت.',
        'btn-voice-dictate': 'إملاء صوتي',
        'voice-listening': 'جارٍ الاستماع... تكلّم الآن',
        'voice-stopped': 'تم إيقاف الإملاء الصوتي',
        'voice-unsupported': 'ميزة الإملاء الصوتي غير مدعومة في هذا المتصفح.',
        'btn-batch-certs': '🎓 تصدير جميع الشهادات',
        'btn-push-podium': '🏆 عرض منصة التتويج (أفضل 3)',
        'title-cert-preview': 'معاينة شهادة التقدير',
        'cert-award-title': 'شهادة تفوق وتكريم',
        'cert-rank-1': 'الفائز بالمركز الأول',
        'cert-rank-2': 'الفائز بالمركز الثاني',
        'cert-rank-3': 'الفائز بالمركز الثالث',
        'cert-presented-to': 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب/ـة',
        'cert-for-achievement': 'تقديراً للأداء المتميز والمشاركة الفعالة في مسابقة',
        'cert-judge-signature': 'رئيس لجنة التحكيم',
        'cert-director-signature': 'إدارة المدرسة',
        'cert-downloaded': 'تم تحميل الشهادة بنجاح!',
        'title-qr-pass': 'بطاقة الدخول السريع للحكم',
        'btn-print-pass': 'طباعة البطاقة',
        'btn-copy-link': 'نسخ الرابط',
        'hint-scan-pass': 'امسح الرمز بكاميرا هاتفك لتسجيل الدخول والبدء بالتحكيم فوراً.',
        'label-rubric-preset': 'نماذج التحكيم الجاهزة (بنقرة واحدة)',
        'btn-apply-preset': 'تطبيق النموذج',
        'opt-preset-custom': 'معايير مخصصة',
        'btn-matrix-export': 'المصفوفة التفصيلية',
        'btn-push-audience-vote': 'عرض تصويت الجمهور بالشاشة',
        'btn-reveal-audience-fav': 'إعلان الفائز بتصويت الجمهور',
        'pass-copied': 'تم نسخ رابط الدخول للحكم بنجاح!',
        'vote-stage-pushed': 'تم عرض رمز تصويت الجمهور على شاشة العرض!',
        'vote-fav-pushed': 'تم إعلان الفائز بتصويت الجمهور على الشاشة!',
        'btn-install-app': 'تثبيت التطبيق',
        'title-cert-settings': '🎓 تخصيص شهادات التقدير والجوائز',
        'label-cert-org': 'اسم المدرسة أو المنشأة',
        'ph-cert-org': 'مثال: مدارس الرواد الأهلية',
        'hint-cert-org': 'يُطبع بفخر في الترويسة العلوية لجميع الشهادات.',
        'label-cert-sig1': 'صفة التوقيع الأول (يمين/يسار)',
        'ph-cert-sig1': 'مثال: رئيس لجنة التحكيم',
        'label-cert-sig2': 'صفة التوقيع الثاني',
        'ph-cert-sig2': 'مثال: مدير المدرسة',
        'btn-save-cert-settings': '💾 حفظ إعدادات الشهادات',
        'btn-analytics': '📈 تحليلات الأداء',
        'title-analytics': '📊 تحليلات أداء المسابقة ولجنة التحكيم',
        'sub-analytics': 'نظرة شاملة حول تباين درجات التحكيم ومستويات إتقان المعايير.',
        'lbl-total-evals': 'التقييمات',
        'lbl-comp-avg': 'متوسط المسابقة',
        'lbl-highest-score': 'أعلى نتيجة',
        'lbl-active-judges': 'المحكمون',
        'title-criterion-breakdown': '🎯 مستوى الإتقان حسب المعايير',
        'desc-criterion-breakdown': 'متوسط نسبة تحصيل الطلاب في كل معيار تقييمي.',
        'title-judge-variance': '⚖️ مؤشر تباين واتساق تقييم المحكمين',
        'desc-judge-variance': 'يقارن متوسط درجات كل محكم مع متوسط اللجنة لرصد الحزم أو المرونة.',
        'th-judge': 'المحكم',
        'th-eval-count': 'عدد التقييمات',
        'th-judge-avg': 'متوسط الدرجة',
        'th-variance': 'نسبة التباين',
        'th-consistency': 'التقييم العام',
        'cert-settings-saved': 'تم حفظ إعدادات الشهادات بنجاح! ✨',
        'btn-batch-reports': '📄 تقارير الطلاب الجماعية',
        'title-report-preview': 'بطاقة التقرير التقييمي للطالب',
        'btn-download-report': 'تحميل بطاقة التقرير',
        'btn-print-report': 'طباعة بطاقة التقرير',
        'title-fairness-settings': '⚖️ ضوابط العدالة وخصوصية التحكيم',
        'label-blind-judging': 'وضع التحكيم الأعمى (حيادية تامة)',
        'hint-blind-judging': 'يخفي أسماء وصور الطلاب عن المحكمين لضمان تقييم محايد تماماً.',
        'label-score-locking': 'قفل الدرجات وسرية تقييم الزملاء',
        'hint-score-locking': 'يقفل بطاقة التقييم بعد حفظها ويحجب درجات باقي المحكمين حتى اكتمال التقييم.',
        'btn-save-fairness': 'حفظ ضوابط العدالة',
        'fairness-saved': 'تم حفظ ضوابط العدالة والخصوصية بنجاح! ✨',
        'report-downloaded': 'تم تحميل بطاقة التقرير بنجاح!',
        'btn-view-report': 'التقرير',
        'contestant-label': 'المتسابق',
        'judging-label': 'تحكيم',
        'score-locked': 'تم قفل التقييم',
        'top-strength': 'أبرز نقاط القوة',
        'focus-area': 'مجال التطوير والتحسين',
        'judge-feedback': 'ملاحظات وتوصيات لجنة التحكيم',
        'label-timer-chimes': '🔔 جرس التنبيه للمسرح (تنبيه 30 ثانية وجرس انتهاء الوقت)',
        'label-judge-chimes': '🔊 تشغيل التنبيه الصوتي أيضاً على جهاز المحكم',
        'title-audio-settings': '🎵 موسيقى المسرح ونشيد التتويج',
        'label-anthem-upload': 'النشيد المدرسي / المقطع الصوتي المخصص لاحتفال الفائزين (MP3)',
        'btn-choose-audio': '📂 اختيار ملف صوتي',
        'btn-preview-audio': '▶ استماع للمقطع',
        'btn-reset-audio': 'استعادة الهتاف الافتراضي',
        'hint-anthem-status': 'صوت الاحتفال الافتراضي مفعل حالياً.',
        'anthem-saved': 'تم حفظ المقطع الصوتي المخصص بنجاح! 🎵',
        'anthem-reset': 'تمت استعادة هتاف الاحتفال الافتراضي.',
        'anthem-playing': 'جارٍ تشغيل المقطع الصوتي التجريبي...',
        'anthem-stopped': 'تم إيقاف المقطع الصوتي.',
        'btn-advance-qualifiers': '🏆 تأهيل للمرحلة النهائية',
        'title-advance-qualifiers': '🏆 تأهيل الأوائل للنهائيات',
        'desc-advance-qualifiers': 'اختر المتسابقين الأعلى درجات لتأهيلهم مباشرة إلى الجولة الختامية والنهائية. سيتم إنشاء مرحلة جديدة تلقائياً مع صورهم وبياناتهم.',
        'label-qualifier-count': 'تأهيل أفضل:',
        'label-target-finals-name': 'اسم المرحلة النهائية',
        'label-qualifiers-preview': 'معاينة المتأهلين للنهائيات',
        'btn-confirm-advance': '🚀 إنشاء المرحلة النهائية ونقل المتأهلين',
        'qualifiers-advanced-toast': 'تم تأهيل {n} متسابقين إلى الجولة النهائية بنجاح! 🏆',
        'no-eval-advance': 'لا يوجد متسابقون مقيّمون مؤهلون للنقل حالياً.',
        'btn-open-archive': '📜 أرشيف المدرسة',
        'title-archive': '📜 الأرشيف التاريخي وسجل أداء الطلاب',
        'title-student-growth-tracker': '📈 متتبع تطور أداء الطالب عبر المسابقات',
        'desc-student-growth': 'ابحث عن أي طالب لمشاهدة درجاته وتطوره عبر جميع المسابقات المدرسية.',
        'ph-search-student-history': 'أدخل اسم الطالب أو رقمه...',
        'hint-search-student': 'اكتب اسم الطالب بالأعلى لمشاهدة مسار تطور درجاته عبر المسابقات.',
        'title-past-competitions': '🏛️ الجدول الزمني للمسابقات السابقة',
        'no-history-found': 'لم يتم العثور على تقييمات سابقة لهذا الطالب.',
        'comp-participants': 'مشارك',
        'comp-top-score': 'أعلى درجة',
        'growth-rate': 'معدل التطور',
    }
};

let currentLang = localStorage.getItem('taqeem_lang') || 'en';


function translate(key) {
    return translations[currentLang][key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const val = translate(key);
        if (el.tagName === 'INPUT' && el.placeholder) el.placeholder = val;
        else if (el.tagName === 'TEXTAREA' && el.placeholder) el.placeholder = val;
        else el.textContent = val;
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('taqeem_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    applyTranslations();

    const langBtns = ['lang-btn-login', 'lang-btn-app'];
    langBtns.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.textContent = translate('lang-btn');
    });

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = 'Taqeem | ' + (lang === 'ar' ? 'نظام التقييم المتميز' : 'Premium Evaluation System');

    if (isAuthenticated) {
        renderRoster();
        renderJudgingSidebar();
        renderResults();
        populateStudentSelect();
        populateWinnerSelect();
        renderCriteriaMatrix();
        if (currentTab === 'setup' && currentSubTab === 'config') renderCriteriaManager();
    }
}

window.toggleLang = () => {
    setLanguage(currentLang === 'en' ? 'ar' : 'en');
};


function getSupabase() {
  return window.supabaseClient || null;
}

// ===== INITIALIZATION =====

async function init() {
  console.log('Taqeem Evaluation System Loaded');
  bindAuthEvents();
  bindAppEvents();
  initOfflineEngine();
  initVoiceDictation();
  initPwaInstall();
  loadCertificateSettings();
  loadFairnessSettings();
  loadAudioSettings();
  setLanguage(currentLang);
  await loadSettings();

  const urlParams = new URLSearchParams(window.location.search);
  const judgePassParam = urlParams.get('judgePass');
  if (judgePassParam) {
    await handleJudgePassAutoLogin(judgePassParam);
  }

  await checkAuthState();

  if (isAuthenticated) {
    applyRolePermissions();
    // Channel subscription moved to finishInitSession

    await loadRoster();
    await loadEvaluations();
    renderRoster();
    populateStudentSelect();
    populateWinnerSelect();
    await loadAllCustomUsers();
    renderRolePanel();
    renderJudgingSidebar(); 
    updateFilterDropdowns();
    updateResultFilterOptions(); 
    switchTab(currentTab);
    resetTimer();
    startSilentRefresh();
  }
}
async function loadSettings() {
  loadCertificateSettings();
  let settings = {};
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) settings = JSON.parse(stored);

  // Try to fetch from Supabase for global sync
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('site_settings').select('config').eq('id', 'global_config').maybeSingle();
      if (data && data.config) {
        settings = data.config;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      }
    } catch (err) {
      console.warn('Could not load global settings, using local:', err);
    }
  }

  if (settings) {
    // Timer
    defaultTimerDuration = settings.timerDuration !== undefined ? settings.timerDuration : 180;
    const chimesCheckbox = document.getElementById('cfg-timer-chimes');
    if (chimesCheckbox) {
      chimesCheckbox.checked = settings.timerChimes !== undefined ? !!settings.timerChimes : true;
    }
    const judgeChimesCheckbox = document.getElementById('cfg-judge-timer-chimes');
    if (judgeChimesCheckbox) {
      judgeChimesCheckbox.checked = !!settings.judgeTimerChimes;
    }
    const input = document.getElementById('settings-timer-duration');
    if (input) input.value = defaultTimerDuration;
    
    // Hide timer if duration is 0
    const timerCard = document.querySelector('.timer-card');
    if (timerCard) {
        timerCard.style.display = (Number(defaultTimerDuration) === 0) ? 'none' : '';
    }

    // Criteria
    if (settings.criteria && Array.isArray(settings.criteria)) {
        CRITERIA_KEYS = settings.criteria.map(c => c.id);
        criteriaLabels = {};
        settings.criteria.forEach(c => criteriaLabels[c.id] = c.label);
    }
    if (settings.criteriaWeights && typeof settings.criteriaWeights === 'object') {
        criteriaWeights = settings.criteriaWeights;
    }
  }

  timerRemaining = defaultTimerDuration;
  applyBranding();
  renderCriteriaMatrix();
  if (currentTab === 'setup' && currentSubTab === 'config') {
      renderCriteriaManager();
  }
}

async function syncSettingsToSupabase(settings) {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
        await supabase.from('site_settings').upsert({ id: 'global_config', config: settings });
    } catch (err) {
        console.error('Failed to sync settings:', err);
    }
}

function renderCriteriaMatrix() {
    const container = document.getElementById('criteria-container');
    if (!container) return;

    container.innerHTML = CRITERIA_KEYS.map((key, index) => {
        const weightVal = criteriaWeights[key] !== undefined ? criteriaWeights[key] : Math.round(100 / CRITERIA_KEYS.length);
        return `
        <div class="criteria-item" style="${index > 0 ? 'margin-top: 20px;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label class="criteria-label" style="margin: 0;">${criteriaLabels[key]}</label>
              <span class="criteria-weight-tag" style="font-size: 0.75rem; color: var(--primary); font-weight: 700; background: rgba(79, 70, 229, 0.08); padding: 2px 8px; border-radius: 10px;">${weightVal}%</span>
            </div>
            <div class="score-pill-row" data-criteria="${key}">
                <button type="button" class="score-pill" data-value="1">1</button>
                <button type="button" class="score-pill" data-value="2">2</button>
                <button type="button" class="score-pill" data-value="3">3</button>
                <button type="button" class="score-pill" data-value="4">4</button>
                <button type="button" class="score-pill" data-value="5">5</button>
                <button type="button" class="score-pill" data-value="6">6</button>
                <button type="button" class="score-pill" data-value="7">7</button>
                <button type="button" class="score-pill" data-value="8">8</button>
                <button type="button" class="score-pill" data-value="9">9</button>
                <button type="button" class="score-pill" data-value="10">10</button>
            </div>
        </div>
        `;
    }).join('');

    // Update total placeholder
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) {
        totalScoreEl.textContent = `0 / ${CRITERIA_KEYS.length * 10}`;
    }
}

function applyBranding() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored ? JSON.parse(stored) : {};

  const appName = settings.appName || 'Taqeem';
  const subtitle = settings.appSubtitle || 'Sign in to manage student evaluations';
  const logoSrc = settings.logoDataUrl || null;
  const primaryColor = settings.primaryColor || null;

  // App name
  document.title = appName + ' | Premium Evaluation System';
  const headerTitle = document.querySelector('.app-title');
  if (headerTitle) headerTitle.textContent = appName;
  const loginTitle = document.querySelector('.login-title');
  if (loginTitle) loginTitle.textContent = appName;
  const footerText = document.querySelector('.login-footer-text');
  if (footerText) footerText.textContent = appName;

  // Login subtitle
  const loginSubtitle = document.querySelector('.login-subtitle');
  if (loginSubtitle) loginSubtitle.textContent = subtitle;

  // Logo
  if (logoSrc) {
    document.querySelectorAll('.login-logo-img, .header-logo-img').forEach(img => img.src = logoSrc);
  }

  // Primary color
  if (primaryColor) {
    document.documentElement.style.setProperty('--primary', primaryColor);
    // Derive hover color (slightly darker)
    document.documentElement.style.setProperty('--primary-hover', primaryColor);
  }

  // Populate branding fields if config panel is loaded
  const nameInput = document.getElementById('cfg-app-name');
  if (nameInput) nameInput.value = appName !== 'Taqeem' ? appName : '';
  const subtitleInput = document.getElementById('cfg-app-subtitle');
  if (subtitleInput) subtitleInput.value = subtitle !== 'Sign in to manage student evaluations' ? subtitle : '';
  const colorInput = document.getElementById('cfg-primary-color');
  if (colorInput && primaryColor) { colorInput.value = primaryColor; }
  const hexLabel = document.getElementById('cfg-color-hex');
  if (hexLabel && primaryColor) hexLabel.textContent = primaryColor;
  const preview = document.getElementById('cfg-logo-preview');
  if (preview && logoSrc) preview.src = logoSrc;

  // Update PWA Manifest dynamically
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink) {
    const dynamicManifest = {
      name: appName,
      short_name: appName,
      description: "Student roster management for random selection",
      start_url: "./",
      display: "standalone",
      background_color: "#f8f9fa",
      theme_color: primaryColor || "#4f46e5",
      orientation: "portrait-primary",
      icons: [
        {
          src: logoSrc || "icons/logo.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable"
        },
        {
          src: logoSrc || "icons/logo.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable"
        }
      ]
    };
    const stringManifest = JSON.stringify(dynamicManifest);
    const encoded = encodeURIComponent(stringManifest);
    manifestLink.href = `data:application/manifest+json;charset=utf-8,${encoded}`;
  }
}

async function checkAuthState() {
  const storedUserId = localStorage.getItem('currentUserId');
  const storedUsername = localStorage.getItem('currentUsername');
  
  if (storedUserId && storedUsername) {
    userRole = localStorage.getItem('currentUserRole') || 'judge';
    currentUserId = storedUserId;
    
    // Restore competition context
    currentCompetitionId = localStorage.getItem('currentCompetitionId');
    currentCompetitionName = localStorage.getItem('currentCompetitionName');

    isAuthenticated = true;

    if (userRole === 'admin') {
      if (!currentCompetitionId) {
        // Admin is logged in but no competition selected, show selector
        showCompetitionSelector();
        await loadCompetitions();
      } else {
        // Restore active competition
        showApp();
        const badge = document.getElementById('active-comp-badge');
        if (badge) badge.textContent = currentCompetitionName;
        const switchBtn = document.getElementById('switch-comp-btn');
        if (switchBtn) switchBtn.style.display = 'inline-flex';
        await finishInitSession();
      }
    } else {
      // Judge must have competition ID
      if (!currentCompetitionId) {
        showToast(currentLang === 'ar' ? 'خطأ في حساب المحكّم: لم يتم تعيين مسابقة.' : 'Judge account error: No competition assigned.', 'error');
        handleLogout();
        return;
      }
      showApp();
      await finishInitSession();
    }

    bindAuthEvents();
    return;
  }
  
  showLogin();
  isAuthenticated = false;
  bindAuthEvents();
}

function applyRolePermissions() {
  const adminTab = document.querySelector('[data-tab="setup"]');
  if (adminTab) adminTab.hidden = (userRole !== 'admin');
  
  const winnersTab = document.querySelector('[data-tab="winners"]');
  if (winnersTab) winnersTab.remove(); // Just remove it entirely if found
  
  const resultsTab = document.querySelector('[data-tab="results"]');
  if (resultsTab) resultsTab.hidden = (userRole !== 'admin');
  
  const badge = document.getElementById('role-badge');
  if (badge) {
    badge.textContent = userRole === 'admin' ? 'Admin' : 'Judge';
    badge.className = 'role-badge ' + userRole;
  }

  const userDisplay = document.getElementById('current-username-display');
  if (userDisplay) {
    const username = localStorage.getItem('currentUsername') || 'User';
    userDisplay.textContent = username;
  }
}

// ===== UI NAVIGATION =====

function showLogin() {
  const login = document.getElementById('login-view');
  const app = document.getElementById('app-container');
  const comp = document.getElementById('competition-view');
  if (login) { login.hidden = false; login.style.display = 'flex'; }
  if (app) { app.hidden = true; app.style.display = 'none'; }
  if (comp) { comp.hidden = true; comp.style.display = 'none'; }
}

function showApp() {
  const login = document.getElementById('login-view');
  const app = document.getElementById('app-container');
  const comp = document.getElementById('competition-view');
  if (login) { login.hidden = true; login.style.display = 'none'; }
  if (app) { app.hidden = false; app.style.display = 'block'; }
  if (comp) { comp.hidden = true; comp.style.display = 'none'; }
  
  showHUD(); // Reveal HUD immediately
  console.log('App view activated.');
}

function showCompetitionSelector() {
  const login = document.getElementById('login-view');
  const app = document.getElementById('app-container');
  const comp = document.getElementById('competition-view');
  if (login) { login.hidden = true; login.style.display = 'none'; }
  if (app) { app.hidden = true; app.style.display = 'none'; }
  if (comp) { comp.hidden = false; comp.style.display = 'flex'; }
  console.log('Competition selector activated.');
}

function showHUD() {
  const loader = document.getElementById('init-loader');
  if (loader) {
    loader.hidden = false;
    loader.style.display = 'flex';
  }
  updateHUD(5, 'Connecting...');
}

function hideHUD() {
  const loader = document.getElementById('init-loader');
  if (loader) {
    loader.hidden = true;
    loader.style.display = 'none';
  }
}

function updateHUD(percent, detail) {
  const bar = document.getElementById('hud-progress-bar');
  const det = document.getElementById('hud-detail');
  if (bar) bar.style.width = percent + '%';
  if (det) det.textContent = detail;
  console.log(`[Init] ${percent}% - ${detail}`);
}


function switchTab(tabName) {
  if ((tabName === 'setup' || tabName === 'results') && userRole !== 'admin') {
    tabName = 'judging';
  }
  currentTab = tabName;
  localStorage.setItem('taqeem_currentTab', tabName);

  document.querySelectorAll('.tab-bar .tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabName;
    tab.classList.toggle('active', isActive);
  });

  const panels = ['setup-panel', 'judging-panel', 'results-panel'];
  panels.forEach(p => {
    const el = document.getElementById(p);
    if (el) {
      el.hidden = true;
      el.style.display = 'none';
    }
  });
  
  const panelMap = {
    'setup': 'setup-panel',
    'judging': 'judging-panel',
    'results': 'results-panel'
  };
  
  const activePanel = document.getElementById(panelMap[tabName]);
  if (activePanel) {
    activePanel.hidden = false;
    // Explicitly show if hidden by other means
    activePanel.style.display = 'block'; 
    
    if (tabName === 'setup') {
        updateFilterDropdowns();
        switchSubTab(currentSubTab);
    }
    if (tabName === 'results') {
      renderResults();
      populateWinnerSelect(); // Initialize winner select when results tab is opened
    }
    if (tabName === 'judging') {
        populateStudentSelect();
        renderJudgingSidebar();
    }
  }
}

function switchSubTab(subtabName) {
  currentSubTab = subtabName;
  localStorage.setItem('taqeem_currentSubTab', subtabName);

  document.querySelectorAll('.sub-tab-bar .sub-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.subtab === subtabName);
  });

  const subPanelMap = {
    'students': 'students-subpanel',
    'users': 'users-subpanel',
    'config': 'config-subpanel',
    'competitions': 'competitions-subpanel'
  };

  Object.entries(subPanelMap).forEach(([key, panelId]) => {
    const el = document.getElementById(panelId);
    if (!el) return;
    if (key === subtabName) {
      el.removeAttribute('hidden');
    } else {
      el.setAttribute('hidden', '');
    }
  });

  if (subtabName === 'competitions') {
    renderCompetitionsTab();
  }

  if (subtabName === 'users') {
    // Reload all users for the current competition, then render
    loadAllCustomUsers().then(() => {
      renderRolePanel();
      renderCompetitionsTab(); // also populate the competition dropdown in user form
    });
  }

  // Refresh branding fields and winner dropdown when admin opens the config tab
  if (subtabName === 'config') {
    applyBranding();
    populateWinnerSelect();
    renderCriteriaManager();
  }
}

// ===== AUTH CORE =====

let currentCompetitionId = localStorage.getItem('currentCompetitionId') || null;
let currentCompetitionName = localStorage.getItem('currentCompetitionName') || null;

async function handleLogin() {
  const username = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const loginBtn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  
  loginBtn.disabled = true;
  loginBtn.textContent = 'Authenticating...';
  
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase client not initialized');

    console.log('Authenticating user:', username);
    const inputHash = await hashPassword(password);

    // 1. Attempt secure server-side RPC authentication (prevents exposing custom_users table)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('authenticate_custom_user', {
        p_username: username,
        p_password_hash: inputHash
      });

      if (!rpcError && rpcData) {
        if (rpcData.success && rpcData.user) {
          const user = rpcData.user;
          let compName = null;
          if (user.competition_id) {
            const { data: compData } = await supabase.from('competitions')
              .select('name').eq('id', user.competition_id).maybeSingle();
            if (compData) compName = compData.name;
          }
          console.log('Password verified successfully via secure RPC.');
          setAndInitSession(user.id, user.username, user.role, user.competition_id, compName);
          return;
        } else if (rpcData.error) {
          throw new Error(rpcData.error);
        }
      }
    } catch (rpcEx) {
      if (rpcEx.message === 'Invalid username or password') {
        throw rpcEx;
      }
      console.warn('RPC auth check failed, trying direct query fallback:', rpcEx.message);
    }

    // 2. Direct query fallback for legacy databases where client_setup.sql hasn't been rerun yet
    const { data, error } = await supabase.from('custom_users')
      .select('*').eq('username', username).maybeSingle();
      
    if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Database connection issue');
    }

    if (data) {
      let compName = null;
      if (data.competition_id) {
          const { data: compData } = await supabase.from('competitions')
            .select('name').eq('id', data.competition_id).maybeSingle();
          if (compData) compName = compData.name;
      }
      
      if (inputHash === data.password_hash) {
        console.log('Password verified successfully.');
        setAndInitSession(data.id, data.username, data.role, data.competition_id, compName);
        return;
      } else {
        throw new Error('Invalid password');
      }
    }

    const { count, error: countError } = await supabase.from('custom_users').select('*', { count: 'exact', head: true });
    if (!countError && count === 0 && username === 'admin' && password === 'admin123') {
        const passwordHash = await hashPassword('admin123');
        const { data: newUser, error: insertError } = await supabase.from('custom_users').insert([{
            username: 'admin',
            password_hash: passwordHash,
            role: 'admin'
        }]).select().single();
        
        if (!insertError && newUser) {
            setAndInitSession(newUser.id, newUser.username, newUser.role, null, null);
            return;
        }
    }

    throw new Error('Invalid username or password');
    
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.hidden = false;
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Sign In';
  }
}

function quickFillRole(username, password) {
  const userInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.hidden = true;
  
  if (userInput && passInput) {
    userInput.value = username;
    passInput.value = password;
    
    userInput.style.transition = 'border-color 0.3s ease';
    passInput.style.transition = 'border-color 0.3s ease';
    userInput.style.borderColor = 'var(--primary)';
    passInput.style.borderColor = 'var(--primary)';
    setTimeout(() => {
      userInput.style.borderColor = '';
      passInput.style.borderColor = '';
    }, 400);

    handleLogin();
  }
}
window.quickFillRole = quickFillRole;

async function setAndInitSession(id, username, role, compId, compName) {
  currentUserId = id;
  userRole = role;
  localStorage.setItem('currentUserId', id);
  localStorage.setItem('currentUsername', username);
  localStorage.setItem('currentUserRole', role);
  isAuthenticated = true;

  if (role === 'admin') {
    showCompetitionSelector();
    await loadCompetitions();
  } else {
    if (!compId) {
      showToast(currentLang === 'ar' ? 'حساب المحكّم غير مرتبط بأي مسابقة.' : 'Judge account is not assigned to any competition.', 'error');
      return;
    }
    selectCompetition(compId, compName || 'Competition');
  }
}

async function loadCompetitions() {
  // Target the competition-view modal's list specifically
  const listEl = document.querySelector('#competition-view #comp-selector-list');
  if (listEl) listEl.innerHTML = '<p class="empty-state-text" data-i18n="loading-comps">Loading competitions...</p>';
  
  const supabase = getSupabase();
  if (!supabase) {
    if (listEl) listEl.innerHTML = '<p class="empty-state-text">Database not connected.</p>';
    return;
  }

  const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
  if (!error && data) competitions = data;
  
  if (!listEl) return;
  
  if (error || !data || data.length === 0) {
    listEl.innerHTML = '<p class="empty-state-text">No competitions found. Create one below.</p>';
    return;
  }

  listEl.innerHTML = '';
  data.forEach(comp => {
    const card = document.createElement('div');
    card.className = 'setup-card';
    card.style.display = 'flex';
    card.style.justifyContent = 'space-between';
    card.style.alignItems = 'center';
    card.style.padding = '12px 16px';
    card.style.marginBottom = '0';
    card.style.cursor = 'pointer';
    card.style.border = '1px solid var(--border)';
    
    card.innerHTML = `
      <div>
        <h3 style="margin: 0; font-size: 1.1rem;">${escapeHtml(comp.name)}</h3>
        <span style="font-size: 0.8rem; color: ${comp.status === 'active' ? 'var(--success)' : 'var(--text-muted)'}">${comp.status.toUpperCase()}</span>
      </div>
      <button class="btn btn-login" style="padding: 6px 12px; font-size: 0.85rem;">Enter</button>
    `;
    card.onclick = () => selectCompetition(comp.id, comp.name);
    listEl.appendChild(card);
  });

  // Also update the sub-tab panel if visible
  renderCompetitionsTab();
  applyTranslations();
}



document.getElementById('comp-logout-btn')?.addEventListener('click', handleLogout);

async function selectCompetition(id, name) {
  currentCompetitionId = id;
  currentCompetitionName = name;
  localStorage.setItem('currentCompetitionId', id);
  localStorage.setItem('currentCompetitionName', name);
  
  const badge = document.getElementById('active-comp-badge');
  if (badge) badge.textContent = name;
  
  showApp();
  
  // Call switchTab immediately to ensure the shell is visible while data loads
  switchTab(userRole === 'admin' ? 'setup' : 'judging');

  const switchBtn = document.getElementById('switch-comp-btn');
  if (switchBtn) switchBtn.style.display = userRole === 'admin' ? 'inline-flex' : 'none';

  const winnerLink = document.getElementById('winner-screen-link');
  if (winnerLink) {
    winnerLink.href = 'winners/?comp=' + id;
    winnerLink.textContent = name + ' ' + translate('winner-link');
  }

  await finishInitSession();
}


async function renderCompetitionsTab() {
  // Target the admin sub-tab panel's list (distinct ID to avoid collision with login modal)
  const container = document.getElementById('competitions-subpanel-list');
  const userSelect = document.getElementById('new-user-competition');
  
  const supabase = getSupabase();
  if (!supabase) return;
  
  const { data, error } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
  if (!error && data) competitions = data;
  
  // Always update the user competition dropdown if it exists
  if (userSelect) {
    if (error || !data || data.length === 0) {
      userSelect.innerHTML = '<option value="">No competitions available</option>';
    } else {
      userSelect.innerHTML = '<option value="">Assign to Competition...</option>' + 
        data.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    }
  }

  if (!container) return;
  
  if (error) {
    container.innerHTML = `<p class="empty-state-text" style="color:var(--danger)">Failed to load competitions: ${error.message}</p>`;
    return;
  }
  
  if (!data || data.length === 0) {
    container.innerHTML = `<p class="empty-state-text">No competitions found. Create one below.</p>`;
    return;
  }
  
  container.innerHTML = data.map(c => `
    <div class="user-row" style="cursor:pointer;" onclick="switchToCompetition('${c.id}', '${escapeHtml(c.name).replace(/'/g, "\\'")}')">
      <div>
        <div style="font-weight: 600;">${escapeHtml(c.name)}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          ${c.id === currentCompetitionId ? '<span style="color:var(--success); font-weight:700;">● ACTIVE</span>' : c.status.toUpperCase()}
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <span class="role-badge ${c.status === 'active' ? 'admin' : 'judge'}">${c.status}</span>
        ${c.id !== currentCompetitionId ? `
          <button class="btn btn-login" style="padding:4px 10px; font-size:0.8rem;" onclick="event.stopPropagation(); switchToCompetition('${c.id}', '${escapeHtml(c.name).replace(/'/g, "\\'")}')" data-i18n="btn-switch-comp">Switch</button>
          <button class="btn btn-login" style="padding:4px 10px; font-size:0.8rem; background:var(--danger); border-color:var(--danger);" onclick="event.stopPropagation(); deleteCompetition('${c.id}', '${escapeHtml(c.name).replace(/'/g, "\\'")}')" data-i18n="btn-delete">Delete</button>
        ` : '<span style="color:var(--success);font-size:0.85rem;font-weight:700;">✓ Current</span>'}
      </div>
    </div>
  `).join('');

  applyTranslations();
}

window.deleteCompetition = async function(id, name) {
  if (!confirm(translate('msg-delete-comp-confirm'))) return;

  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase.from('competitions').delete().eq('id', id);
    if (error) throw error;
    
    // Refresh the list
    await loadCompetitions();
    showToast(translate('msg-comp-deleted'));

    // If we deleted the current competition, we must reset
    if (id === currentCompetitionId) {
      currentCompetitionId = null;
      localStorage.removeItem('currentCompetitionId');
      location.reload();
    }
  } catch (err) {
    console.error('Error deleting competition:', err);
    showToast((currentLang === 'ar' ? 'فشل حذف المسابقة: ' : 'Failed to delete competition: ') + err.message, 'error');
  }
}

function bindCompetitionViewEvents() {
  // Competition creation form in the login modal
  document.getElementById('create-comp-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    if (btn && btn.disabled) return;

    const nameInput = document.getElementById('modal-comp-name');
    if (!nameInput) return;
    const name = nameInput.value.trim();
    if (!name) return;

    const supabase = getSupabase();
    if (!supabase) return;

    if (btn) {
        btn.disabled = true;
        btn.textContent = currentLang === 'ar' ? 'جاري الإنشاء...' : 'Creating...';
    }

    try {
        const { data, error } = await supabase.from('competitions').insert([{ name, status: 'active' }]).select().single();
        if (error) {
            showToast('Error: ' + error.message, 'error');
        } else {
            nameInput.value = '';
            showToast(currentLang === 'ar' ? 'تم إنشاء المسابقة!' : 'Competition created!');
            await loadCompetitions();
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = currentLang === 'ar' ? 'إنشاء' : 'Create';
        }
    }
  });

  document.getElementById('comp-logout-btn')?.addEventListener('click', handleLogout);

  // Switch-comp button in the app header (show competition selector)
  const switchCompBtn = document.getElementById('switch-comp-btn');
  if (switchCompBtn) {
    switchCompBtn.onclick = async () => {
      document.getElementById('app-container').hidden = true;
      document.getElementById('competition-view').hidden = false;
      document.getElementById('login-view').hidden = true;
      await loadCompetitions();
    };
  }
}
window.switchToCompetition = async function(id, name) {
  if (id === currentCompetitionId) return; // Already active
  if (!confirm(`Switch to competition: "${name}"? This will reload data for that competition.`)) return;
  
  currentCompetitionId = id;
  currentCompetitionName = name;
  localStorage.setItem('currentCompetitionId', id);
  localStorage.setItem('currentCompetitionName', name);
  
  const badge = document.getElementById('active-comp-badge');
  if (badge) badge.textContent = name;
  
  // Reload all data for new competition
  roster = [];
  evaluations = [];
  allCustomUsers = [];
  
  await finishInitSession();
  showToast('Switched to: ' + name);
};

async function finishInitSession() {
  console.group('Initializing Session');
  console.time('SessionInit');
  
  const supabase = getSupabase();
  if (supabase && currentCompetitionId) {
      try {
          updateHUD(10, 'Establishing realtime connection...');
          if (currentChannel) {
              supabase.removeChannel(currentChannel);
          }
          currentChannel = supabase.channel('winners-display-' + currentCompetitionId).subscribe();
      } catch (e) {
          console.warn('Realtime subscription error:', e);
      }
  }

  try {
      updateHUD(20, translate('loading-init') + ' (Settings)');
      await loadSettings();
      
      updateHUD(35, translate('loading-init') + ' (Permissions)');
      applyRolePermissions();
      
      updateHUD(50, translate('loading-init') + ' (Roster)');
      await loadRoster();
      
      updateHUD(65, translate('loading-init') + ' (Evaluations)');
      await loadEvaluations();
      
      updateHUD(80, translate('loading-init') + ' (Users)');
      await loadAllCustomUsers();
      
      updateHUD(90, translate('loading-init') + ' (Finalizing)');
      updateFilterDropdowns();
      updateResultFilterOptions();
      populateStudentSelect();
      populateWinnerSelect();
      renderRolePanel();
      renderJudgingSidebar();
      bindAppEvents();
      
      updateHUD(100, translate('loading-init') + ' (Done)');
      
      // Delay slightly for smooth transition
      setTimeout(() => {
        hideHUD();
        console.timeEnd('SessionInit');
        console.groupEnd();
      }, 600);
      
  } catch (err) {
      console.error('Critical failure during session initialization:', err);
      console.groupEnd();
      updateHUD(100, 'Initialization failed.');
      showToast('Initialization error. Please refresh the page.', 'error');
  }
}


function handleLogout() {
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUsername');
  localStorage.removeItem('currentUserRole');
  localStorage.removeItem('currentCompetitionId');
  localStorage.removeItem('currentCompetitionName');
  localStorage.removeItem('taqeem_currentTab');
  localStorage.removeItem('taqeem_currentSubTab');
  location.reload();
}

// ===== DATA OPERATIONS =====

async function loadRoster() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('students')
        .select('*')
        .eq('competition_id', currentCompetitionId)
        .order('number');
      if (error) {
        console.error('Supabase roster error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      roster = data || [];
    } catch (e) { 
      console.warn('Supabase roster error:', e.message); 
    }
  }
  if (roster.length === 0) {
    const stored = localStorage.getItem(STORAGE_KEY);
    roster = stored ? JSON.parse(stored) : [];
  }
  updateFilterDropdowns();
  sortRoster();
  renderRoster();
  populateStudentSelect();
  populateWinnerSelect();
  renderJudgingSidebar();
}

function sortRoster() {
  roster.sort((a, b) => {
    // Sort by sort_order first
    if ((a.sort_order || 0) !== (b.sort_order || 0)) {
        return (a.sort_order || 0) - (b.sort_order || 0);
    }
    // Fallback to number
    const numA = String(a.number || '');
    const numB = String(b.number || '');
    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
  });
}

// ===== OFFLINE SCORE PROTECTION & AUTO-SYNC ENGINE =====
const OFFLINE_QUEUE_KEY = 'taqeem_offline_evaluations';
let isSyncInProgress = false;

function getOfflineQueue() {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading offline queue:', e);
    return [];
  }
}

function saveOfflineQueue(queue) {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Error saving offline queue:', e);
  }
}

function enqueueOfflineEvaluation(evaluation, isUpdate) {
  const queue = getOfflineQueue();
  // Remove existing pending evaluation for same student/judge if present
  const filtered = queue.filter(item => 
    !(item.evaluation.student_id === evaluation.student_id && item.evaluation.judge_id === evaluation.judge_id)
  );
  filtered.push({
    evaluation,
    isUpdate,
    queuedAt: new Date().toISOString()
  });
  saveOfflineQueue(filtered);
  updateSyncIndicator();
}

function updateSyncIndicator(isSyncing = false) {
  const badge = document.getElementById('sync-status-badge');
  const textEl = document.getElementById('sync-status-text');
  if (!badge || !textEl) return;

  const queue = getOfflineQueue();
  const pendingCount = queue.length;
  const isOnline = navigator.onLine;

  badge.classList.remove('offline', 'syncing');

  if (isSyncing) {
    badge.classList.add('syncing');
    textEl.textContent = translate('sync-syncing');
  } else if (!isOnline) {
    badge.classList.add('offline');
    textEl.textContent = pendingCount > 0 
      ? `${pendingCount} ${translate('sync-pending')}`
      : translate('sync-offline');
  } else if (pendingCount > 0) {
    badge.classList.add('offline');
    textEl.textContent = `${pendingCount} ${translate('sync-pending')}`;
  } else {
    textEl.textContent = translate('sync-online');
  }
}

async function syncOfflineEvaluations() {
  if (isSyncInProgress) return;
  if (!navigator.onLine) {
    updateSyncIndicator();
    return;
  }

  const queue = getOfflineQueue();
  if (queue.length === 0) {
    updateSyncIndicator();
    return;
  }

  const supabase = getSupabase();
  if (!supabase) return;

  isSyncInProgress = true;
  updateSyncIndicator(true);

  let syncedCount = 0;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      let query;
      if (item.isUpdate) {
        query = supabase.from('evaluations')
          .update(item.evaluation)
          .match({ student_id: item.evaluation.student_id, judge_id: item.evaluation.judge_id });
      } else {
        query = supabase.from('evaluations').insert([item.evaluation]);
      }

      const { error } = await query;
      if (error) {
        console.warn('Sync failed for evaluation, will retry:', error);
        remainingQueue.push(item);
      } else {
        syncedCount++;
      }
    } catch (err) {
      console.warn('Network exception during sync:', err);
      remainingQueue.push(item);
    }
  }

  saveOfflineQueue(remainingQueue);
  isSyncInProgress = false;
  updateSyncIndicator();

  if (syncedCount > 0) {
    await loadEvaluations();
    updateResultFilterOptions();
    await renderResults();
    renderJudgingSidebar();
    showToast(
      currentLang === 'ar'
        ? `✅ تمت مزامنة ${syncedCount} تقييم بنجاح!`
        : `✅ Synced ${syncedCount} offline score(s) to cloud!`,
      'success'
    );
  }
}

function initOfflineEngine() {
  window.addEventListener('online', () => {
    updateSyncIndicator();
    syncOfflineEvaluations();
  });

  window.addEventListener('offline', () => {
    updateSyncIndicator();
  });

  // Auto-retry syncing every 30 seconds if online
  setInterval(() => {
    if (navigator.onLine && getOfflineQueue().length > 0) {
      syncOfflineEvaluations();
    }
  }, 30000);

  updateSyncIndicator();
}

async function loadEvaluations() {
  const supabase = getSupabase();
  if (supabase && navigator.onLine) {
    try {
      const { data, error } = await supabase.from('evaluations')
        .select('*')
        .eq('competition_id', currentCompetitionId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Supabase evaluations error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      evaluations = data || [];
    } catch (e) { console.warn('Supabase eval error:', e.message); }
  }
  if (evaluations.length === 0) {
    const stored = localStorage.getItem(EVALUATIONS_KEY);
    evaluations = stored ? JSON.parse(stored) : [];
  }

  // Merge any pending offline evaluations into in-memory array
  const offlineQueue = getOfflineQueue();
  if (offlineQueue.length > 0) {
    offlineQueue.forEach(item => {
      if (item.evaluation && item.evaluation.competition_id === currentCompetitionId) {
        const idx = evaluations.findIndex(e => e.student_id === item.evaluation.student_id && e.judge_id === item.evaluation.judge_id);
        if (idx >= 0) {
          evaluations[idx] = item.evaluation;
        } else {
          evaluations.unshift(item.evaluation);
        }
      }
    });
  }

  renderJudgingSidebar();
}

async function saveEvaluation() {
  const select = document.getElementById('student-select');
  if (!select || !select.value) return showToast(translate('dyn_str_0'), 'error');

  const studentId = select.value;
  const activeStudent = roster.find(s => s.id === studentId);
  
  const existingEval = evaluations.find(e => e.student_id === studentId && e.judge_id === currentUserId);
  if (existingEval) {
    if (!confirm('You have already evaluated this student. Do you want to update your previous evaluation?')) {
      return;
    }
  }

  const comments = document.getElementById('evaluation-comments').value;

  // Clear previous errors
  document.querySelectorAll('.criteria-item.has-error').forEach(el => el.classList.remove('has-error'));

  const scores = {};
  let firstMissingElement = null;

  for (const key of CRITERIA_KEYS) {
    const activePill = document.querySelector(`.score-pill-row[data-criteria="${key}"] .score-pill.active`);
    if (!activePill) {
      const itemEl = document.querySelector(`.score-pill-row[data-criteria="${key}"]`).closest('.criteria-item');
      if (itemEl) {
        itemEl.classList.add('has-error');
        if (!firstMissingElement) firstMissingElement = itemEl;
      }
    } else {
      scores[key] = parseInt(activePill.dataset.value, 10);
    }
  }

  if (firstMissingElement) {
    firstMissingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return showToast(translate('dyn_str_1'), 'error');
  }

  const judgeName = localStorage.getItem('currentUsername') || 'Judge';
  const evaluation = {
    competition_id: currentCompetitionId,
    student_id: activeStudent.id,
    student_name: activeStudent.name,
    student_number: activeStudent.number,
    class_name: activeStudent.class_name || '',
    section: activeStudent.section || '',
    scores,
    total: calculateTotal(),
    comments,
    judge_id: currentUserId,
    judge_name: judgeName
  };

  const supabase = getSupabase();
  let supabaseSaved = false;

  if (supabase && navigator.onLine) {
    try {
      let query;
      if (existingEval) {
        // Update existing
        query = supabase.from('evaluations')
          .update(evaluation)
          .match({ student_id: studentId, judge_id: currentUserId });
      } else {
        // Insert new
        query = supabase.from('evaluations').insert([evaluation]);
      }
      
      const { error } = await query;
      if (!error) {
        supabaseSaved = true;
        await loadEvaluations();
        updateResultFilterOptions(); 
        await renderResults();
        renderJudgingSidebar(); 
        showToast(existingEval ? translate('dyn_str_2') : translate('dyn_str_3'));
        autoAdvance(); 
        return;
      } else {
        console.warn('Supabase save failed, engaging offline queue:', error);
      }
    } catch (netErr) {
      console.warn('Network exception while saving, engaging offline queue:', netErr);
    }
  }

  // Offline / Network Failure Fallback Engine
  if (existingEval) {
    const idx = evaluations.findIndex(e => e.student_id === studentId && e.judge_id === currentUserId);
    evaluation.created_at = new Date().toISOString();
    evaluation.id = existingEval.id;
    evaluations[idx] = evaluation;
  } else {
    evaluation.created_at = new Date().toISOString();
    evaluation.id = crypto.randomUUID();
    evaluations.unshift(evaluation);
  }
  
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
  enqueueOfflineEvaluation(evaluation, !!existingEval);
  updateResultFilterOptions();
  await renderResults();
  renderJudgingSidebar();
  showToast(translate('sync-offline-saved'), 'info');
  autoAdvance();
}

// ===== TIMER LOGIC =====

function broadcastStageTimer(isRunning) {
  try {
    if (!currentChannel) return;
    const select = document.getElementById('student-select');
    const currentStudentId = select ? select.value : null;
    const currentStudent = roster.find(s => String(s.id) === String(currentStudentId));

    const chimesCheckbox = document.getElementById('cfg-timer-chimes');
    const chimesEnabled = chimesCheckbox ? chimesCheckbox.checked !== false : true;

    currentChannel.send({
      type: 'broadcast',
      event: 'stage-timer-sync',
      payload: {
        isRunning: !!isRunning,
        remaining: timerRemaining,
        studentName: currentStudent ? currentStudent.name : '',
        studentClass: currentStudent ? `${currentStudent.class_name || ''} ${currentStudent.section || ''}`.trim() : '',
        studentPhoto: currentStudent ? (currentStudent.photo_url || '') : '',
        chimesEnabled: chimesEnabled
      }
    });
  } catch (err) {
    console.warn('Stage timer broadcast failed:', err);
  }
}

function startTimer() {
  if (timerIsRunning) {
    clearInterval(timerInterval);
    timerIsRunning = false;
    document.getElementById('timer-start').textContent = 'Resume';
    broadcastStageTimer(false);
  } else {
    timerIsRunning = true;
    document.getElementById('timer-start').textContent = 'Pause';
    broadcastStageTimer(true);
    timerInterval = setInterval(() => {
      if (timerRemaining > 0) {
        timerRemaining--;
        updateTimerDisplay();

        if (timerRemaining === 30) {
          const judgeChimes = document.getElementById('cfg-judge-timer-chimes');
          if (judgeChimes && judgeChimes.checked) {
            playWebAudioChime('warning-30s');
          }
        }

        if (timerRemaining % 5 === 0 || timerRemaining <= 10) {
          broadcastStageTimer(true);
        }
      } else {
        clearInterval(timerInterval);
        timerIsRunning = false;
        document.getElementById('timer-start').textContent = 'Time Up';

        const judgeChimes = document.getElementById('cfg-judge-timer-chimes');
        if (judgeChimes && judgeChimes.checked) {
          playWebAudioChime('overtime');
        }

        broadcastStageTimer(false);
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerIsRunning = false;
  timerRemaining = defaultTimerDuration;
  document.getElementById('timer-start').textContent = 'Start';
  updateTimerDisplay();
  broadcastStageTimer(false);
}

function updateTimerDisplay() {
  const el = document.getElementById('timer-display');
  if (el) {
    const m = Math.floor(timerRemaining / 60);
    const s = timerRemaining % 60;
    el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
}

// ===== USER MANAGEMENT =====

async function loadAllCustomUsers() {
  const supabase = getSupabase();
  if (!supabase) return;
  
  // Ensure competitions are loaded for mapping names
  if (competitions.length === 0) {
    const { data: compData } = await supabase.from('competitions').select('*');
    if (compData) competitions = compData;
  }

  let query = supabase.from('custom_users').select('*').order('username');
  
  // If user is admin, show ALL users. Otherwise, filter by current competition.
  if (userRole !== 'admin') {
    query = query.eq('competition_id', currentCompetitionId);
  }

  const { data, error } = await query;
  if (!error) allCustomUsers = data || [];
}

function renderRolePanel() {
  const container = document.getElementById('role-users-list');
  if (!container) return;
  
  container.innerHTML = allCustomUsers.map(u => {
    const comp = competitions.find(c => c.id === u.competition_id);
    const compName = comp ? comp.name : (u.role === 'admin' ? 'Global System' : 'Not Assigned');
    
    return `
      <div class="user-card" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 8px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="user-info-name" style="font-weight: 600;">${escapeHtml(u.username)}</span>
            <span class="role-badge ${u.role}" style="font-size: 0.7rem; padding: 2px 8px; border-radius: 12px; text-transform: uppercase;">${u.role}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
            <span style="font-weight: 600; color: var(--primary);">Competition:</span> ${escapeHtml(compName)}
          </div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="btn btn-secondary" style="padding: 4px 10px; font-size: 0.8rem; border-color: var(--primary); color: var(--primary);" onclick="openJudgeQrPass('${u.id}')">📱 QR Pass</button>
          <button class="btn" style="padding: 4px 12px; font-size: 0.8rem; background: rgba(79, 70, 229, 0.1); color: var(--primary); border: 1px solid rgba(79, 70, 229, 0.2);" onclick="startEditUser('${u.id}')">Edit</button>
          <button class="btn btn-logout" style="padding: 4px 12px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);" onclick="deleteCustomUser('${u.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('') || '<p class="empty-state-text">No custom users yet.</p>';
}

function startEditUser(id) {
  const user = allCustomUsers.find(u => u.id === id);
  if (!user) return;
  
  editingUserId = id;
  document.getElementById('new-user-username').value = user.username;
  document.getElementById('new-user-role').value = user.role;
  document.getElementById('new-user-password').value = '';
  document.getElementById('new-user-password').placeholder = '(Leave blank to keep current)';
  
  document.getElementById('user-form-title').textContent = 'Edit User: ' + user.username;
  document.getElementById('create-user-btn').textContent = 'Update User';
  document.getElementById('user-cancel-btn').style.display = 'block';
  
  document.getElementById('user-form-title').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditUser() {
  editingUserId = null;
  document.getElementById('new-user-username').value = '';
  document.getElementById('new-user-role').value = 'judge';
  document.getElementById('new-user-password').value = '';
  document.getElementById('new-user-password').placeholder = 'Password *';
  
  document.getElementById('user-form-title').textContent = 'Create New User';
  document.getElementById('create-user-btn').textContent = 'Create User';
  document.getElementById('user-cancel-btn').style.display = 'none';
}

async function createCustomUser() {
  const username = document.getElementById('new-user-username').value.trim();
  const password = document.getElementById('new-user-password').value;
  const role = document.getElementById('new-user-role').value;
  
  const competitionId = document.getElementById('new-user-competition').value;

  if (!username) return showToast(translate('dyn_str_6'), 'error');
  if (!editingUserId && !password) return showToast(translate('dyn_str_7'), 'error');
  
  if (role === 'judge' && !competitionId) {
    return showToast('Please assign the judge to a competition', 'error');
  }

  const supabase = getSupabase();
  if (!supabase) return;

  const userData = { username, role };
  if (competitionId) {
    userData.competition_id = competitionId;
  }

  if (password) {
    userData.password_hash = await hashPassword(password);
  }

  try {
    if (editingUserId) {
      const { error } = await supabase.from('custom_users').update(userData).eq('id', editingUserId);
      if (error) throw error;
      showToast(translate('dyn_str_8'));
      cancelEditUser();
    } else {
      const { error } = await supabase.from('custom_users').insert([userData]);
      if (error) throw error;
      showToast(translate('dyn_str_9'));
      document.getElementById('new-user-username').value = '';
      document.getElementById('new-user-password').value = '';
    }
    await loadAllCustomUsers();
    renderRolePanel();
  } catch (err) {
    showToast((currentLang==='ar'?'خطأ: ':'Error: ') + err.message, 'error');
  }
}

async function deleteCustomUser(id) {
  if (!confirm(translate('msg-delete-user'))) return;
  const supabase = getSupabase();
  if (supabase) await supabase.from('custom_users').delete().eq('id', id);
  await loadAllCustomUsers();
  renderRolePanel();
}

// ===== ROSTER & STUDENTS =====

async function handleAddStudent(e) {
  e.preventDefault();
  const student = {
    competition_id: currentCompetitionId,
    number: document.getElementById('student-number').value.trim(),
    name: document.getElementById('student-name').value.trim(),
    class_name: document.getElementById('student-class').value.trim(),
    section: document.getElementById('student-section').value.trim() || null
  };
  
  if (!student.number || !student.name) return showToast(translate('dyn_str_10'), 'error');

  const supabase = getSupabase();
  try {
    let photoUrl = null;
    
    if (newStudentPhotoFile && supabase) {
      const safeName = newStudentPhotoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const fileName = `student_${Date.now()}_${safeName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner-photos')
        .upload(fileName, newStudentPhotoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('winner-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData?.publicUrl || null;
        student.photo_url = photoUrl;
      } else {
        console.error('Photo upload error:', uploadError);
        showToast((currentLang==='ar'?'خطأ في رفع الصورة: ':'Error uploading photo: ') + uploadError.message, 'error');
      }
    }

    if (editingStudentId) {
      if (supabase) {
        const { error } = await supabase.from('students').update(student).eq('id', editingStudentId);
        if (error) {
            console.error('Supabase update error details:', JSON.stringify(error, null, 2));
            throw error;
        }
      }
      const idx = roster.findIndex(s => s.id === editingStudentId);
      if (idx !== -1) {
        // Keep existing photo if a new one wasn't uploaded
        if (!student.photo_url) student.photo_url = roster[idx].photo_url;
        roster[idx] = { ...roster[idx], ...student };
      }
      showToast(translate('dyn_str_11'));
      cancelEditStudent();
    } else {
      if (supabase) {
        const { data, error } = await supabase.from('students').insert([student]).select().single();
        if (error) {
            console.error('Supabase insert error details:', JSON.stringify(error, null, 2));
            throw error;
        }
        roster.push(data);
      } else {
        student.id = crypto.randomUUID();
        roster.push(student);
      }
      showToast(translate('dyn_str_12'));
      e.target.reset();
      // Also reset the preview
      cancelEditStudent(); 
    }
    
    sortRoster();
    
    if (!supabase) localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    renderRoster();
    updateFilterDropdowns();
    populateStudentSelect();
    populateWinnerSelect();
  } catch (err) {
    showToast((currentLang==='ar'?'خطأ: ':'Error: ') + (err.message || 'Database error'), 'error');
  }
}

function startEditStudent(id) {
  const student = roster.find(s => s.id === id);
  if (!student) return;
  
  editingStudentId = id;
  document.getElementById('student-number').value = student.number || '';
  document.getElementById('student-name').value = student.name || '';
  document.getElementById('student-class').value = student.class_name || '';
  document.getElementById('student-section').value = student.section || '';
  
  document.getElementById('student-form-title').textContent = 'Edit Student: ' + student.name;
  document.getElementById('student-submit-btn').textContent = 'Update Student';
  document.getElementById('student-cancel-btn').style.display = 'block';

  // Photo preview
  const preview = document.getElementById('student-photo-preview');
  if (preview) {
    if (student.photo_url) {
      preview.src = student.photo_url;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
      preview.src = '';
    }
  }
  
  document.getElementById('student-form-title').scrollIntoView({ behavior: 'smooth' });
}

function cancelEditStudent() {
  editingStudentId = null;
  newStudentPhotoFile = null;
  document.getElementById('add-student-form').reset();
  const preview = document.getElementById('student-photo-preview');
  if (preview) {
    preview.src = '';
    preview.style.display = 'none';
  }
  document.getElementById('student-form-title').textContent = 'Add Student';
  document.getElementById('student-submit-btn').textContent = 'Add Student';
  document.getElementById('student-cancel-btn').style.display = 'none';
}

async function importStudents() {
  const fileInput = document.getElementById('csv-import');
  const importBtn = document.getElementById('import-btn');
  const file = fileInput.files[0];
  if (!file) return showToast(translate('dyn_str_13'), 'error');

  // Disable button to prevent double clicks
  const originalText = importBtn.textContent;
  importBtn.disabled = true;
  importBtn.textContent = currentLang === 'ar' ? 'جاري الاستيراد...' : 'Importing...';

  try {
    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const newStudents = [];
    
    // Existing numbers in roster for this competition
    const existingNumbers = new Set(roster.map(s => String(s.number)));
    let duplicatesSkipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(s => s.trim());
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const studentNumber = String(parts[0]);
        if (existingNumbers.has(studentNumber)) {
          duplicatesSkipped++;
          continue;
        }
        
        newStudents.push({
          competition_id: currentCompetitionId,
          number: studentNumber,
          name: parts[1],
          class_name: parts[2] || '',
          section: parts[3] || ''
        });
        existingNumbers.add(studentNumber);
      }
    }

    if (newStudents.length === 0) {
      if (duplicatesSkipped > 0) {
        showToast(translate('msg-duplicates-skipped'), 'warning');
      } else {
        showToast(translate('dyn_str_14'), 'error');
      }
      return;
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('students').insert(newStudents).select();
      if (!error) {
        roster = [...roster, ...data];
        sortRoster();
        renderRoster();
        updateFilterDropdowns();
        populateStudentSelect();
        populateWinnerSelect();
        
        let msg = (currentLang==='ar'?'تم استيراد ':'Successfully imported ') + newStudents.length + (currentLang==='ar'?' طلاب':' students');
        if (duplicatesSkipped > 0) msg += ` (${duplicatesSkipped} ${translate('msg-duplicates-skipped')})`;
        showToast(msg);
        resetImportUI();
      } else {
        showToast(translate('dyn_str_15') + error.message, 'error');
      }
    } else {
      newStudents.forEach(s => s.id = crypto.randomUUID());
      roster = [...roster, ...newStudents];
      sortRoster();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
      renderRoster();
      updateFilterDropdowns();
      populateStudentSelect();
      populateWinnerSelect();
      
      let msg = (currentLang==='ar'?'تم استيراد ':'Successfully imported ') + newStudents.length + (currentLang==='ar'?' طلاب (بدون اتصال)':' students (Offline)');
      if (duplicatesSkipped > 0) msg += ` (${duplicatesSkipped} ${translate('msg-duplicates-skipped')})`;
      showToast(msg);
      resetImportUI();
    }
  } catch (err) {
    console.error('Import error:', err);
    showToast('Error: ' + err.message, 'error');
  } finally {
    importBtn.disabled = (fileInput.files.length === 0);
    importBtn.textContent = originalText;
  }
}

function resetImportUI() {
  const fileInput = document.getElementById('csv-import');
  const fileNameDisplay = document.getElementById('file-name');
  const importBtn = document.getElementById('import-btn');
  
  if (fileInput) fileInput.value = '';
  if (fileNameDisplay) fileNameDisplay.textContent = '';
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.classList.remove('btn-login');
    importBtn.classList.add('btn-logout');
  }
}

// ===== DRAG AND DROP REORDERING =====

let draggedItemId = null;

function handleDragStart(e) {
    if (userRole !== 'admin') return;
    draggedItemId = e.currentTarget.dataset.id;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItemId);
}

function handleDragOver(e) {
    if (userRole !== 'admin') return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.currentTarget;
    if (target && target !== e.target && target.classList.contains('student-card')) {
        target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDragEnd(e) {
    document.querySelectorAll('.student-card').forEach(el => {
        el.classList.remove('dragging');
        el.classList.remove('drag-over');
    });
}

async function handleDrop(e) {
    e.preventDefault();
    const targetId = e.currentTarget.dataset.id;
    e.currentTarget.classList.remove('drag-over');

    if (!draggedItemId || draggedItemId === targetId) return;

    const draggedIdx = roster.findIndex(s => s.id === draggedItemId);
    const targetIdx = roster.findIndex(s => s.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    // Move item in array
    const [removed] = roster.splice(draggedIdx, 1);
    roster.splice(targetIdx, 0, removed);

    // Update sort_order for all students based on new index
    roster.forEach((student, index) => {
        student.sort_order = index;
    });

    renderRoster();
    showToast(translate('dyn_str_16'));

    // Persist to Supabase
    const supabase = getSupabase();
    if (supabase) {
        // Prepare bulk update
        const updates = roster.map(s => ({
            id: s.id,
            sort_order: s.sort_order,
            number: s.number, // Required for upsert or if we use multiple updates
            name: s.name
        }));

        // Upsert is often the easiest way for bulk updates if we have the IDs
        const { error } = await supabase.from('students').upsert(updates);
        if (error) {
            console.error('Order persist error:', error);
            showToast(translate('dyn_str_17'), 'error');
        } else {
            showToast(translate('dyn_str_18'));
        }
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
        showToast(translate('dyn_str_19'));
    }
}

function getFilteredStudents() {
  const searchQuery = (document.getElementById('roster-search')?.value || '').toLowerCase();
  const classFilter = document.getElementById('filter-class')?.value || '';
  const sectionFilter = document.getElementById('filter-section')?.value || '';

  return roster.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery) || s.number.toLowerCase().includes(searchQuery);
    const matchesClass = !classFilter || s.class_name === classFilter;
    const matchesSection = !sectionFilter || s.section === sectionFilter;
    return matchesSearch && matchesClass && matchesSection;
  });
}

function updateFilterDropdowns() {
    const classSelect = document.getElementById('filter-class');
    const sectionSelect = document.getElementById('filter-section');
    if (!classSelect || !sectionSelect) return;

    const currentClass = classSelect.value;
    const currentSection = sectionSelect.value;

    // Use robust property extraction to handle potential nulls/undefined
    const classes = [...new Set(roster.map(s => s.class_name || s.class || '').filter(Boolean))].sort();
    const sections = [...new Set(roster.map(s => s.section || '').filter(Boolean))].sort();

    console.log(`Updating roster filters: ${classes.length} classes, ${sections.length} sections found.`);

    classSelect.innerHTML = '<option value="">' + translate('dyn_str_36') + '</option>' + 
        classes.map(c => `<option value="${escapeHtml(c)}" ${c === currentClass ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    
    sectionSelect.innerHTML = '<option value="">' + translate('dyn_str_37') + '</option>' + 
        sections.map(s => `<option value="${escapeHtml(s)}" ${s === currentSection ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
}

function renderRoster() {
  const list = document.getElementById('roster-list');
  if (!list) return;
  
  const filtered = getFilteredStudents();
  
  list.innerHTML = filtered.map(s => {
    const isEvaluated = evaluations.some(e => e.student_id === s.id && e.judge_id === currentUserId);
    const isChecked = selectedStudents.has(s.id) ? 'checked' : '';
    return `
      <li class="student-card" 
          draggable="${userRole === 'admin'}" 
          data-id="${s.id}"
          ondragstart="handleDragStart(event)" 
          ondragover="handleDragOver(event)" 
          ondragleave="handleDragLeave(event)" 
          ondragend="handleDragEnd(event)" 
          ondrop="handleDrop(event)">
        <div style="display:flex; align-items:center;">
          ${userRole === 'admin' ? `<input type="checkbox" class="custom-checkbox student-card-checkbox" value="${s.id}" ${isChecked} onchange="toggleStudentSelection(this)">` : ''}
          <div class="status-indicator ${isEvaluated ? 'status-done' : 'status-pending'}"></div>
          
          <!-- Student Thumbnail -->
          <div class="student-thumb-container" style="margin-right: 12px; width: 40px; height: 40px; min-width: 40px;">
            ${s.photo_url ? 
              `<img src="${s.photo_url}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; border: 2px solid var(--border);">` : 
              `<div style="width: 100%; height: 100%; border-radius: 50%; background: var(--bg); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: var(--text-muted); opacity: 0.5;">👤</div>`
            }
          </div>
          
          <div style="flex: 1;">
            <div class="student-name" style="font-weight: 600;">${escapeHtml(s.name)}</div>
            <div style="font-size:0.8rem; color:var(--text-muted)">${escapeHtml(s.class_name)} | ${escapeHtml(s.section)}</div>
          </div>
        </div>
        <div style="display:flex; gap:8px;">
           <button class="btn" style="padding:4px 8px; color:var(--primary); background:rgba(79, 70, 229, 0.05);" onclick="startEditStudent('${s.id}')">Edit</button>
           ${userRole === 'admin' ? `<button class="btn btn-logout" style="color:var(--danger); padding:4px 8px;" onclick="deleteStudent('${s.id}')">✕</button>` : ''}
        </div>
      </li>`;
  }).join('');
  
  updateBulkToolbar();
}

window.toggleStudentSelection = function(checkbox) {
    if (checkbox.checked) selectedStudents.add(checkbox.value);
    else selectedStudents.delete(checkbox.value);
    updateBulkToolbar();
};

function updateBulkToolbar() {
    if (userRole !== 'admin') return;
    const toolbar = document.getElementById('bulk-actions-toolbar');
    const selectAll = document.getElementById('select-all-students');
    const countDisplay = document.getElementById('bulk-selection-count');
    
    if (!toolbar) return;
    
    const filtered = getFilteredStudents();
    
    if (selectedStudents.size > 0) {
        toolbar.hidden = false;
        countDisplay.textContent = `${selectedStudents.size} selected`;
    } else {
        toolbar.hidden = true;
    }
    
    if (selectAll) {
        // Check if all VISIBLE students are selected
        const allVisibleSelected = filtered.length > 0 && filtered.every(s => selectedStudents.has(s.id));
        selectAll.checked = allVisibleSelected;
    }
}

// ===== RESULTS & HELPERS =====

function calculateTotal() {
  let total = 0;
  CRITERIA_KEYS.forEach(key => {
    const active = document.querySelector(`.score-pill-row[data-criteria="${key}"] .score-pill.active`);
    total += active ? parseInt(active.dataset.value, 10) : 0;
  });
  return total;
}

function calculateWeightedTotal() {
  let weightedSum = 0;
  let totalWeight = 0;
  CRITERIA_KEYS.forEach(key => {
    const active = document.querySelector(`.score-pill-row[data-criteria="${key}"] .score-pill.active`);
    const val = active ? parseInt(active.dataset.value, 10) : 0;
    const w = criteriaWeights[key] !== undefined ? criteriaWeights[key] : Math.round(100 / (CRITERIA_KEYS.length || 1));
    weightedSum += (val / 10) * w;
    totalWeight += w;
  });
  return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
}

function renderCriteriaManager() {
    const list = document.getElementById('cfg-criteria-list');
    const badge = document.getElementById('rubric-weight-total-badge');
    if (!list) return;

    if (CRITERIA_KEYS.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">' + translate('dyn_str_42') + '</p>';
        if (badge) badge.textContent = 'Total Weight: 0%';
        return;
    }

    let totalW = 0;
    list.innerHTML = CRITERIA_KEYS.map(key => {
        const w = criteriaWeights[key] !== undefined ? criteriaWeights[key] : Math.round(100 / CRITERIA_KEYS.length);
        totalW += parseInt(w, 10) || 0;
        return `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding: 12px; background: var(--bg); border-radius: var(--radius-sm); border: 1px solid var(--border); flex-wrap: wrap;">
            <div style="flex: 2; min-width: 180px;">
                <input type="text" class="form-input criteria-edit-input" data-key="${key}" value="${escapeHtml(criteriaLabels[key])}" style="padding: 6px 10px;">
            </div>
            <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 120px;">
                <label style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">Weight:</label>
                <input type="number" min="1" max="100" class="form-input criteria-weight-input" data-key="${key}" value="${w}" style="padding: 6px 10px; width: 70px;" oninput="updateCriteriaWeightTotal()">
                <span style="font-weight: 700; color: var(--primary);">%</span>
            </div>
            <button class="btn btn-logout" onclick="deleteCriterion('${key}')" style="color: var(--danger); border-color: var(--danger); padding: 6px 12px;">Delete</button>
        </div>
        `;
    }).join('') + `
        <button id="save-all-criteria-btn" class="btn btn-login" style="width: 100%; margin-top: 10px;">💾 Save Criteria & Weights</button>
    `;

    if (badge) {
        badge.textContent = `Total Weight: ${totalW}%`;
        badge.style.color = totalW === 100 ? 'var(--success)' : '#d97706';
    }

    const saveBtn = document.getElementById('save-all-criteria-btn');
    if (saveBtn) {
        saveBtn.onclick = saveAllCriteria;
    }
}

function updateCriteriaWeightTotal() {
    const inputs = document.querySelectorAll('.criteria-weight-input');
    let sum = 0;
    inputs.forEach(inp => sum += parseInt(inp.value || 0, 10));
    const badge = document.getElementById('rubric-weight-total-badge');
    if (badge) {
        badge.textContent = `Total Weight: ${sum}%`;
        badge.style.color = sum === 100 ? 'var(--success)' : '#d97706';
    }
}

function applyRubricPreset() {
    const select = document.getElementById('rubric-preset-select');
    if (!select) return;
    const val = select.value;
    if (!val || val === 'custom') return;

    const preset = RUBRIC_PRESETS[val];
    if (!preset) return;

    CRITERIA_KEYS = preset.criteria.map(c => c.id);
    criteriaLabels = {};
    criteriaWeights = {};
    preset.criteria.forEach(c => {
        criteriaLabels[c.id] = c.label;
        criteriaWeights[c.id] = c.weight;
    });

    const stored = localStorage.getItem(SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};
    settings.criteria = preset.criteria.map(c => ({ id: c.id, label: c.label }));
    settings.criteriaWeights = criteriaWeights;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToSupabase(settings);

    renderCriteriaMatrix();
    renderCriteriaManager();
    showToast(currentLang === 'ar' ? `✨ تم تطبيق النموذج: ${preset.name}` : `✨ Applied preset: ${preset.name}`, 'success');
}

async function saveAllCriteria() {
    const inputs = document.querySelectorAll('.criteria-edit-input');
    const weightInputs = document.querySelectorAll('.criteria-weight-input');
    const newCriteria = [];
    const newWeights = {};

    inputs.forEach(input => {
        const key = input.dataset.key;
        const label = input.value.trim() || 'Untitled Criterion';
        newCriteria.push({ id: key, label });
    });

    weightInputs.forEach(wInput => {
        const key = wInput.dataset.key;
        newWeights[key] = parseInt(wInput.value, 10) || 0;
    });

    const stored = localStorage.getItem(SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};
    settings.criteria = newCriteria;
    settings.criteriaWeights = newWeights;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToSupabase(settings);

    CRITERIA_KEYS = newCriteria.map(c => c.id);
    criteriaLabels = {};
    newCriteria.forEach(c => criteriaLabels[c.id] = c.label);
    criteriaWeights = newWeights;

    renderCriteriaMatrix();
    renderCriteriaManager();
    showToast(translate('dyn_str_20'));
}

async function addTodoCriterion() {
    const input = document.getElementById('cfg-new-criterion-label');
    const label = input.value.trim();
    if (!label) return showToast(translate('dyn_str_21'), 'error');

    const id = 'crit_' + Date.now();
    
    CRITERIA_KEYS.push(id);
    criteriaLabels[id] = label;

    const stored = localStorage.getItem(SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};
    const currentCriteria = CRITERIA_KEYS.map(key => ({ id: key, label: criteriaLabels[key] }));
    settings.criteria = currentCriteria;
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToSupabase(settings);
    
    input.value = '';
    renderCriteriaMatrix();
    renderCriteriaManager();
    showToast(translate('dyn_str_22'));
}

async function deleteCriterion(id) {
    if (!confirm('Are you sure you want to delete this criterion? Old evaluations will still keep their total scores, but this row will vanish from current evaluations.')) return;

    CRITERIA_KEYS = CRITERIA_KEYS.filter(k => k !== id);
    delete criteriaLabels[id];

    const stored = localStorage.getItem(SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};
    settings.criteria = CRITERIA_KEYS.map(key => ({ id: key, label: criteriaLabels[key] }));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToSupabase(settings);

    renderCriteriaMatrix();
    renderCriteriaManager();
    showToast(translate('dyn_str_23'));
}

function renderResults(searchQuery = '') {
  const tbody = document.getElementById('results-tbody');
  const thead = document.getElementById('results-thead');
  if (!tbody || !thead) return;

  const query = (searchQuery || '').toLowerCase();

  // Reset and set headers FIRST
  if (resultsViewMode === 'highest') {
    thead.innerHTML = `
      <tr>
        <th style="width: 80px;">Rank</th>
        <th>Student Name</th>
        <th>Class</th>
        <th>Section</th>
        <th style="width: 80px; text-align: center;">Average</th>
        <th style="width: 80px; text-align: center;">Highest</th>
        <th style="width: 100px; text-align: center;">Details</th>
      </tr>
    `;
  } else {
    thead.innerHTML = `
      <tr>
        <th style="width: 140px;">Time</th>
        <th>Student Name</th>
        <th style="width: 100px;">Class</th>
        <th style="width: 80px;">Sect.</th>
        <th style="width: 140px;">Judge</th>
        <th style="width: 80px; text-align: center;">Score</th>
        <th>Feedback</th>
      </tr>
    `;
  }

  if (resultsViewMode === 'highest') {
    const aggregated = getAggregatedResults();
    const filtered = aggregated.filter(r => {
      const matchesSearch = (r.student_name || '').toLowerCase().includes(query);
      const matchesGrade = !resultsGradeFilter || r.class_name === resultsGradeFilter;
      const matchesSection = !resultsSectionFilter || r.section === resultsSectionFilter;
      return matchesSearch && matchesGrade && matchesSection;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">' + translate('dyn_str_38') + '</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map((r, i) => {
      let rankText = i + 1;
      let rankClass = '';
      if (i === 0) rankClass = 'rank-1';
      else if (i === 1) rankClass = 'rank-2';
      else if (i === 2) rankClass = 'rank-3';
      if (i < 3) rankText = `<div class="rank-badge ${rankClass}">${i+1}</div>`;

      return `
          <td>${rankText}</td>
          <td style="font-weight:600;">${escapeHtml(r.student_name)}</td>
          <td>${escapeHtml(r.class_name)}</td>
          <td>${escapeHtml(r.section)}</td>
          <td class="total-cell" style="text-align:center; font-weight:700; color:var(--primary);">${r.average_total}</td>
          <td style="text-align:center; font-weight:600; color:var(--text-muted);">${r.highest_total}</td>
          <td style="text-align:center;">
            <div style="display:inline-flex; gap:6px; justify-content:center;">
              <button class="btn btn-logout" style="padding:4px 10px; font-size:0.8rem;" onclick="toggleDetails('${r.student_id}')">View</button>
              <button class="btn cert-btn-table" style="padding:4px 10px; font-size:0.8rem;" onclick="openStudentCertificate('${r.student_id}', ${i+1})">🎓 Cert</button>
                    <button class="btn report-btn-table" style="padding:4px 10px; font-size:0.8rem; margin-inline-start: 4px;" onclick="openStudentReportCard('${r.student_id}', ${i+1})" title="Student Report Card">📄 ${translate('btn-view-report')}</button>
            </div>
          </td>
        </tr>
        <tr id="details-${r.student_id}" hidden>
          <td colspan="8" style="padding:0;">
            <div style="padding:16px; background:var(--primary-light); margin:8px; border-radius:var(--radius-sm);">
              <h4 style="margin-bottom:12px; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; color:var(--primary);">Individual Evaluations</h4>
              ${r.all_evaluations.map((e, idx) => `
                  <div style="margin-bottom:12px; ${idx < r.all_evaluations.length - 1 ? 'border-bottom:1px solid rgba(0,0,0,0.05); padding-bottom:12px;' : ''}">
                      <div style="display:flex; justify-content:space-between; align-items:center;">
                          <div>
                               <strong style="display:block; font-size:1rem;">Score: ${e.total}/${(Object.keys(e.scores || {}).length || CRITERIA_KEYS.length) * 10}</strong>
                              <span style="font-size:0.8rem; color:var(--primary); font-weight:600;">Judge: ${escapeHtml(e.judge_name || 'Unknown')}</span>
                          </div>
                          <small style="color:var(--text-muted);">${new Date(e.created_at).toLocaleDateString()} ${new Date(e.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                      </div>
                      <p style="margin-top:8px; font-size:0.9rem; line-height:1.4; color:var(--text); background:rgba(255,255,255,0.5); padding:8px; border-radius:4px;">
                          ${escapeHtml(e.comments || 'No feedback provided.')}
                      </p>
                  </div>
              `).join('')}
            </div>
          </td>
        </tr>
      `;
    }).join('');

  } else {
    const filteredEvaluations = evaluations.filter(e => {
      const sName = (e.student_name || '').toLowerCase();
      const matchesSearch = sName.includes(query);
      const matchesGrade = !resultsGradeFilter || e.class_name === resultsGradeFilter;
      const matchesSection = !resultsSectionFilter || e.section === resultsSectionFilter;
      return matchesSearch && matchesGrade && matchesSection;
    }).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    if (filteredEvaluations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">' + translate('dyn_str_39') + '</td></tr>';
      return;
    }

    tbody.innerHTML = filteredEvaluations.map(e => {
      const tStr = new Date(e.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      const dStr = new Date(e.created_at).toLocaleDateString([], {month: 'short', day: 'numeric'});
      return `
        <tr>
          <td style="font-size: 0.8rem; color: var(--text-muted);">${dStr}, ${tStr}</td>
          <td style="font-weight: 600;">${escapeHtml(e.student_name)}</td>
          <td>${escapeHtml(e.class_name || '-')}</td>
          <td>${escapeHtml(e.section || '-')}</td>
          <td style="font-size: 0.85rem; color: var(--primary); font-weight: 600;">${escapeHtml(e.judge_name || 'Judge')}</td>
          <td style="text-align:center; font-weight:700; color:var(--primary);">${e.total}/60</td>
          <td style="font-size: 0.85rem; color: var(--text); font-style: italic;">
            ${e.comments ? `"${escapeHtml(e.comments)}"` : '<span style="color:var(--border);">No comment</span>'}
          </td>
        </tr>
      `;
    }).join('');
  }
}

function getAggregatedResults() {
  const studentEvals = {};
  evaluations.forEach(e => {
    if (!studentEvals[e.student_id]) studentEvals[e.student_id] = { ...e, all_evaluations: [], highest_total: 0, sum_total: 0 };
    studentEvals[e.student_id].all_evaluations.push(e);
    studentEvals[e.student_id].sum_total += e.total;
    if (e.total > studentEvals[e.student_id].highest_total) studentEvals[e.student_id].highest_total = e.total;
  });
  
  const maxPossible = (CRITERIA_KEYS.length || 6) * 10;
  return Object.values(studentEvals).map(r => {
    const avg = (r.sum_total / r.all_evaluations.length);
    const weightedPct = maxPossible > 0 ? ((avg / maxPossible) * 100).toFixed(1) : '0';
    return {
      ...r,
      average_total: avg.toFixed(1),
      weighted_percent: weightedPct
    };
  }).sort((a,b) => parseFloat(b.average_total) - parseFloat(a.average_total) || b.highest_total - a.highest_total);
}

function updateResultFilterOptions() {
    const gradeSelect = document.getElementById('results-grade-filter');
    const sectionSelect = document.getElementById('results-section-filter');
    if (!gradeSelect || !sectionSelect) return;

    const grades = new Set();
    const sections = new Set();

    evaluations.forEach(e => {
        if (e.class_name) grades.add(e.class_name);
        if (e.section) sections.add(e.section);
    });

    const currentGrade = gradeSelect.value;
    const currentSection = sectionSelect.value;

    gradeSelect.innerHTML = '<option value="">' + translate('dyn_str_40') + '</option>' + 
        Array.from(grades).sort().map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
    
    sectionSelect.innerHTML = '<option value="">' + translate('dyn_str_37') + '</option>' + 
        Array.from(sections).sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

    gradeSelect.value = grades.has(currentGrade) ? currentGrade : "";
    sectionSelect.value = sections.has(currentSection) ? currentSection : "";
}

async function exportToCSV() {
  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) return showToast(translate('dyn_str_24'), 'error');
  let csv = 'Rank,Number,Name,Class,Average Score,Highest Score,Evaluations Count\n';
  aggregated.forEach((r, i) => {
    csv += `${i+1},${r.student_number},"${r.student_name}",${r.class_name},${r.average_total},${r.highest_total},${r.all_evaluations.length}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `taqeem-results-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'tedtalk_salt_2024');
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function toggleDetails(id) {
    const el = document.getElementById('details-' + id);
    if (el) el.hidden = !el.hidden;
}

function populateStudentSelect() {
  const select = document.getElementById('student-select');
  if (!select) return;
  select.innerHTML = '<option value="">' + translate('dyn_str_41') + '</option>' + 
    roster.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
}

function bindAuthEvents() {
  const form = document.getElementById('login-form');
  if (form) form.onsubmit = (e) => { e.preventDefault(); handleLogin(); };
}

function bindAppEvents() {
  document.querySelectorAll('.tab-bar .tab').forEach(tab => tab.onclick = () => switchTab(tab.dataset.tab));
  document.querySelectorAll('.sub-tab-bar .sub-tab').forEach(tab => tab.onclick = () => switchSubTab(tab.dataset.subtab));
  bindWinnerEvents();
  initVoiceDictation();

  const batchCertBtn = document.getElementById('batch-cert-btn');
  if (batchCertBtn) batchCertBtn.onclick = generateBatchCertificates;
  
  const startBtn = document.getElementById('timer-start');
  if (startBtn) startBtn.onclick = startTimer;
  
  const resetBtn = document.getElementById('timer-reset');
  if (resetBtn) resetBtn.onclick = resetTimer;

  // Event delegation for dynamic score pills
  const criteriaContainer = document.getElementById('criteria-container');
  if (criteriaContainer) {
    criteriaContainer.onclick = (e) => {
        const pill = e.target.closest('.score-pill');
        if (!pill) return;
        
        const row = pill.closest('.score-pill-row');
        row.querySelectorAll('.score-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        
        const totalMax = CRITERIA_KEYS.length * 10;
        const rawScore = calculateTotal();
        const weightedScore = calculateWeightedTotal().toFixed(1);
        document.getElementById('total-score').textContent = `${rawScore} / ${totalMax} (${weightedScore}%)`;
    };
  }

  const rosterSearch = document.getElementById('roster-search');
  if (rosterSearch) rosterSearch.oninput = () => renderRoster();

  const filterClass = document.getElementById('filter-class');
  if (filterClass) filterClass.onchange = () => renderRoster();

  const filterSection = document.getElementById('filter-section');
  if (filterSection) filterSection.onchange = () => renderRoster();
  
  const resultsSearch = document.getElementById('results-search');
  if (resultsSearch) resultsSearch.oninput = e => renderResults(e.target.value);
  
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) saveSettingsBtn.onclick = () => {
    const duration = parseInt(document.getElementById('settings-timer-duration').value);
    if (!isNaN(duration)) {
      defaultTimerDuration = duration;
      const stored = localStorage.getItem(SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};
      settings.timerDuration = duration;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      syncSettingsToSupabase(settings);

      // Update timer visibility
      const timerCard = document.querySelector('.timer-card');
      if (timerCard) {
          timerCard.style.display = (Number(duration) === 0) ? 'none' : '';
      }
      
      resetTimer();
      showToast(translate('dyn_str_25'));
    }
  };

  // Logo upload: live preview + base64 storage
  const logoUpload = document.getElementById('cfg-logo-upload');
  if (logoUpload) {
    logoUpload.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        document.getElementById('cfg-logo-preview').src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
  }

  // Logo reset
  const logoReset = document.getElementById('cfg-logo-reset');
  if (logoReset) {
    logoReset.onclick = () => {
      document.getElementById('cfg-logo-preview').src = 'icons/logo.png';
      if (logoUpload) logoUpload.value = '';
    };
  }

  // Color picker — live hex display
  const colorPicker = document.getElementById('cfg-primary-color');
  if (colorPicker) {
    colorPicker.oninput = (e) => {
      document.getElementById('cfg-color-hex').textContent = e.target.value;
    };
  }

  // Color reset
  const colorReset = document.getElementById('cfg-color-reset');
  if (colorReset) {
    colorReset.onclick = () => {
      const defaultColor = '#4f46e5';
      colorPicker.value = defaultColor;
      document.getElementById('cfg-color-hex').textContent = defaultColor;
    };
  }

  // Save branding
  const saveBrandingBtn = document.getElementById('save-branding-btn');
  if (saveBrandingBtn) {
    saveBrandingBtn.onclick = () => {
      const stored = localStorage.getItem(SETTINGS_KEY);
      const settings = stored ? JSON.parse(stored) : {};

      const nameVal = document.getElementById('cfg-app-name').value.trim();
      const subtitleVal = document.getElementById('cfg-app-subtitle').value.trim();
      const colorVal = document.getElementById('cfg-primary-color').value;
      const preview = document.getElementById('cfg-logo-preview');

      if (nameVal) settings.appName = nameVal;
      else delete settings.appName;

      if (subtitleVal) settings.appSubtitle = subtitleVal;
      else delete settings.appSubtitle;

      settings.primaryColor = colorVal;

      // Save logo if a new file was selected
      const logoFile = document.getElementById('cfg-logo-upload').files[0];
      if (logoFile) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          settings.logoDataUrl = ev.target.result;
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
          syncSettingsToSupabase(settings);
          applyBranding();
          showToast(translate('dyn_str_26'));
        };
        reader.readAsDataURL(logoFile);
      } else if (preview.src.includes('icons/logo.png') || preview.src.endsWith('icons/logo.png')) {
        // Reset logo
        delete settings.logoDataUrl;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        syncSettingsToSupabase(settings);
        applyBranding();
        showToast(translate('dyn_str_26'));
      } else {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        syncSettingsToSupabase(settings);
        applyBranding();
        showToast(translate('dyn_str_26'));
      }
    };
  }

  // Criteria Management Events
  const addCriterionBtn = document.getElementById('cfg-add-criterion-btn');
  if (addCriterionBtn) {
    addCriterionBtn.onclick = addTodoCriterion;
  }

  const evalForm = document.getElementById('evaluation-form');
  if (evalForm) evalForm.onsubmit = (e) => { e.preventDefault(); saveEvaluation(); };
  
  const resultsToggle = document.getElementById('results-view-toggle');
  if (resultsToggle) {
    resultsToggle.onchange = (e) => { 
      resultsViewMode = e.target.value; 
      renderResults(); 
      showToast('View mode: ' + (resultsViewMode === 'highest' ? 'Leaderboard' : 'Raw Entry Log'));
    };
  }
  
  const gradeFilter = document.getElementById('results-grade-filter');
  if (gradeFilter) {
      gradeFilter.onchange = (e) => {
          resultsGradeFilter = e.target.value;
          renderResults();
      };
  }

  const sectionFilter = document.getElementById('results-section-filter');
  if (sectionFilter) {
      sectionFilter.onchange = (e) => {
          resultsSectionFilter = e.target.value;
          renderResults();
      };
  }

  const exportBtn = document.getElementById('export-csv-btn');
  if (exportBtn) exportBtn.onclick = exportToCSV;

  const resetFiltersBtn = document.getElementById('clear-results-filters');
  if (resetFiltersBtn) {
    resetFiltersBtn.onclick = () => {
      resultsGradeFilter = '';
      resultsSectionFilter = '';
      const gradeSel = document.getElementById('results-grade-filter');
      const sectionSel = document.getElementById('results-section-filter');
      if (gradeSel) gradeSel.value = '';
      if (sectionSel) sectionSel.value = '';
      renderResults();
      showToast(translate('dyn_str_27'));
    };
  }

  const select = document.getElementById('student-select');
  if (select) {
      select.onchange = (e) => {
          const id = e.target.value;
          if (id) selectStudentForJudging(id);
      };
  }

  const clearBtn = document.getElementById('clear-data-btn');
  if (clearBtn) clearBtn.onclick = async () => {
      if (prompt(translate('msg-clear-confirm')) === 'DELETE') {
          const supabase = getSupabase();
          if (supabase) {
              await supabase.from('evaluations').delete().eq('competition_id', currentCompetitionId);
          }
          evaluations = [];
          localStorage.removeItem(EVALUATIONS_KEY);
          renderResults();
          showToast(translate('dyn_str_28'));
      }
  };

  const addStudentForm = document.getElementById('add-student-form');
  if (addStudentForm) addStudentForm.onsubmit = handleAddStudent;

  // Student Photo Upload Event
  const studentPhotoInput = document.getElementById('student-photo-upload');
  if (studentPhotoInput) {
    studentPhotoInput.onclick = function() { this.value = null; };
    studentPhotoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      newStudentPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('student-photo-preview');
        if (preview) {
          preview.src = ev.target.result;
          preview.style.display = 'inline-block'; // Use inline-block for flex alignment
          preview.style.opacity = '1';
        }
      };
      reader.readAsDataURL(file);
    };
  }

  // Bulk Student Photo Upload Event
  const bulkPhotoInput = document.getElementById('bulk-student-photo-upload');
  if (bulkPhotoInput) {
    bulkPhotoInput.onclick = function() { this.value = null; };
    bulkPhotoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      newBulkStudentPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('bulk-student-photo-preview');
        if (preview) {
          preview.src = ev.target.result;
          preview.style.display = 'inline-block';
          preview.style.opacity = '1';
        }
      };
      reader.readAsDataURL(file);
    };
  }

  const selectAllCheckbox = document.getElementById('select-all-students');
  if (selectAllCheckbox) {
      selectAllCheckbox.onchange = (e) => {
          const filtered = getFilteredStudents();
          if (e.target.checked) {
              filtered.forEach(s => selectedStudents.add(s.id));
          } else {
              filtered.forEach(s => selectedStudents.delete(s.id));
          }
          renderRoster();
      };
  }

  const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
  if (bulkDeleteBtn) {
      bulkDeleteBtn.onclick = async () => {
          if (!confirm(`Are you sure you want to delete ${selectedStudents.size} students?`)) return;
          const ids = Array.from(selectedStudents);
          const supabase = getSupabase();
          if (supabase) {
              const { error } = await supabase.from('students').delete().in('id', ids);
              if (error) return showToast((currentLang==='ar'?'خطأ في الحذف: ':'Error deleting: ') + error.message, 'error');
          }
          roster = roster.filter(s => !selectedStudents.has(s.id));
          selectedStudents.clear();
          if (!supabase) localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
          renderRoster();
          populateStudentSelect();
          populateWinnerSelect();
          showToast(translate('dyn_str_29'));
      };
  }

  const bulkEditBtn = document.getElementById('bulk-edit-btn');
  if (bulkEditBtn) {
      bulkEditBtn.onclick = () => {
          document.getElementById('bulk-edit-class').value = '';
          document.getElementById('bulk-edit-section').value = '';
          newBulkStudentPhotoFile = null;
          const photoInput = document.getElementById('bulk-student-photo-upload');
          if (photoInput) photoInput.value = '';
          const preview = document.getElementById('bulk-student-photo-preview');
          if (preview) { preview.src = ''; preview.style.display = 'none'; }
          document.getElementById('bulk-edit-modal').hidden = false;
      };
  }

  const bulkEditConfirmBtn = document.getElementById('bulk-edit-confirm-btn');
  if (bulkEditConfirmBtn) {
      bulkEditConfirmBtn.onclick = async () => {
          const newClass = document.getElementById('bulk-edit-class').value.trim();
          const newSection = document.getElementById('bulk-edit-section').value.trim();
          
          if (!newClass && !newSection && !newBulkStudentPhotoFile) {
              document.getElementById('bulk-edit-modal').hidden = true;
              return;
          }

          const ids = Array.from(selectedStudents);
          if (ids.length === 0) {
              showToast(translate('dyn_str_30'), 'error');
              return;
          }

          const updates = {};
          if (newClass) updates.class_name = newClass;
          if (newSection) updates.section = newSection;

          const supabase = getSupabase();
          const originalText = bulkEditConfirmBtn.textContent;
          bulkEditConfirmBtn.disabled = true;
          bulkEditConfirmBtn.textContent = 'Updating...';
          
          try {
              console.log('Starting bulk update for IDs:', ids);
              if (newBulkStudentPhotoFile && supabase) {
                  console.log('Uploading bulk photo:', newBulkStudentPhotoFile.name);
                  const safeName = newBulkStudentPhotoFile.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
                  const fileName = `bulk_student_${Date.now()}_${safeName}`;
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('winner-photos')
                    .upload(fileName, newBulkStudentPhotoFile, {
                      cacheControl: '3600',
                      upsert: false
                    });

                  if (!uploadError) {
                    const { data: urlData } = supabase.storage
                      .from('winner-photos')
                      .getPublicUrl(fileName);
                    
                    if (urlData && urlData.publicUrl) {
                      updates.photo_url = urlData.publicUrl;
                      console.log('Bulk photo upload success, url:', updates.photo_url);
                    } else {
                      console.error('Failed to get public URL for uploaded photo');
                      throw new Error('Failed to retrieve photo URL after upload');
                    }
                  } else {
                    console.error('Bulk photo upload error:', uploadError);
                    throw uploadError;
                  }
              }

              if (Object.keys(updates).length > 0) {
                  if (supabase) {
                      console.log('Applying updates to Supabase:', updates);
                      const { error } = await supabase.from('students').update(updates).in('id', ids);
                      if (error) throw error;
                  }
                  
                  // Update local state
                  ids.forEach(id => {
                      const student = roster.find(s => s.id === id);
                      if (student) {
                          if (newClass) student.class_name = newClass;
                          if (newSection) student.section = newSection;
                          if (updates.photo_url) student.photo_url = updates.photo_url;
                      }
                  });
              }
              
              if (!supabase) localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
              
              selectedStudents.clear();
              newBulkStudentPhotoFile = null;
              
              renderRoster();
              updateFilterDropdowns();
              populateStudentSelect();
              populateWinnerSelect();
              
              document.getElementById('bulk-edit-modal').hidden = true;
              showToast((currentLang==='ar'?'تم تحديث ':'Updated ') + ids.length + (currentLang==='ar'?' طلاب بنجاح!':' students successfully!'));
          } catch (err) {
              console.error('Bulk update error details:', err);
              showToast((currentLang==='ar'?'خطأ في التحديث: ':'Error updating: ') + (err.message || 'Unknown error'), 'error');
          } finally {
              bulkEditConfirmBtn.disabled = false;
              bulkEditConfirmBtn.textContent = originalText;
          }
      };
  }
  
  const csvImport = document.getElementById('csv-import');
  const importBtn = document.getElementById('import-btn');
  const dropZone = document.getElementById('drop-zone');
  const fileNameDisplay = document.getElementById('file-name');

  const updateFileSelection = (file) => {
    if (file) {
      fileNameDisplay.textContent = file.name;
      importBtn.disabled = false;
      importBtn.classList.remove('btn-logout');
      importBtn.classList.add('btn-login');
    }
  };

  if (csvImport) {
    csvImport.onchange = (e) => {
      updateFileSelection(e.target.files[0]);
    };
  }

  if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file && file.name.endsWith('.csv')) {
        csvImport.files = dt.files; 
        updateFileSelection(file);
      } else {
        showToast(translate('dyn_str_31'), 'error');
      }
    }, false);
  }

  const importBtnEl = document.getElementById('import-btn');
  if (importBtnEl) importBtnEl.onclick = importStudents;
  
  const createUserBtn = document.getElementById('create-user-btn');
  if (createUserBtn) createUserBtn.onclick = createCustomUser;
  
  const createCompBtn = document.getElementById('create-comp-btn');
  if (createCompBtn) {
    createCompBtn.onclick = async () => {
      if (createCompBtn.disabled) return;

      const nameInput = document.getElementById('new-comp-name');
      const name = nameInput.value.trim();
      if (!name) return showToast('Please enter a competition name', 'error');
      
      const supabase = getSupabase();
      if (!supabase) return;
      
      createCompBtn.disabled = true;
      const originalText = createCompBtn.textContent;
      createCompBtn.textContent = currentLang === 'ar' ? 'جاري الإنشاء...' : 'Creating...';

      try {
        const { error } = await supabase.from('competitions').insert([{ name }]);
        if (error) throw error;
        showToast(currentLang === 'ar' ? 'تم إنشاء المسابقة' : 'Competition created');
        nameInput.value = '';
        renderCompetitionsTab();
      } catch (err) {
        showToast('Error: ' + err.message, 'error');
      } finally {
        createCompBtn.disabled = false;
        createCompBtn.textContent = originalText;
      }
    };
  }

  // Note: switch-comp-btn is already bound globally above bindAppEvents
  // Only bind if not already bound to avoid duplicate handlers
  const switchCompBtn = document.getElementById('switch-comp-btn');
  if (switchCompBtn && !switchCompBtn._bound) {
    switchCompBtn._bound = true;
    switchCompBtn.onclick = async () => {
      document.getElementById('app-container').hidden = true;
      document.getElementById('competition-view').hidden = false;
      document.getElementById('login-view').hidden = true;
      await loadCompetitions();
    };
  }
  
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.onclick = handleLogout;

  // Winner Announcement Controls
  bindWinnerEvents();

  const downloadTemplateBtn = document.getElementById('download-template-btn');
  if (downloadTemplateBtn) {
    downloadTemplateBtn.onclick = (e) => {
      e.preventDefault();
      downloadCSVTemplate();
    };
  }
}

// PRO TOOLS LOGIC
function renderJudgingSidebar() {
    const sidebar = document.getElementById('judging-sidebar');
    if (!sidebar) return;
    const currentId = document.getElementById('student-select').value;
    
    if (roster.length === 0) {
        sidebar.innerHTML = `
            <div class="judging-empty-state">
                <p>No students in roster.</p>
                <p style="font-size: 0.75rem; margin-top: 8px;">Go to "Setup" to add students.</p>
            </div>
        `;
        return;
    }
    
    sidebar.innerHTML = roster.map(s => {
        const isEval = evaluations.some(e => e.student_id === s.id && e.judge_id === currentUserId);
        const isActive = s.id === currentId;
        const isBlind = (localStorage.getItem('taqeem_blind_judging') === 'true') && (currentUserRole === 'judge');
        const displayName = isBlind ? `${translate('contestant-label')} #${s.number}` : escapeHtml(s.name);
        return `
            <div class="sidebar-student-item ${isActive ? 'active' : ''} ${isEval ? 'evaluated' : ''}" onclick="selectStudentForJudging('${s.id}')">
                <div style="display:flex; align-items:center;">
                    <div class="status-dot"></div>
                    <div>
                        <div style="font-weight:600;">${displayName} ${isBlind ? '<span class="blind-mode-badge" style="font-size:0.65rem; padding:1px 6px;">BLIND</span>' : ''}</div>
                        <div style="font-size:0.75rem; opacity:0.8;">${escapeHtml(s.class_name)} | ${escapeHtml(s.section)}</div>
                    </div>
                </div>
                ${isEval ? '<span style="color:var(--success); font-weight:bold;">✓</span>' : ''}
            </div>
        `;
    }).join('');
}

window.selectStudentForJudging = (id) => {
    const select = document.getElementById('student-select');
    if (select) {
        select.value = id;
        renderJudgingSidebar(); 
        const student = roster.find(s => s.id === id);
        const badge = document.getElementById('active-student-badge');
        
        // Restriction UI feedback
        const isEval = evaluations.some(e => e.student_id === id && e.judge_id === currentUserId);
        const saveBtn = document.querySelector('#evaluation-form button[type="submit"]');
        
        const isBlind = (localStorage.getItem('taqeem_blind_judging') === 'true') && (currentUserRole === 'judge');
        const isLocked = (localStorage.getItem('taqeem_score_locking') === 'true') && isEval && (currentUserRole === 'judge');
        const displayName = student ? (isBlind ? `${translate('contestant-label')} #${student.number}` : student.name) : '';
        if (badge) {
            badge.textContent = student ? `${translate('judging-label')}: ${displayName}` : '';
            if (isLocked) {
                badge.innerHTML += ` <span class="score-locked-badge" style="margin-inline-start:8px; font-size:0.75rem;">🔒 ${translate('score-locked')}</span>`;
            } else if (isEval) {
                badge.innerHTML += ` <span style="color:var(--danger); font-size:0.8rem; margin-inline-start:10px;">(Already Evaluated)</span>`;
            }
        }
        
        const details = document.getElementById('active-student-details');
        if (details) {
            details.textContent = student ? `${student.class_name || ''} • Section ${student.section || ''}` : '';
        }

        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = isEval ? 'Update Evaluation' : 'Save Evaluation';
            saveBtn.style.opacity = '1';
            saveBtn.style.cursor = 'pointer';
            if (isEval) {
              saveBtn.style.background = 'var(--warning)';
              saveBtn.style.borderColor = 'var(--warning)';
            } else {
              saveBtn.style.background = ''; // Revert to CSS default
              saveBtn.style.borderColor = '';
            }
        }

        resetEvaluationForm(false); 
        resetTimer();
    }
}

function autoAdvance() {
    const select = document.getElementById('student-select');
    let currentIndex = roster.findIndex(s => s.id === select.value);
    
    // Find the next student who hasn't been evaluated by THIS judge
    let nextIndex = -1;
    for (let i = currentIndex + 1; i < roster.length; i++) {
        const hasEval = evaluations.some(e => e.student_id === roster[i].id && e.judge_id === currentUserId);
        if (!hasEval) {
            nextIndex = i;
            break;
        }
    }

    if (nextIndex !== -1) {
        selectStudentForJudging(roster[nextIndex].id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showToast(translate('dyn_str_32'), 'success');
        resetEvaluationForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetEvaluationForm(fullReset = true) {
    if (fullReset) {
        document.getElementById('student-select').value = '';
        document.getElementById('active-student-badge').textContent = '';
    }
    document.querySelectorAll('.score-pill').forEach(p => p.classList.remove('active'));
    document.getElementById('evaluation-comments').value = '';
    document.getElementById('total-score').textContent = '0 / 60';
}

// Global function exports for inline HTML handlers
window.deleteStudent = async (id) => {
    if (!confirm(translate('msg-delete-student'))) return;
    const supabase = getSupabase();
    if (supabase) {
        await supabase.from('students').delete().eq('id', id);
    }
    roster = roster.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
    renderRoster();
    updateFilterDropdowns();
    populateStudentSelect();
    populateWinnerSelect();
};

window.deleteCustomUser = deleteCustomUser;
window.toggleDetails = toggleDetails;
window.selectStudentForJudging = selectStudentForJudging;
window.startEditStudent = startEditStudent;
window.cancelEditStudent = cancelEditStudent;
window.startEditUser = startEditUser;
window.cancelEditUser = cancelEditUser;

function downloadCSVTemplate() {
  const csv = 'Number,Name,Class,Section\n101,John Doe,Grade 10,A\n102,Jane Smith,Grade 10,B';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taqeem_students_template.csv';
  a.click();
}

function attachThemeToggle() {
    const attach = (btnId, iconId) => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.onclick = () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('taqeem_theme', newTheme);
                
                const iconTheme = newTheme === 'dark' ? '☀️' : '🌙';
                const icon1 = document.getElementById('theme-icon');
                const icon2 = document.getElementById('theme-icon-login');
                if (icon1) icon1.textContent = iconTheme;
                if (icon2) icon2.textContent = iconTheme;
            };
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const icon = document.getElementById(iconId);
            if (icon) icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    };
    attach('theme-toggle', 'theme-icon');
    attach('theme-toggle-login', 'theme-icon-login');
}

document.addEventListener('DOMContentLoaded', () => {
    bindCompetitionViewEvents();
    init();
    attachThemeToggle();
});

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  
  const icon = type === 'success' ? '✅' : '⚠️';
  toast.innerHTML = '<span>' + icon + '</span> <span>' + escapeHtml(message) + '</span>';

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function setUsernameInHeader() {
  const userDisplay = document.getElementById('current-username-display');
  if (userDisplay) {
    const username = localStorage.getItem('currentUsername') || 'User';
    userDisplay.textContent = username;
  }
}
setTimeout(setUsernameInHeader, 500);
window.addEventListener('hashchange', setUsernameInHeader);

function startSilentRefresh() {
  // Silent background refresh every 30 seconds
  setInterval(async () => {
    if (isAuthenticated) {
      const prevEvalCount = evaluations.length;
      await loadEvaluations();
      
      // If data has changed, refresh the relevant UI parts silently
      if (evaluations.length !== prevEvalCount) {
        if (currentTab === 'results') {
          renderResults(document.getElementById('results-search')?.value || '');
        }
        if (currentTab === 'judging') {
          renderJudgingSidebar();
        }
        updateResultFilterOptions();
      }
    }
  }, 30000); 
}

// ===== WINNER ANNOUNCEMENT ADMIN CONTROLS =====

let winnerPhotoFile = null;

function populateWinnerSelect() {
  const select = document.getElementById('winner-student-select');
  if (!select) return;
  
  // Keep the current selection if possible
  const currentVal = select.value;
  
  // Clear the select correctly
  select.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  
  if (!roster || roster.length === 0) {
    defaultOption.textContent = translate('dyn_str_44');
    select.appendChild(defaultOption);
    return;
  }

  defaultOption.textContent = translate('dyn_str_43');
  select.appendChild(defaultOption);

  const fragment = document.createDocumentFragment();
  roster.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    // Format label safely without innerHTML parsing risks
    const numberStr = s.number || '';
    const nameStr = s.name || '';
    const classStr = s.class_name || 'No Grade';
    const sectionStr = s.section || 'No Section';
    opt.textContent = `${nameStr} (${classStr}, ${sectionStr})`;
    fragment.appendChild(opt);
  });
  
  select.appendChild(fragment);
    
  if (currentVal) select.value = currentVal;
}

function bindWinnerEvents() {
  // Photo upload preview
  const photoInput = document.getElementById('winner-photo-upload');
  if (photoInput) {
    photoInput.onclick = function() { this.value = null; };
    photoInput.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      winnerPhotoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const preview = document.getElementById('winner-photo-preview');
        if (preview) {
          preview.src = ev.target.result;
          preview.style.display = 'inline-block';
          preview.style.opacity = '1';
        }
      };
      reader.readAsDataURL(file);
    };
  }

  // Push winner button
  const pushBtn = document.getElementById('push-winner-btn');
  if (pushBtn) {
    pushBtn.onclick = pushWinner;
  }

  // Push top 3 podium button
  const pushPodiumBtn = document.getElementById('push-podium-btn');
  if (pushPodiumBtn) {
    pushPodiumBtn.onclick = pushTop3Podium;
  }

  // Clear winner button
  const clearBtn = document.getElementById('clear-winner-btn');
  if (clearBtn) {
    clearBtn.onclick = clearWinnerDisplay;
  }

  // Auto-update preview when student is selected
  const winnerSelect = document.getElementById('winner-student-select');
  if (winnerSelect) {
    winnerSelect.onchange = (e) => {
      const studentId = e.target.value;
      const student = roster.find(s => s.id === studentId);
      const preview = document.getElementById('winner-photo-preview');
      
      if (!preview) return;

      if (winnerPhotoFile) {
        // If they already picked a manual file, don't revert to student photo
        return;
      }

      if (student && student.photo_url) {
        preview.src = student.photo_url;
        preview.style.display = 'inline-block';
        preview.style.opacity = '1';
      } else {
        preview.style.display = 'none';
        preview.src = '';
      }
    };
  }
}

async function pushWinner() {
  const select = document.getElementById('winner-student-select');
  if (!select || !select.value) {
    return showToast(translate('dyn_str_0'), 'error');
  }

  const student = roster.find(s => s.id === select.value);
  if (!student) return showToast('Student not found.', 'error');

  const pushBtn = document.getElementById('push-winner-btn');
  if (pushBtn) {
    pushBtn.disabled = true;
    pushBtn.textContent = '⏳ Pushing...';
  }

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not available');

    let photoUrl = null;

    // Upload photo if provided
    if (winnerPhotoFile) {
      const fileName = `winner_${Date.now()}_${winnerPhotoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('winner-photos')
        .upload(fileName, winnerPhotoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.warn('Photo upload failed:', uploadError.message);
        // Continue without photo — not a blocker
        showToast(translate('dyn_str_33'), 'error');
      } else {
        const { data: urlData } = supabase.storage
          .from('winner-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData?.publicUrl || null;
      }
    }

    // Fallback to student's stored photo if no new one provided
    if (!photoUrl && student.photo_url) {
      photoUrl = student.photo_url;
    }

    // Deactivate any previous winners
    await supabase
      .from('winners_display')
      .update({ is_active: false })
      .eq('competition_id', currentCompetitionId)
      .eq('is_active', true);

    // Insert new winner
    const record = {
      competition_id: currentCompetitionId,
      student_id: student.id,
      student_name: student.name,
      student_number: student.number,
      class_name: student.class_name || '',
      section: student.section || '',
      photo_url: photoUrl,
      is_active: true
    };

    const { data: winnerData, error: insertError } = await supabase
      .from('winners_display')
      .insert([record])
      .select()
      .single();

    if (insertError) throw insertError;
    
    // Broadcast fallback for instant reveal
    if (currentChannel) {
      currentChannel.send({
        type: 'broadcast',
        event: 'winner-reveal',
        payload: winnerData
      });
    }

    showToast(translate('dyn_str_34'));

    // Reset form
    winnerPhotoFile = null;
    const photoInput = document.getElementById('winner-photo-upload');
    if (photoInput) photoInput.value = '';
    const preview = document.getElementById('winner-photo-preview');
    if (preview) preview.style.display = 'none';

  } catch (err) {
    showToast((currentLang==='ar'?'خطأ: ':'Error: ') + err.message, 'error');
    console.error('Push winner error:', err);
  } finally {
    if (pushBtn) {
      pushBtn.disabled = false;
      pushBtn.textContent = '🏅 Push to Winner Screen';
    }
  }
}

async function clearWinnerDisplay() {
  if (!confirm('Clear the winner display screen?')) return;

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not available');

    const { error } = await supabase
      .from('winners_display')
      .update({ is_active: false })
      .eq('competition_id', currentCompetitionId)
      .eq('is_active', true);

    if (error) throw error;

    // Broadcast fallback
    try {
      if (currentChannel) {
        currentChannel.send({
          type: 'broadcast',
          event: 'clear-display',
          payload: {}
        });
      }
    } catch (broadcastErr) {
      console.warn('Broadcast failed:', broadcastErr);
    }

    showToast(translate('dyn_str_35'));
  } catch (err) {
    showToast((currentLang==='ar'?'خطأ: ':'Error: ') + err.message, 'error');
  }
}

// ===== VOICE DICTATION (Web Speech API) =====
let speechRecognitionInstance = null;
let isRecordingVoice = false;

function initVoiceDictation() {
  const voiceBtn = document.getElementById('voice-dictate-btn');
  const commentsInput = document.getElementById('evaluation-comments');
  const labelSpan = document.getElementById('voice-dictate-label');
  if (!voiceBtn || !commentsInput) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    voiceBtn.title = translate('voice-unsupported');
    voiceBtn.onclick = () => {
      showToast(translate('voice-unsupported'), 'info');
    };
    return;
  }

  if (!speechRecognitionInstance) {
    speechRecognitionInstance = new SpeechRecognition();
    speechRecognitionInstance.continuous = true;
    speechRecognitionInstance.interimResults = false;

    speechRecognitionInstance.onstart = () => {
      isRecordingVoice = true;
      voiceBtn.classList.add('recording');
      if (labelSpan) labelSpan.textContent = translate('voice-listening');
      showToast(translate('voice-listening'), 'info');
    };

    speechRecognitionInstance.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        const currentVal = commentsInput.value.trim();
        commentsInput.value = currentVal ? `${currentVal} ${transcript.trim()}` : transcript.trim();
        commentsInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    };

    speechRecognitionInstance.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      isRecordingVoice = false;
      voiceBtn.classList.remove('recording');
      if (labelSpan) labelSpan.textContent = translate('btn-voice-dictate');
    };

    speechRecognitionInstance.onend = () => {
      isRecordingVoice = false;
      voiceBtn.classList.remove('recording');
      if (labelSpan) labelSpan.textContent = translate('btn-voice-dictate');
    };
  }

  voiceBtn.onclick = () => {
    if (isRecordingVoice) {
      speechRecognitionInstance.stop();
      isRecordingVoice = false;
      voiceBtn.classList.remove('recording');
      if (labelSpan) labelSpan.textContent = translate('btn-voice-dictate');
    } else {
      speechRecognitionInstance.lang = currentLang === 'ar' ? 'ar-SA' : 'en-US';
      try {
        speechRecognitionInstance.start();
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }
  };
}

// ===== PODIUM REVEAL BROADCAST =====
async function pushTop3Podium() {
  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) {
    showToast(currentLang === 'ar' ? 'لا توجد نتائج لعرض منصة التتويج' : 'No results available for podium', 'error');
    return;
  }

  const top3 = aggregated.slice(0, 3).map(r => {
    const student = roster.find(s => String(s.id) === String(r.student_id));
    return {
      student_name: r.student_name,
      class_name: r.class_name,
      section: r.section || '',
      average_total: r.average_total,
      highest_total: r.highest_total,
      photo_url: (student && student.photo_url) ? student.photo_url : ''
    };
  });

  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  try {
    if (currentChannel) {
      currentChannel.send({
        type: 'broadcast',
        event: 'podium-reveal',
        payload: {
          competitionName: compName,
          top3: top3
        }
      });
      showToast(currentLang === 'ar' ? '🏆 تم إرسال منصة التتويج لشاشة العرض!' : '🏆 Top 3 Podium pushed to display!', 'success');
    } else {
      showToast(currentLang === 'ar' ? 'القناة غير متصلة' : 'Broadcast channel not connected', 'error');
    }
  } catch (err) {
    console.error('Error pushing podium:', err);
    showToast((currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error');
  }
}

// ===== CERTIFICATE GENERATION ENGINE (A4 Landscape 1754x1240) =====
let currentCertificateStudent = null;

function renderCertificateOnCanvas(student, rank, compName) {
  const canvas = document.getElementById('certificate-canvas');
  if (!canvas) return;

  const width = 1754;
  const height = 1240;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const isAr = currentLang === 'ar';

  // 1. Background - Ivory Parchment Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#fdfbf7');
  bgGrad.addColorStop(0.5, '#ffffff');
  bgGrad.addColorStop(1, '#f9f4ea');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle luxury background pattern lines
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + height, height);
    ctx.stroke();
  }

  // 2. Borders & Corner Flourishes
  ctx.strokeStyle = '#c59b27';
  ctx.lineWidth = 8;
  ctx.strokeRect(50, 50, width - 100, height - 100);

  ctx.strokeStyle = '#e2c875';
  ctx.lineWidth = 2;
  ctx.strokeRect(66, 66, width - 132, height - 132);

  ctx.strokeStyle = 'rgba(197, 155, 39, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(76, 76, width - 152, height - 152);
  ctx.setLineDash([]);

  const drawCorner = (x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#c59b27';
    ctx.fillRect(-12, -12, 24, 24);
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#c59b27';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCorner(66, 66);
  drawCorner(width - 66, 66);
  drawCorner(66, height - 66);
  drawCorner(width - 66, height - 66);

  // 3. Institution / Header Top Branding
  ctx.textAlign = 'center';
  ctx.fillStyle = '#854d0e';
  ctx.font = '600 24px "Segoe UI", "Cairo", sans-serif';
  const customCertOrg = localStorage.getItem('taqeem_cert_org');
  const orgTitle = customCertOrg || (isAr
    ? (settings.appName ? `${settings.appName} • منصة تقييم الفعاليات المدرسية` : 'منصة تقييم الفعاليات والمنافسات الطلابية')
    : (settings.appName ? `${settings.appName} • School Evaluation Platform` : 'Taqeem • School Competitions & Evaluation Platform'));
  ctx.fillText(orgTitle, width / 2, 140);

  // Decorative header divider line with star
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 240, 165);
  ctx.lineTo(width / 2 - 25, 165);
  ctx.moveTo(width / 2 + 25, 165);
  ctx.lineTo(width / 2 + 240, 165);
  ctx.stroke();
  ctx.fillStyle = '#d4af37';
  ctx.font = '20px serif';
  ctx.fillText('★', width / 2, 172);

  // 4. Main Certificate Title
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 56px "Cinzel", "Playfair Display", "Cairo", "Segoe UI", serif';
  const mainTitle = isAr ? 'شهادة تفوق وتكريم' : 'CERTIFICATE OF EXCELLENCE';
  ctx.fillText(mainTitle, width / 2, 250);

  // 5. Presentation Lead Line
  ctx.fillStyle = '#64748b';
  ctx.font = 'italic 26px "Segoe UI", "Cairo", sans-serif';
  const leadLine = isAr
    ? 'تُمنح هذه الشهادة بكل فخر واعتزاز إلى الطالب/ـة'
    : 'This certificate is proudly awarded with honor to';
  ctx.fillText(leadLine, width / 2, 330);

  // 6. Recipient / Student Name
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 64px "Cairo", "Playfair Display", "Segoe UI", sans-serif';
  const studentName = student.student_name || student.name || 'Student Name';
  ctx.fillText(studentName, width / 2, 420);

  // Gold accent bar under student name
  const nameWidth = Math.min(ctx.measureText(studentName).width + 60, 800);
  const nameGrad = ctx.createLinearGradient(width / 2 - nameWidth / 2, 0, width / 2 + nameWidth / 2, 0);
  nameGrad.addColorStop(0, 'transparent');
  nameGrad.addColorStop(0.2, '#c59b27');
  nameGrad.addColorStop(0.8, '#c59b27');
  nameGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = nameGrad;
  ctx.fillRect(width / 2 - nameWidth / 2, 440, nameWidth, 4);

  // 7. Achievement & Competition Text
  ctx.fillStyle = '#334155';
  ctx.font = '400 28px "Segoe UI", "Cairo", sans-serif';
  const reasonLine1 = isAr
    ? 'تقديراً للأداء الاستثنائي، والإلقاء المتميز، والاجتهاد اللافت في'
    : 'In recognition of exemplary performance, outstanding presentation, and active participation in';
  ctx.fillText(reasonLine1, width / 2, 520);

  ctx.fillStyle = '#4338ca';
  ctx.font = 'bold 36px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(`« ${compName} »`, width / 2, 580);

  ctx.fillStyle = '#475569';
  ctx.font = '600 24px "Segoe UI", "Cairo", sans-serif';
  const studentInfo = isAr
    ? `الصف: ${student.class_name || '-'} | الشعبة: ${student.section || '-'}`
    : `Class: ${student.class_name || '-'} | Section: ${student.section || '-'}`;
  ctx.fillText(studentInfo, width / 2, 630);

  // 8. Rank Achievement Ribbon / Badge
  let badgeColor = '#b45309';
  let badgeBg = '#fef3c7';
  let badgeBorder = '#f59e0b';
  let badgeText = isAr ? '★ شهادة تقدير ومشاركة متميزة ★' : '★ Certificate of Special Distinction ★';

  if (rank === 1) {
    badgeColor = '#92400e';
    badgeBg = '#fef3c7';
    badgeBorder = '#d97706';
    badgeText = isAr ? '★ الفائز بالمركز الأول - المركز الذهبي ★' : '★ FIRST PLACE WINNER - GOLD MEDALIST ★';
  } else if (rank === 2) {
    badgeColor = '#334155';
    badgeBg = '#f1f5f9';
    badgeBorder = '#94a3b8';
    badgeText = isAr ? '★ الفائز بالمركز الثاني - المركز الفضي ★' : '★ SECOND PLACE WINNER - SILVER MEDALIST ★';
  } else if (rank === 3) {
    badgeColor = '#7c2d12';
    badgeBg = '#ffedd5';
    badgeBorder = '#ea580c';
    badgeText = isAr ? '★ الفائز بالمركز الثالث - المركز البرونزي ★' : '★ THIRD PLACE WINNER - BRONZE MEDALIST ★';
  }

  const badgeWidth = 620;
  const badgeHeight = 52;
  const badgeX = width / 2 - badgeWidth / 2;
  const badgeY = 675;

  ctx.fillStyle = badgeBg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 26);
  ctx.fill();
  ctx.strokeStyle = badgeBorder;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = badgeColor;
  ctx.font = 'bold 24px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(badgeText, width / 2, badgeY + 34);

  // 9. Golden Rosette Medallion (Center Bottom)
  const sealX = width / 2;
  const sealY = 890;
  const sealRadius = 60;

  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.moveTo(sealX - 25, sealY + 40);
  ctx.lineTo(sealX - 45, sealY + 120);
  ctx.lineTo(sealX - 25, sealY + 105);
  ctx.lineTo(sealX - 5, sealY + 120);
  ctx.lineTo(sealX - 10, sealY + 40);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(sealX + 10, sealY + 40);
  ctx.lineTo(sealX + 5, sealY + 120);
  ctx.lineTo(sealX + 25, sealY + 105);
  ctx.lineTo(sealX + 45, sealY + 120);
  ctx.lineTo(sealX + 25, sealY + 40);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 16) {
    const r = sealRadius + (Math.sin(a * 16) * 6);
    ctx.lineTo(sealX + Math.cos(a) * r, sealY + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();

  const medallionGrad = ctx.createRadialGradient(sealX - 15, sealY - 15, 10, sealX, sealY, sealRadius - 6);
  medallionGrad.addColorStop(0, '#fef3c7');
  medallionGrad.addColorStop(0.6, '#f59e0b');
  medallionGrad.addColorStop(1, '#b45309');
  ctx.fillStyle = medallionGrad;
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealRadius - 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#78350f';
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.fillText('OFFICIAL', sealX, sealY - 12);
  ctx.font = 'bold 22px serif';
  ctx.fillText('★ ★ ★', sealX, sealY + 10);
  ctx.font = 'bold 14px "Segoe UI", sans-serif';
  ctx.fillText('SEAL', sealX, sealY + 28);

  // 10. Signatures & Date
  const signY = 1000;
  
  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 22px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(dateStr, 340, signY - 10);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(190, signY);
  ctx.lineTo(490, signY);
  ctx.stroke();

  const customSig1 = localStorage.getItem('taqeem_cert_sig1');
  const customSig2 = localStorage.getItem('taqeem_cert_sig2');

  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(customSig1 || (isAr ? 'تاريخ المنح والاعتماد' : 'Date of Issuance'), 340, signY + 30);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'italic 600 22px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'لجنة التحكيم المعتمدة' : 'Judging Committee Panel', width - 340, signY - 10);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(width - 490, signY);
  ctx.lineTo(width - 190, signY);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = '400 20px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(customSig2 || (isAr ? 'رئيس لجنة التحكيم والتقييم' : 'Chief Evaluation Judge'), width - 340, signY + 30);
}

function openStudentCertificate(studentId, rank = null) {
  const aggregated = getAggregatedResults();
  const res = aggregated.find(r => String(r.student_id) === String(studentId));
  const student = roster.find(s => String(s.id) === String(studentId)) || res || { name: 'Student', class_name: '', section: '' };

  if (rank === null) {
    const idx = aggregated.findIndex(r => String(r.student_id) === String(studentId));
    rank = idx !== -1 ? idx + 1 : null;
  }

  currentCertificateStudent = {
    ...student,
    student_name: student.student_name || student.name,
    rank: rank
  };

  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  renderCertificateOnCanvas(currentCertificateStudent, rank, compName);

  const modal = document.getElementById('certificate-modal');
  if (modal) modal.hidden = false;
}

function closeCertificateModal() {
  const modal = document.getElementById('certificate-modal');
  if (modal) modal.hidden = true;
}

function downloadCertificatePNG() {
  const canvas = document.getElementById('certificate-canvas');
  if (!canvas) return;

  const link = document.createElement('a');
  const safeName = currentCertificateStudent && (currentCertificateStudent.student_name || currentCertificateStudent.name)
    ? (currentCertificateStudent.student_name || currentCertificateStudent.name).replace(/\s+/g, '_')
    : 'student';
  link.download = `certificate_${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast(translate('cert-downloaded'), 'success');
}

function printCertificate() {
  const canvas = document.getElementById('certificate-canvas');
  if (!canvas) return;

  const dataUrl = canvas.toDataURL('image/png');
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast(currentLang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print', 'warning');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Taqeem Certificate</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #000; min-height: 100vh; }
          img { width: 100vw; height: 100vh; object-fit: contain; }
          @media print {
            body { background: #fff; }
            img { width: 100%; height: 100%; }
          }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
      </body>
    </html>
  `);
  printWindow.document.close();
}

async function generateBatchCertificates() {
  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) {
    showToast(translate('dyn_str_24'), 'error');
    return;
  }

  showToast(currentLang === 'ar' ? 'جارٍ إعداد الشهادات للتحميل...' : 'Preparing certificates for download...', 'info');

  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  let count = 0;
  for (let i = 0; i < aggregated.length; i++) {
    const res = aggregated[i];
    const student = roster.find(s => String(s.id) === String(res.student_id)) || res;
    renderCertificateOnCanvas({ ...student, student_name: res.student_name }, i + 1, compName);

    const canvas = document.getElementById('certificate-canvas');
    if (canvas) {
      const link = document.createElement('a');
      const safeName = (res.student_name || 'student').replace(/\s+/g, '_');
      link.download = `certificate_${String(i + 1).padStart(2, '0')}_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      count++;
    }
    await new Promise(resolve => setTimeout(resolve, 350));
  }

  showToast(
    currentLang === 'ar' ? `✅ تم تنزيل ${count} شهادة تقدير بنجاح!` : `✅ Successfully downloaded ${count} certificate(s)!`,
    'success'
  );
}

// ===== JUDGE QR PASS ENGINE =====
let currentPassUser = null;
let currentPassLoginUrl = '';

function openJudgeQrPass(userId) {
  const user = allCustomUsers.find(u => String(u.id) === String(userId));
  if (!user) return;

  currentPassUser = user;
  const currentComp = competitions.find(c => String(c.id) === String(user.competition_id || currentCompetitionId));
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  const judgeNameEl = document.getElementById('qr-pass-judge-name');
  const compNameEl = document.getElementById('qr-pass-comp-name');
  if (judgeNameEl) judgeNameEl.textContent = user.username;
  if (compNameEl) compNameEl.textContent = compName;

  const passPayload = {
    u: user.username,
    r: user.role,
    c: user.competition_id || currentCompetitionId,
    t: Date.now()
  };
  const token = btoa(encodeURIComponent(JSON.stringify(passPayload)));
  const origin = window.location.origin;
  const path = window.location.pathname;
  currentPassLoginUrl = `${origin}${path}?judgePass=${token}&comp=${user.competition_id || currentCompetitionId}`;

  const canvas = document.getElementById('judge-qr-canvas');
  if (canvas && window.TaqeemQR) {
    window.TaqeemQR.renderToCanvas(canvas, currentPassLoginUrl, {
      size: 210,
      darkColor: '#0f172a',
      lightColor: '#ffffff'
    });
  }

  const modal = document.getElementById('qr-pass-modal');
  if (modal) modal.hidden = false;
}

function closeJudgeQrPassModal() {
  const modal = document.getElementById('qr-pass-modal');
  if (modal) modal.hidden = true;
}

function copyJudgePassLink() {
  if (!currentPassLoginUrl) return;
  navigator.clipboard.writeText(currentPassLoginUrl).then(() => {
    showToast(translate('pass-copied'), 'success');
  }).catch(() => {
    showToast(currentPassLoginUrl, 'info');
  });
}

function printJudgePass() {
  const canvas = document.getElementById('judge-qr-canvas');
  const qrData = canvas ? canvas.toDataURL('image/png') : '';
  const judgeName = currentPassUser ? currentPassUser.username : 'Judge';
  const compName = document.getElementById('qr-pass-comp-name')?.textContent || 'Taqeem Competition';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    showToast(currentLang === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة للطباعة' : 'Please allow popups to print', 'warning');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Judge Access Pass - ${escapeHtml(judgeName)}</title>
        <style>
          @page { size: auto; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 80vh; margin: 0; }
          .pass-badge { width: 340px; border: 3px solid #0f172a; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .comp { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 6px; }
          .name { font-size: 24px; font-weight: 900; color: #0f172a; margin: 4px 0 10px 0; }
          .role { display: inline-block; background: #e0e7ff; color: #4338ca; font-weight: 800; font-size: 12px; padding: 4px 12px; border-radius: 12px; margin-bottom: 16px; }
          .qr { width: 200px; height: 200px; margin: 0 auto; display: block; border-radius: 8px; }
          .hint { font-size: 11px; color: #64748b; margin-top: 14px; }
        </style>
      </head>
      <body>
        <div class="pass-badge">
          <div class="comp">${escapeHtml(compName)}</div>
          <div class="name">${escapeHtml(judgeName)}</div>
          <div class="role">OFFICIAL JUDGE PASS • بطاقة حكم معتمد</div>
          <img class="qr" src="${qrData}">
          <div class="hint">Scan with camera to access judging portal instantly.</div>
        </div>
        <script>
          window.onload = function() { window.print(); setTimeout(() => window.close(), 1000); };
        <\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

async function handleJudgePassAutoLogin(tokenStr) {
  try {
    const raw = decodeURIComponent(atob(tokenStr));
    const pass = JSON.parse(raw);
    if (!pass || !pass.u) return;

    isAuthenticated = true;
    currentUserId = pass.u;
    userRole = pass.r || 'judge';
    if (pass.c) {
      currentCompetitionId = pass.c;
      localStorage.setItem('currentCompetitionId', pass.c);
    }

    localStorage.setItem('taqeem_auth', 'true');
    localStorage.setItem('taqeem_user', pass.u);
    localStorage.setItem('taqeem_role', userRole);

    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    showToast(
      currentLang === 'ar' ? `مرحباً بك يا حكم ${pass.u}! تم تسجيل دخولك بنجاح.` : `Welcome Judge ${pass.u}! Logged in successfully.`,
      'success'
    );
  } catch (err) {
    console.warn('Error handling judge pass login:', err);
  }
}

// ===== AUDIENCE CHOICE STAGE CONTROLS =====

function pushAudienceVotingToStage() {
  if (!currentChannel) {
    showToast(currentLang === 'ar' ? 'القناة غير متصلة' : 'Broadcast channel not connected', 'error');
    return;
  }

  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');
  const origin = window.location.origin;
  const path = window.location.pathname.replace(/[^\/]*$/, '');
  const voteUrl = `${origin}${path}vote.html?comp=${currentCompetitionId}`;

  try {
    currentChannel.send({
      type: 'broadcast',
      event: 'show-audience-voting',
      payload: {
        voteUrl,
        competitionName: compName
      }
    });
    showToast(translate('vote-stage-pushed'), 'success');
  } catch (err) {
    console.error('Error broadcasting audience voting:', err);
    showToast((currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error');
  }
}

function revealAudienceFavoriteOnStage() {
  if (!currentChannel) {
    showToast(currentLang === 'ar' ? 'القناة غير متصلة' : 'Broadcast channel not connected', 'error');
    return;
  }

  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) {
    showToast(translate('dyn_str_38'), 'error');
    return;
  }

  const winner = aggregated[0];
  const student = roster.find(s => String(s.id) === String(winner.student_id)) || winner;

  try {
    currentChannel.send({
      type: 'broadcast',
      event: 'reveal-audience-favorite',
      payload: {
        winner: student.name || winner.student_name,
        className: `${student.class_name || ''} ${student.section || ''}`.trim(),
        photoUrl: student.photo_url || null
      }
    });
    showToast(translate('vote-fav-pushed'), 'success');
  } catch (err) {
    console.error('Error broadcasting audience favorite:', err);
    showToast((currentLang === 'ar' ? 'خطأ: ' : 'Error: ') + err.message, 'error');
  }
}

// ===== DETAILED MATRIX CSV EXPORT =====

async function exportDetailedMatrixCSV() {
  if (evaluations.length === 0) {
    showToast(translate('dyn_str_24'), 'error');
    return;
  }

  const headers = [
    'Student Number',
    'Student Name',
    'Class',
    'Section',
    'Judge Name',
    'Evaluation Date',
    'Raw Score',
    'Max Score',
    'Weighted Percent'
  ];

  CRITERIA_KEYS.forEach(k => {
    headers.push(`"${(criteriaLabels[k] || k).replace(/"/g, '""')} (${criteriaWeights[k] || ''}%)"`);
  });
  headers.push('Comments');

  let csv = headers.join(',') + '\n';

  evaluations.forEach(e => {
    const student = roster.find(s => String(s.id) === String(e.student_id));
    const sNum = student ? student.number : (e.student_number || '');
    const sName = student ? student.name : (e.student_name || '');
    const sClass = student ? student.class_name : (e.class_name || '');
    const sSec = student ? student.section : (e.section || '');
    const dateStr = new Date(e.created_at).toLocaleString();
    const scores = e.scores || {};

    let rawScore = 0;
    let weightedSum = 0;
    let totalW = 0;

    CRITERIA_KEYS.forEach(k => {
      const val = parseInt(scores[k] || 0, 10);
      rawScore += val;
      const w = criteriaWeights[k] !== undefined ? criteriaWeights[k] : Math.round(100 / CRITERIA_KEYS.length);
      weightedSum += (val / 10) * w;
      totalW += w;
    });

    const weightedPercent = totalW > 0 ? ((weightedSum / totalW) * 100).toFixed(1) : '0';
    const maxScore = CRITERIA_KEYS.length * 10;

    const row = [
      sNum,
      `"${(sName || '').replace(/"/g, '""')}"`,
      `"${(sClass || '').replace(/"/g, '""')}"`,
      `"${(sSec || '').replace(/"/g, '""')}"`,
      `"${(e.judge_name || 'Judge').replace(/"/g, '""')}"`,
      `"${dateStr}"`,
      rawScore || e.total || 0,
      maxScore,
      `${weightedPercent}%`
    ];

    CRITERIA_KEYS.forEach(k => {
      row.push(scores[k] !== undefined ? scores[k] : '');
    });

    row.push(`"${(e.comments || '').replace(/"/g, '""')}"`);
    csv += row.join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `taqeem-detailed-matrix-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  showToast(currentLang === 'ar' ? '✅ تم تصدير مصفوفة الدرجات التفصيلية بنجاح!' : '✅ Detailed matrix exported successfully!', 'success');
}

// Window global assignments
window.openStudentCertificate = openStudentCertificate;
window.closeCertificateModal = closeCertificateModal;
window.downloadCertificatePNG = downloadCertificatePNG;
window.printCertificate = printCertificate;
window.generateBatchCertificates = generateBatchCertificates;
window.pushTop3Podium = pushTop3Podium;
window.initVoiceDictation = initVoiceDictation;

window.openJudgeQrPass = openJudgeQrPass;
window.closeJudgeQrPassModal = closeJudgeQrPassModal;
window.copyJudgePassLink = copyJudgePassLink;
window.printJudgePass = printJudgePass;
window.applyRubricPreset = applyRubricPreset;
window.updateCriteriaWeightTotal = updateCriteriaWeightTotal;
window.pushAudienceVotingToStage = pushAudienceVotingToStage;
window.revealAudienceFavoriteOnStage = revealAudienceFavoriteOnStage;

// ===== PHASE 4: PWA INSTALLATION, CERTIFICATE CUSTOMIZATION & ANALYTICS =====

let deferredInstallPrompt = null;

function initPwaInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const btn = document.getElementById('install-pwa-btn');
    if (btn) btn.style.display = 'inline-flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    const btn = document.getElementById('install-pwa-btn');
    if (btn) btn.style.display = 'none';
    showToast(currentLang === 'ar' ? '✅ تم تثبيت تطبيق تقييم بنجاح!' : '✅ Taqeem installed successfully!', 'success');
  });

  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installation accepted');
      }
      deferredInstallPrompt = null;
      installBtn.style.display = 'none';
    });
  }
}

function saveCertificateSettings() {
  const org = (document.getElementById('cfg-cert-org')?.value || '').trim();
  const sig1 = (document.getElementById('cfg-cert-sig1')?.value || '').trim();
  const sig2 = (document.getElementById('cfg-cert-sig2')?.value || '').trim();

  localStorage.setItem('taqeem_cert_org', org);
  localStorage.setItem('taqeem_cert_sig1', sig1);
  localStorage.setItem('taqeem_cert_sig2', sig2);

  showToast(translate('cert-settings-saved'), 'success');
}

function loadCertificateSettings() {
  const org = localStorage.getItem('taqeem_cert_org') || '';
  const sig1 = localStorage.getItem('taqeem_cert_sig1') || '';
  const sig2 = localStorage.getItem('taqeem_cert_sig2') || '';

  const elOrg = document.getElementById('cfg-cert-org');
  const elSig1 = document.getElementById('cfg-cert-sig1');
  const elSig2 = document.getElementById('cfg-cert-sig2');

  if (elOrg) elOrg.value = org;
  if (elSig1) elSig1.value = sig1;
  if (elSig2) elSig2.value = sig2;
}

function openCompetitionAnalytics() {
  const modal = document.getElementById('analytics-modal');
  if (!modal) return;
  modal.hidden = false;
  renderCompetitionAnalytics();
}

function closeCompetitionAnalytics() {
  const modal = document.getElementById('analytics-modal');
  if (modal) modal.hidden = true;
}

function renderCompetitionAnalytics() {
  const isAr = currentLang === 'ar';
  const evals = evaluations || [];
  const CRITERIA_KEYS = Object.keys(criteriaLabels).length > 0 ? Object.keys(criteriaLabels) : ['fluency', 'pronunciation', 'content', 'body_language', 'overall_impression'];

  // Quick stats
  const totalEvals = evals.length;
  const judgeStats = {}; // judge_id -> { name, count, totalScore, maxScore }
  const criteriaScores = {}; // criterion_key -> { sum, count, max }
  
  CRITERIA_KEYS.forEach(k => {
    criteriaScores[k] = { sum: 0, count: 0, max: 10 };
  });

  let grandTotalScore = 0;
  let grandMaxScore = 0;
  let highestStudentPercent = 0;

  evals.forEach(e => {
    const jId = e.judge_id || e.judge_name || 'Anonymous';
    const jName = e.judge_name || jId;
    if (!judgeStats[jId]) {
      judgeStats[jId] = { name: jName, count: 0, totalScore: 0, maxScore: 0 };
    }
    judgeStats[jId].count++;

    const scores = e.scores || {};
    let evalRaw = 0;
    let evalMax = CRITERIA_KEYS.length * 10;

    CRITERIA_KEYS.forEach(k => {
      const val = parseInt(scores[k] || 0, 10);
      evalRaw += val;
      if (scores[k] !== undefined) {
        criteriaScores[k].sum += val;
        criteriaScores[k].count++;
      }
    });

    judgeStats[jId].totalScore += evalRaw;
    judgeStats[jId].maxScore += evalMax;

    grandTotalScore += evalRaw;
    grandMaxScore += evalMax;

    const evalPercent = evalMax > 0 ? (evalRaw / evalMax) * 100 : 0;
    if (evalPercent > highestStudentPercent) highestStudentPercent = evalPercent;
  });

  const overallAvgPercent = grandMaxScore > 0 ? Math.round((grandTotalScore / grandMaxScore) * 100) : 0;
  const judgeCount = Object.keys(judgeStats).length;

  // Update summary stat boxes
  const elTotal = document.getElementById('analytics-total-evals');
  const elAvg = document.getElementById('analytics-comp-avg');
  const elHigh = document.getElementById('analytics-highest-score');
  const elJudges = document.getElementById('analytics-active-judges');

  if (elTotal) elTotal.textContent = totalEvals;
  if (elAvg) elAvg.textContent = `${overallAvgPercent}%`;
  if (elHigh) elHigh.textContent = `${Math.round(highestStudentPercent)}%`;
  if (elJudges) elJudges.textContent = judgeCount;

  // Render Criteria Bars
  const criteriaContainer = document.getElementById('analytics-criteria-bars');
  if (criteriaContainer) {
    if (totalEvals === 0) {
      criteriaContainer.innerHTML = `<p style="color: var(--text-muted); font-style: italic; margin: 0;">${isAr ? 'لا توجد تقييمات لتحليل المعايير حتى الآن.' : 'No evaluations submitted yet to compute criterion breakdown.'}</p>`;
    } else {
      let html = '';
      CRITERIA_KEYS.forEach(k => {
        const label = criteriaLabels[k] || k;
        const weight = criteriaWeights[k] !== undefined ? criteriaWeights[k] : Math.round(100 / CRITERIA_KEYS.length);
        const data = criteriaScores[k];
        const possible = data.count * 10;
        const pct = possible > 0 ? Math.round((data.sum / possible) * 100) : 0;

        let barColor = '#10b981'; // green
        if (pct < 65) barColor = '#ef4444'; // red
        else if (pct < 80) barColor = '#f59e0b'; // amber

        html += `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.88rem;">
              <span style="font-weight: 600;">${label} <span style="font-size: 0.75rem; color: var(--text-muted);">(${weight}%)</span></span>
              <span style="font-weight: 700; color: ${barColor};">${pct}%</span>
            </div>
            <div style="width: 100%; height: 10px; background: rgba(148, 163, 184, 0.2); border-radius: 6px; overflow: hidden;">
              <div style="width: ${pct}%; height: 100%; background: ${barColor}; border-radius: 6px; transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
          </div>
        `;
      });
      criteriaContainer.innerHTML = html;
    }
  }

  // Render Judge Variance Table
  const tbody = document.getElementById('analytics-judge-tbody');
  if (tbody) {
    if (judgeCount === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 18px; color: var(--text-muted); font-style: italic;">${isAr ? 'لا توجد بيانات محكمين.' : 'No judge evaluations recorded.'}</td></tr>`;
    } else {
      let rowsHtml = '';
      Object.values(judgeStats).forEach(j => {
        const jAvgPct = j.maxScore > 0 ? Math.round((j.totalScore / j.maxScore) * 100) : 0;
        const variance = jAvgPct - overallAvgPercent;
        const absVar = Math.abs(variance);

        let varianceBadge = '';
        let ratingBadge = '';

        if (absVar <= 3) {
          varianceBadge = `<span style="color: #10b981; font-weight: 700;">±${absVar}%</span>`;
          ratingBadge = `<span style="background: rgba(16, 185, 129, 0.15); color: #10b981; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${isAr ? 'متطابق ودقيق' : 'Consistent'}</span>`;
        } else if (variance > 3 && variance <= 8) {
          varianceBadge = `<span style="color: #f59e0b; font-weight: 700;">+${variance}%</span>`;
          ratingBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${isAr ? 'يميل للمرونة' : 'Mildly Lenient'}</span>`;
        } else if (variance > 8) {
          varianceBadge = `<span style="color: #8b5cf6; font-weight: 700;">+${variance}%</span>`;
          ratingBadge = `<span style="background: rgba(139, 92, 246, 0.15); color: #7c3aed; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${isAr ? 'مرن ومرتفع' : 'Lenient'}</span>`;
        } else if (variance < -3 && variance >= -8) {
          varianceBadge = `<span style="color: #f59e0b; font-weight: 700;">${variance}%</span>`;
          ratingBadge = `<span style="background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${isAr ? 'يميل للحزم' : 'Mildly Strict'}</span>`;
        } else {
          varianceBadge = `<span style="color: #ef4444; font-weight: 700;">${variance}%</span>`;
          ratingBadge = `<span style="background: rgba(239, 68, 68, 0.15); color: #dc2626; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;">${isAr ? 'حازم ودقيق' : 'Strict'}</span>`;
        }

        rowsHtml += `
          <tr style="border-bottom: 1px solid var(--border);">
            <td style="padding: 10px; font-weight: 600;">${j.name}</td>
            <td style="padding: 10px; text-align: center;">${j.count}</td>
            <td style="padding: 10px; text-align: center; font-weight: 700;">${jAvgPct}%</td>
            <td style="padding: 10px; text-align: center;">${varianceBadge}</td>
            <td style="padding: 10px; text-align: center;">${ratingBadge}</td>
          </tr>
        `;
      });
      tbody.innerHTML = rowsHtml;
    }
  }
}

window.exportDetailedMatrixCSV = exportDetailedMatrixCSV;

window.saveCertificateSettings = saveCertificateSettings;
window.loadCertificateSettings = loadCertificateSettings;
window.openCompetitionAnalytics = openCompetitionAnalytics;
window.closeCompetitionAnalytics = closeCompetitionAnalytics;
window.renderCompetitionAnalytics = renderCompetitionAnalytics;

// ===== PHASE 5: FAIR JUDGING & REPORT CARD ENGINE =====

let currentReportCardStudent = null;

function saveFairnessSettings() {
  const blind = document.getElementById('cfg-blind-judging')?.checked || false;
  const locking = document.getElementById('cfg-score-locking')?.checked || false;

  localStorage.setItem('taqeem_blind_judging', blind ? 'true' : 'false');
  localStorage.setItem('taqeem_score_locking', locking ? 'true' : 'false');

  renderJudgingSidebar();
  showToast(translate('fairness-saved'), 'success');
}

function loadFairnessSettings() {
  const blind = localStorage.getItem('taqeem_blind_judging') === 'true';
  const locking = localStorage.getItem('taqeem_score_locking') === 'true';

  const elBlind = document.getElementById('cfg-blind-judging');
  const elLocking = document.getElementById('cfg-score-locking');

  if (elBlind) elBlind.checked = blind;
  if (elLocking) elLocking.checked = locking;
}

function renderReportCardOnCanvas(student, rank, compName) {
  const canvas = document.getElementById('report-card-canvas');
  if (!canvas) return;

  const width = 1240;
  const height = 1754;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  const isAr = currentLang === 'ar';
  const CRITERIA_KEYS = Object.keys(criteriaLabels).length > 0 ? Object.keys(criteriaLabels) : ['fluency', 'pronunciation', 'content', 'body_language', 'overall_impression'];

  // 1. Clean Paper Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Top elegant banner
  const topGrad = ctx.createLinearGradient(0, 0, width, 0);
  topGrad.addColorStop(0, '#1e1b4b');
  topGrad.addColorStop(1, '#312e81');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 140);

  // Gold accent stripe
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(0, 140, width, 6);

  // 2. Institution & Title Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px "Outfit", "Cairo", sans-serif';
  const customOrg = localStorage.getItem('taqeem_cert_org');
  const orgTitle = customOrg || (settings.appName ? `${settings.appName}` : 'TAQEEM EVALUATION SYSTEM');
  ctx.fillText(orgTitle, width / 2, 55);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = '600 20px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'بطاقة التقرير التقييمي وتفاصيل الأداء' : 'OFFICIAL STUDENT EVALUATION REPORT CARD', width / 2, 95);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px "Space Mono", monospace';
  ctx.fillText(compName || 'Competition Event', width / 2, 122);

  // 3. Student Identity Card Box
  const cardY = 170;
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(60, cardY, width - 120, 130, 12);
  ctx.fill();
  ctx.stroke();

  // Left/Right aligned info
  ctx.textAlign = isAr ? 'right' : 'left';
  const infoX = isAr ? width - 100 : 100;
  
  ctx.fillStyle = '#64748b';
  ctx.font = '600 15px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'اسم الطالب / المتسابق:' : 'STUDENT NAME / CONTESTANT:', infoX, cardY + 38);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px "Outfit", "Cairo", sans-serif';
  const sName = student.student_name || student.name || 'Contestant';
  ctx.fillText(sName, infoX, cardY + 74);

  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Segoe UI", "Cairo", sans-serif';
  const classSec = `${student.class_name ? (isAr ? 'الصف: ' : 'Class: ') + student.class_name : ''} ${student.section ? '• ' + (isAr ? 'الشعبة: ' : 'Section: ') + student.section : ''}`;
  ctx.fillText(classSec || 'All Groups', infoX, cardY + 105);

  // Student number & Rank pill on other side
  ctx.textAlign = isAr ? 'left' : 'right';
  const badgeX = isAr ? 100 : width - 100;

  ctx.fillStyle = '#64748b';
  ctx.font = '600 15px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText((isAr ? 'رقم المشارك: #' : 'CONTESTANT NUMBER: #') + (student.number || student.student_number || '1'), badgeX, cardY + 40);

  if (rank) {
    const rankColors = { 1: '#b45309', 2: '#475569', 3: '#9a3412' };
    const rankBg = { 1: '#fef3c7', 2: '#f1f5f9', 3: '#ffedd5' };
    const rCol = rankColors[rank] || '#4338ca';
    const rBg = rankBg[rank] || '#e0e7ff';
    const rankText = rank === 1 ? (isAr ? '🏆 المركز الأول' : '🏆 1st Place') :
                     rank === 2 ? (isAr ? '🥈 المركز الثاني' : '🥈 2nd Place') :
                     rank === 3 ? (isAr ? '🥉 المركز الثالث' : '🥉 3rd Place') :
                     (isAr ? `الترتيب: #${rank}` : `Rank #${rank}`);

    ctx.fillStyle = rBg;
    ctx.beginPath();
    const pW = 160;
    const pX = isAr ? badgeX : badgeX - pW;
    ctx.roundRect(pX, cardY + 65, pW, 38, 19);
    ctx.fill();

    ctx.fillStyle = rCol;
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px "Outfit", "Cairo", sans-serif';
    ctx.fillText(rankText, pX + (pW / 2), cardY + 90);
  }

  // 4. Evaluations Data Aggregation
  const studentId = student.id || student.student_id;
  const studentEvals = evaluations.filter(e => String(e.student_id) === String(studentId));
  const evalCount = studentEvals.length;

  const critAverages = {};
  let totalRawScore = 0;
  let totalWeightedScore = 0;
  let totalWeightSum = 0;

  CRITERIA_KEYS.forEach(k => {
    critAverages[k] = { sum: 0, count: 0, avg: 0, weight: criteriaWeights[k] !== undefined ? criteriaWeights[k] : Math.round(100 / CRITERIA_KEYS.length) };
  });

  studentEvals.forEach(e => {
    const sc = e.scores || {};
    CRITERIA_KEYS.forEach(k => {
      if (sc[k] !== undefined) {
        critAverages[k].sum += parseInt(sc[k], 10);
        critAverages[k].count++;
      }
    });
  });

  CRITERIA_KEYS.forEach(k => {
    const d = critAverages[k];
    d.avg = d.count > 0 ? (d.sum / d.count) : 0;
    totalRawScore += d.avg;
    totalWeightedScore += (d.avg / 10) * d.weight;
    totalWeightSum += d.weight;
  });

  const finalWeightedPercent = totalWeightSum > 0 ? ((totalWeightedScore / totalWeightSum) * 100).toFixed(1) : '0';
  const totalMaxRaw = CRITERIA_KEYS.length * 10;

  // 5. Score Highlights Strip
  const scoreStripY = 325;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(60, scoreStripY, width - 120, 110, 12);
  ctx.fill();
  ctx.stroke();

  // 3 summary columns
  const colW = (width - 120) / 3;
  
  // Col 1: Final Weighted Percentage
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'الدرجة الموزونة النهائية' : 'WEIGHTED TOTAL SCORE', 60 + (colW / 2), scoreStripY + 36);
  ctx.fillStyle = '#4f46e5';
  ctx.font = 'bold 38px "Space Mono", monospace';
  ctx.fillText(`${finalWeightedPercent}%`, 60 + (colW / 2), scoreStripY + 84);

  // Col 2: Raw Score
  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'مجموع النقاط المحققة' : 'POINTS ACCUMULATED', 60 + colW + (colW / 2), scoreStripY + 36);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px "Space Mono", monospace';
  ctx.fillText(`${totalRawScore.toFixed(1)} / ${totalMaxRaw}`, 60 + colW + (colW / 2), scoreStripY + 84);

  // Col 3: Judges Evaluated
  ctx.fillStyle = '#64748b';
  ctx.font = '600 14px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(isAr ? 'عدد المحكمين' : 'EVALUATION PANEL', 60 + (colW * 2) + (colW / 2), scoreStripY + 36);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 32px "Space Mono", monospace';
  ctx.fillText(`${evalCount} ${isAr ? 'محكمين' : 'Judges'}`, 60 + (colW * 2) + (colW / 2), scoreStripY + 84);

  // 6. Criteria Mastery Table
  const tableY = 465;
  ctx.textAlign = isAr ? 'right' : 'left';
  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 22px "Outfit", "Cairo", sans-serif';
  ctx.fillText(isAr ? '📊 تفصيل درجات المعايير ومستوى الإتقان' : '📊 CRITERIA MASTERY & SCORE BREAKDOWN', isAr ? width - 60 : 60, tableY);

  let rowY = tableY + 25;
  let bestCrit = null;
  let lowestCrit = null;
  let highestPct = -1;
  let lowestPct = 999;

  CRITERIA_KEYS.forEach(k => {
    const label = criteriaLabels[k] || k;
    const d = critAverages[k];
    const pct = Math.round((d.avg / 10) * 100);

    if (pct > highestPct) { highestPct = pct; bestCrit = label; }
    if (pct < lowestPct) { lowestPct = pct; lowestCrit = label; }

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(60, rowY, width - 120, 52, 8);
    ctx.fill();

    // Criterion title
    ctx.textAlign = isAr ? 'right' : 'left';
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 17px "Segoe UI", "Cairo", sans-serif';
    ctx.fillText(`${label} (${d.weight}%)`, isAr ? width - 85 : 85, rowY + 32);

    // Score & progress bar
    const barWidth = 320;
    const barX = isAr ? 200 : width - 520;
    const barHeight = 12;
    const fillWidth = (pct / 100) * barWidth;

    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(barX, rowY + 20, barWidth, barHeight, 6);
    ctx.fill();

    let barColor = '#10b981';
    if (pct < 70) barColor = '#f59e0b';
    if (pct < 50) barColor = '#ef4444';

    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(barX, rowY + 20, Math.max(fillWidth, 8), barHeight, 6);
    ctx.fill();

    ctx.textAlign = isAr ? 'left' : 'right';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px "Space Mono", monospace';
    ctx.fillText(`${d.avg.toFixed(1)} / 10 (${pct}%)`, isAr ? 85 : width - 85, rowY + 32);

    rowY += 60;
  });

  // 7. Qualitative Highlights (Strength & Focus Area)
  const highY = rowY + 15;
  const boxW = (width - 140) / 2;

  // Box 1: Top Strength
  ctx.fillStyle = '#ecfdf5';
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(60, highY, boxW, 80, 10);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = isAr ? 'right' : 'left';
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 15px "Outfit", "Cairo", sans-serif';
  ctx.fillText(isAr ? '🌟 أبرز نقاط القوة والتميز:' : '🌟 KEY STRENGTH & HIGHLIGHT:', isAr ? 60 + boxW - 20 : 80, highY + 30);
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 18px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(bestCrit || (isAr ? 'أداء متزن' : 'Consistent Performance'), isAr ? 60 + boxW - 20 : 80, highY + 60);

  // Box 2: Area for Growth
  ctx.fillStyle = '#fffbeb';
  ctx.strokeStyle = '#fde68a';
  ctx.beginPath();
  ctx.roundRect(width - 60 - boxW, highY, boxW, 80, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d97706';
  ctx.font = 'bold 15px "Outfit", "Cairo", sans-serif';
  ctx.fillText(isAr ? '🎯 مجال التطوير والارتقاء المستقبلي:' : '🎯 FOCUS AREA FOR GROWTH:', isAr ? width - 80 : width - 60 - boxW + 20, highY + 30);
  ctx.fillStyle = '#92400e';
  ctx.font = 'bold 18px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(lowestCrit || (isAr ? 'استمرار التدريب' : 'Continued Practice'), isAr ? width - 80 : width - 60 - boxW + 20, highY + 60);

  // 8. Judges Feedback Box
  const feedbackY = highY + 110;
  ctx.textAlign = isAr ? 'right' : 'left';
  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 22px "Outfit", "Cairo", sans-serif';
  ctx.fillText(isAr ? '💬 ملاحظات وتوصيات لجنة التحكيم' : '💬 JUDGING PANEL FEEDBACK & RECOMMENDATIONS', isAr ? width - 60 : 60, feedbackY);

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(60, feedbackY + 15, width - 120, 260, 10);
  ctx.fill();
  ctx.stroke();

  const comments = studentEvals.map(e => e.comments ? `" ${e.comments} " — ${e.judge_name || 'Judge'}` : '').filter(Boolean);
  const feedbackText = comments.length > 0 ? comments.join('\n\n') : (isAr ? 'أظهر الطالب جهداً مميزاً وثقة رائعة خلال التقييم. مع خالص التمنيات بالتوفيق والنجاح الدائم.' : 'Demonstrated commendable commitment, clear confidence, and commendable effort throughout the evaluation. Wishing continued excellence.');

  ctx.textAlign = isAr ? 'right' : 'left';
  ctx.fillStyle = '#334155';
  ctx.font = 'italic 18px "Segoe UI", "Cairo", sans-serif';
  
  // Wrap text in feedback box
  const lines = feedbackText.split('\n');
  let commentY = feedbackY + 50;
  lines.forEach(l => {
    ctx.fillText(l.slice(0, 110), isAr ? width - 90 : 90, commentY);
    commentY += 32;
  });

  // 9. Official Signatures Footer
  const signY = 1640;
  const customSig1 = localStorage.getItem('taqeem_cert_sig1');
  const customSig2 = localStorage.getItem('taqeem_cert_sig2');

  const dateStr = new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '600 16px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(dateStr, 240, signY - 8);

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, signY);
  ctx.lineTo(360, signY);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Segoe UI", "Cairo", sans-serif';
  ctx.fillText(customSig1 || (isAr ? 'رئيس لجنة التحكيم' : 'Evaluation Committee Chair'), 240, signY + 28);

  ctx.beginPath();
  ctx.moveTo(width - 360, signY);
  ctx.lineTo(width - 120, signY);
  ctx.stroke();

  ctx.fillText(customSig2 || (isAr ? 'مدير / إدارة المدرسة' : 'School Leadership'), width - 240, signY + 28);
}

function openStudentReportCard(studentId, rank = null) {
  const aggregated = getAggregatedResults();
  const res = aggregated.find(r => String(r.student_id) === String(studentId));
  const student = roster.find(s => String(s.id) === String(studentId)) || res || { name: 'Student', class_name: '', section: '' };

  if (rank === null) {
    const idx = aggregated.findIndex(r => String(r.student_id) === String(studentId));
    rank = idx !== -1 ? idx + 1 : null;
  }

  currentReportCardStudent = { ...student, student_name: res ? res.student_name : student.name };
  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  renderReportCardOnCanvas(currentReportCardStudent, rank, compName);

  const modal = document.getElementById('report-card-modal');
  if (modal) modal.hidden = false;
}

function closeReportCardModal() {
  const modal = document.getElementById('report-card-modal');
  if (modal) modal.hidden = true;
}

function downloadReportCardPNG() {
  const canvas = document.getElementById('report-card-canvas');
  if (!canvas || !currentReportCardStudent) return;

  const link = document.createElement('a');
  const safeName = (currentReportCardStudent.student_name || currentReportCardStudent.name || 'student').replace(/\s+/g, '_');
  link.download = `report_card_${safeName}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();

  showToast(translate('report-downloaded'), 'success');
}

function printReportCard() {
  window.print();
}

async function generateBatchReportCards() {
  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) {
    showToast(translate('dyn_str_24'), 'error');
    return;
  }

  showToast(currentLang === 'ar' ? 'جارٍ إعداد بطاقات التقارير للتحميل...' : 'Preparing report cards for download...', 'info');

  const currentComp = competitions.find(c => c.id === currentCompetitionId);
  const compName = currentComp ? currentComp.name : (settings.appName || 'Taqeem Competition');

  let count = 0;
  for (let i = 0; i < aggregated.length; i++) {
    const res = aggregated[i];
    const student = roster.find(s => String(s.id) === String(res.student_id)) || res;
    renderReportCardOnCanvas({ ...student, student_name: res.student_name }, i + 1, compName);

    const canvas = document.getElementById('report-card-canvas');
    if (canvas) {
      const link = document.createElement('a');
      const safeName = (res.student_name || 'student').replace(/\s+/g, '_');
      link.download = `report_card_${String(i + 1).padStart(2, '0')}_${safeName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      count++;
    }
    await new Promise(r => setTimeout(r, 200));
  }

  showToast(currentLang === 'ar' ? `✅ تم تنزيل ${count} بطاقة تقرير بنجاح!` : `✅ Successfully downloaded ${count} report cards!`, 'success');
}

window.initPwaInstall = initPwaInstall;

window.saveFairnessSettings = saveFairnessSettings;
window.loadFairnessSettings = loadFairnessSettings;
window.openStudentReportCard = openStudentReportCard;
window.closeReportCardModal = closeReportCardModal;
window.downloadReportCardPNG = downloadReportCardPNG;
window.printReportCard = printReportCard;
window.generateBatchReportCards = generateBatchReportCards;
window.playWebAudioChime = playWebAudioChime;
window.handleAnthemUpload = handleAnthemUpload;
window.playAnthemPreview = playAnthemPreview;
window.resetAnthemDefault = resetAnthemDefault;
window.loadAudioSettings = loadAudioSettings;
window.updateAnthemStatusUI = updateAnthemStatusUI;
window.openQualifiersModal = openQualifiersModal;
window.closeQualifiersModal = closeQualifiersModal;
window.setQualifierCount = setQualifierCount;
window.getAdvancingStudents = getAdvancingStudents;
window.renderQualifiersPreview = renderQualifiersPreview;
window.advanceStudentsToFinals = advanceStudentsToFinals;
window.openArchiveModal = openArchiveModal;
window.closeArchiveModal = closeArchiveModal;
window.renderHistoricalArchive = renderHistoricalArchive;
window.searchStudentHistoricalProgress = searchStudentHistoricalProgress;




// ===== PHASE 6: AUDIO SIGNALS & CUSTOM ANTHEM =====
let activeAudioPreview = null;
let appWebAudioCtx = null;

function getAppWebAudioContext() {
  if (!appWebAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    appWebAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (appWebAudioCtx && appWebAudioCtx.state === 'suspended') {
    appWebAudioCtx.resume().catch(() => {});
  }
  return appWebAudioCtx;
}

function playWebAudioChime(type) {
  const ctx = getAppWebAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  if (type === 'warning-30s' || type === 'warning') {
    // Harmonic double-tone chime (A5 880Hz -> D6 1174Hz)
    const playTone = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    playTone(880, now, 0.28);
    playTone(1174.66, now + 0.18, 0.45);
  } else if (type === 'overtime' || type === 'timeup') {
    // Resonant tri-tone chime chord (C5 + E5 + G5)
    [523.25, 659.25, 783.99].forEach(freq => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.9);
    });
  }
}

function handleAnthemUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast(currentLang === 'ar' ? '⚠️ حجم الملف الصوتي يجب أن لا يتجاوز 5 ميغابايت' : '⚠️ Audio file size must be under 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const base64Audio = e.target.result;
      localStorage.setItem('taqeem_custom_anthem', base64Audio);
      localStorage.setItem('taqeem_custom_anthem_name', file.name);
      updateAnthemStatusUI();
      showToast(translate('anthem-saved'), 'success');
    } catch (err) {
      console.error('Failed to store custom anthem:', err);
      showToast(currentLang === 'ar' ? '⚠️ فشل حفظ الملف الصوتي (قد تكون الذاكرة ممتلئة)' : '⚠️ Failed to save audio file (storage full)', 'error');
    }
  };
  reader.readAsDataURL(file);
}

function playAnthemPreview() {
  const previewBtn = document.getElementById('btn-preview-anthem');
  
  if (activeAudioPreview) {
    activeAudioPreview.pause();
    activeAudioPreview.currentTime = 0;
    activeAudioPreview = null;
    if (previewBtn) previewBtn.textContent = translate('btn-preview-audio');
    showToast(translate('anthem-stopped'), 'info');
    return;
  }

  const customAnthem = localStorage.getItem('taqeem_custom_anthem');
  const audioSrc = customAnthem || 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';

  try {
    activeAudioPreview = new Audio(audioSrc);
    activeAudioPreview.play().then(() => {
      if (previewBtn) previewBtn.textContent = currentLang === 'ar' ? '⏹ إيقاف المقطع' : '⏹ Stop Preview';
      showToast(translate('anthem-playing'), 'info');
    }).catch(err => {
      console.warn('Audio play prevented:', err);
      activeAudioPreview = null;
    });

    activeAudioPreview.onended = () => {
      activeAudioPreview = null;
      if (previewBtn) previewBtn.textContent = translate('btn-preview-audio');
    };
  } catch (err) {
    console.error('Audio preview failed:', err);
  }
}

function resetAnthemDefault() {
  if (activeAudioPreview) {
    activeAudioPreview.pause();
    activeAudioPreview = null;
  }
  localStorage.removeItem('taqeem_custom_anthem');
  localStorage.removeItem('taqeem_custom_anthem_name');
  const previewBtn = document.getElementById('btn-preview-anthem');
  if (previewBtn) previewBtn.textContent = translate('btn-preview-audio');
  updateAnthemStatusUI();
  showToast(translate('anthem-reset'), 'info');
}

function updateAnthemStatusUI() {
  const statusEl = document.getElementById('cfg-anthem-status');
  if (!statusEl) return;
  const customAnthem = localStorage.getItem('taqeem_custom_anthem');
  const fileName = localStorage.getItem('taqeem_custom_anthem_name') || 'custom_audio.mp3';
  if (customAnthem) {
    statusEl.textContent = currentLang === 'ar' 
      ? `✅ تم تفعيل المقطع المخصص: ${fileName}`
      : `✅ Custom celebration active: ${fileName}`;
    statusEl.style.color = 'var(--primary)';
  } else {
    statusEl.textContent = translate('hint-anthem-status');
    statusEl.style.color = '';
  }
}

function loadAudioSettings() {
  updateAnthemStatusUI();
}

// ===== PHASE 7: TOURNAMENT QUALIFIERS & HISTORICAL ARCHIVE =====

let selectedQualifierCount = 3;

function openQualifiersModal() {
  const modal = document.getElementById('qualifiers-modal');
  if (!modal) return;
  modal.hidden = false;
  
  const currentComp = (competitions || []).find(c => String(c.id) === String(currentCompetitionId));
  const compBaseName = currentComp ? currentComp.name : (currentCompetitionName || 'Competition');
  const targetNameInput = document.getElementById('target-finals-name');
  if (targetNameInput) {
    targetNameInput.value = `${compBaseName} - ${currentLang === 'ar' ? 'النهائيات' : 'Grand Finals'}`;
  }
  
  renderQualifiersPreview();
}

function closeQualifiersModal() {
  const modal = document.getElementById('qualifiers-modal');
  if (modal) modal.hidden = true;
}

function setQualifierCount(count) {
  selectedQualifierCount = count;
  document.querySelectorAll('.qualifier-pill').forEach(btn => {
    btn.classList.remove('active');
  });
  if (typeof event !== 'undefined' && event && event.target) {
    event.target.classList.add('active');
  }
  renderQualifiersPreview();
}

function getAdvancingStudents() {
  const aggregated = typeof getAggregatedResults === 'function' ? getAggregatedResults() : [];
  if (!aggregated || aggregated.length === 0) return [];

  let count = aggregated.length;
  if (selectedQualifierCount !== 'all') {
    count = Math.min(Number(selectedQualifierCount) || 3, aggregated.length);
  }
  return aggregated.slice(0, count);
}

function renderQualifiersPreview() {
  const container = document.getElementById('qualifiers-preview-list');
  if (!container) return;

  const advancing = getAdvancingStudents();
  if (advancing.length === 0) {
    container.innerHTML = `<p class="empty-state-text" style="margin: 12px 0;">${translate('no-eval-advance')}</p>`;
    return;
  }

  container.innerHTML = advancing.map((item, idx) => {
    const student = (roster || []).find(s => String(s.id) === String(item.student_id)) || {};
    const rankBadge = idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`;
    const scoreVal = item.highest !== undefined ? item.highest : item.average;
    const maxScore = (CRITERIA_KEYS ? CRITERIA_KEYS.length : 6) * 10;
    const percent = Math.round((scoreVal / maxScore) * 100);

    return `
      <div class="qualifier-row" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 800; font-size: 0.85rem; color: #d97706; min-width: 44px;">${rankBadge}</span>
          ${student.photo_url ? `<img src="${student.photo_url}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` : ''}
          <div>
            <strong style="font-size: 0.95rem; display: block; color: #0f172a;">${escapeHtml(item.student_name || 'Student')}</strong>
            <span style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(item.class_name || '')} ${escapeHtml(item.section || '')} • #${item.student_number || ''}</span>
          </div>
        </div>
        <div style="text-align: end;">
          <span style="font-weight: 700; color: var(--primary); font-size: 0.95rem;">${scoreVal} / ${maxScore}</span>
          <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">(${percent}%)</span>
        </div>
      </div>
    `;
  }).join('');
}

async function advanceStudentsToFinals() {
  const advancing = getAdvancingStudents();
  if (advancing.length === 0) {
    showToast(translate('no-eval-advance'), 'error');
    return;
  }

  const finalsNameInput = document.getElementById('target-finals-name');
  const finalsName = (finalsNameInput?.value || '').trim() || `Grand Finals ${new Date().toLocaleDateString()}`;

  const supabase = getSupabase();
  let newCompId = 'comp_' + Date.now();

  try {
    if (supabase) {
      const { data: newComp, error: compErr } = await supabase.from('competitions').insert([{
        name: finalsName,
        status: 'active'
      }]).select().single();

      if (!compErr && newComp) {
        newCompId = newComp.id;
      }
    } else {
      // Local fallback
      const localComps = competitions || [];
      localComps.push({ id: newCompId, name: finalsName, status: 'active', created_at: new Date().toISOString() });
      competitions = localComps;
    }

    const studentsToInsert = advancing.map((item, index) => {
      const origStudent = (roster || []).find(s => String(s.id) === String(item.student_id)) || {};
      return {
        id: 'std_' + Date.now() + '_' + index,
        competition_id: newCompId,
        student_number: origStudent.student_number || String(index + 1),
        name: origStudent.name || item.student_name,
        class_name: origStudent.class_name || item.class_name || '',
        section: origStudent.section || item.section || '',
        photo_url: origStudent.photo_url || ''
      };
    });

    if (supabase) {
      await supabase.from('students').insert(studentsToInsert.map(s => {
        const { id, ...rest } = s;
        return rest;
      }));
    }

    await loadCompetitions();
    closeQualifiersModal();

    const toastMsg = translate('qualifiers-advanced-toast').replace('{n}', advancing.length);
    showToast(toastMsg, 'success');

    if (typeof selectCompetition === 'function') {
      selectCompetition(newCompId, finalsName);
    }
  } catch (err) {
    console.error('Failed to advance qualifiers:', err);
    showToast('Failed to advance qualifiers: ' + err.message, 'error');
  }
}

async function openArchiveModal() {
  const modal = document.getElementById('archive-modal');
  if (!modal) return;
  modal.hidden = false;
  await renderHistoricalArchive();
}

function closeArchiveModal() {
  const modal = document.getElementById('archive-modal');
  if (modal) modal.hidden = true;
}

async function renderHistoricalArchive() {
  const timelineEl = document.getElementById('competitions-archive-timeline');
  if (!timelineEl) return;

  timelineEl.innerHTML = '<p class="empty-state-text" style="margin: 12px 0;">Loading historical archive...</p>';
  const supabase = getSupabase();
  let comps = competitions || [];

  if (supabase) {
    try {
      const { data } = await supabase.from('competitions').select('*').order('created_at', { ascending: false });
      if (data && data.length > 0) comps = data;
    } catch(e){}
  }

  if (!comps || comps.length === 0) {
    timelineEl.innerHTML = '<p class="empty-state-text">No past competitions found.</p>';
    return;
  }

  let allEvals = evaluations || [];
  if (supabase) {
    try {
      const { data: evalsData } = await supabase.from('evaluations').select('competition_id, student_name, student_id, total_score, created_at');
      if (evalsData) allEvals = evalsData;
    } catch(e){}
  }

  timelineEl.innerHTML = comps.map(comp => {
    const compEvals = (allEvals || []).filter(e => String(e.competition_id) === String(comp.id));
    const count = compEvals.length;
    let topScore = 0;
    let topStudent = 'None yet';

    const studentTotals = {};
    compEvals.forEach(e => {
      const sName = e.student_name || 'Contestant';
      const score = Number(e.total_score) || 0;
      if (!studentTotals[sName] || score > studentTotals[sName]) {
        studentTotals[sName] = score;
      }
    });

    Object.entries(studentTotals).forEach(([name, score]) => {
      if (score > topScore) {
        topScore = score;
        topStudent = name;
      }
    });

    const isCurrent = String(comp.id) === String(currentCompetitionId);
    const dateStr = comp.created_at ? new Date(comp.created_at).toLocaleDateString() : 'Active Event';

    return `
      <div class="archive-timeline-card" style="display: flex; justify-content: space-between; align-items: center; background: #ffffff; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,0.02);">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="font-size: 1rem; color: #1e293b;">${escapeHtml(comp.name)}</strong>
            ${isCurrent ? '<span style="font-size: 0.7rem; background: rgba(16,185,129,0.1); color: #10b981; padding: 2px 6px; border-radius: 10px; font-weight: 700;">CURRENT</span>' : ''}
          </div>
          <span style="font-size: 0.8rem; color: var(--text-muted);">${dateStr} • ${count} ${translate('comp-participants')}</span>
        </div>
        <div style="text-align: end;">
          <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">${translate('comp-top-score')}</span>
          <span style="font-weight: 800; color: #d97706; font-size: 0.95rem;">🥇 ${escapeHtml(topStudent)} (${topScore} pts)</span>
        </div>
      </div>
    `;
  }).join('');
}

async function searchStudentHistoricalProgress(query) {
  const resultsEl = document.getElementById('student-growth-results');
  if (!resultsEl) return;

  const q = (query || '').trim().toLowerCase();
  if (!q) {
    resultsEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic; margin: 0;">${translate('hint-search-student')}</p>`;
    return;
  }

  const supabase = getSupabase();
  let allEvals = evaluations || [];
  if (supabase) {
    try {
      const { data } = await supabase.from('evaluations').select('*');
      if (data && data.length > 0) allEvals = data;
    } catch(e){}
  }

  const matches = (allEvals || []).filter(e => 
    (e.student_name && e.student_name.toLowerCase().includes(q)) ||
    (e.student_number && String(e.student_number).toLowerCase().includes(q))
  );

  if (matches.length === 0) {
    resultsEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-muted); margin: 6px 0;">${translate('no-history-found')}</p>`;
    return;
  }

  matches.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

  const maxCriteriaScore = (CRITERIA_KEYS ? CRITERIA_KEYS.length : 6) * 10;
  const firstScore = Number(matches[0].total_score) || 0;
  const latestScore = Number(matches[matches.length - 1].total_score) || 0;
  const firstPercent = Math.round((firstScore / maxCriteriaScore) * 100);
  const latestPercent = Math.round((latestScore / maxCriteriaScore) * 100);
  const diff = latestPercent - firstPercent;
  const growthBadge = matches.length > 1
    ? (diff >= 0 
        ? `<span class="growth-badge" style="background: rgba(16,185,129,0.15); color: #10b981; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">+${diff}% Growth 🚀</span>`
        : `<span class="growth-badge" style="background: rgba(239,68,68,0.15); color: #ef4444; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700;">${diff}% Shift</span>`)
    : `<span style="font-size: 0.78rem; color: var(--text-muted);">(1 recorded evaluation)</span>`;

  resultsEl.innerHTML = `
    <div style="background: #ffffff; padding: 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <strong style="font-size: 1.05rem; color: #0f172a;">${escapeHtml(matches[0].student_name || 'Student')}</strong>
        ${growthBadge}
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${matches.map(m => {
          const comp = (competitions || []).find(c => String(c.id) === String(m.competition_id));
          const compName = comp ? comp.name : 'Competition';
          const score = Number(m.total_score) || 0;
          const pct = Math.round((score / maxCriteriaScore) * 100);
          const dateStr = m.created_at ? new Date(m.created_at).toLocaleDateString() : '';

          return `
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; padding: 6px 10px; background: rgba(0,0,0,0.02); border-radius: 4px;">
              <div>
                <span style="font-weight: 600; color: #1e293b;">${escapeHtml(compName)}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted); margin-inline-start: 6px;">${dateStr}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 80px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
                  <div style="width: ${Math.min(pct, 100)}%; height: 100%; background: var(--primary); border-radius: 3px;"></div>
                </div>
                <strong style="color: var(--primary); min-width: 45px; text-align: end;">${score} pts (${pct}%)</strong>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}
