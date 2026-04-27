const STORAGE_KEY = 'studentRoster';
const EVALUATIONS_KEY = 'evaluations';
const SETTINGS_KEY = 'tedtalk_settings';

let roster = [];
let evaluations = [];
let allCustomUsers = [];
let currentChannel = null;
let currentTab = localStorage.getItem('tedtalk_currentTab') || 'judging';
let currentSubTab = localStorage.getItem('tedtalk_currentSubTab') || 'students';
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

function getSupabase() {
  return window.supabaseClient || null;
}

// ===== INITIALIZATION =====

async function init() {
  console.log('TedTalk App v2.5 Loaded');
  bindAuthEvents();
  bindAppEvents();
  await loadSettings();
  await checkAuthState();
  
  if (isAuthenticated) {
    applyRolePermissions();
    // Initialize Realtime Channel
    const supabase = getSupabase();
    if (supabase) {
        currentChannel = supabase.channel('winners-display-channel').subscribe();
    }
    
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
  let settings = {};
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) settings = JSON.parse(stored);

  // Try to fetch from Supabase for global sync
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('site_settings').select('config').eq('id', 'global_config').single();
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

    container.innerHTML = CRITERIA_KEYS.map((key, index) => `
        <div class="criteria-item" style="${index > 0 ? 'margin-top: 20px;' : ''}">
            <label class="criteria-label">${criteriaLabels[key]}</label>
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
    `).join('');

    // Update total placeholder
    const totalScoreEl = document.getElementById('total-score');
    if (totalScoreEl) {
        totalScoreEl.textContent = `0 / ${CRITERIA_KEYS.length * 10}`;
    }
}

function applyBranding() {
  const stored = localStorage.getItem(SETTINGS_KEY);
  const settings = stored ? JSON.parse(stored) : {};

  const appName = settings.appName || 'TedTalk';
  const subtitle = settings.appSubtitle || 'Sign in to manage student evaluations';
  const logoSrc = settings.logoDataUrl || null;
  const primaryColor = settings.primaryColor || null;

  // App name
  document.title = appName + ' | Premium Edition';
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
  if (nameInput) nameInput.value = appName !== 'TedTalk' ? appName : '';
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
    showApp();
    switchTab(userRole === 'admin' ? 'setup' : 'judging');
    isAuthenticated = true;
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
  if (login) { login.hidden = false; login.style.display = 'flex'; }
  if (app) { app.hidden = true; app.style.display = 'none'; }
}

function showApp() {
  const login = document.getElementById('login-view');
  const app = document.getElementById('app-container');
  if (login) { login.hidden = true; login.style.display = 'none'; }
  if (app) { app.hidden = false; app.style.display = 'block'; }
  console.log('App view activated.');
}

function switchTab(tabName) {
  if ((tabName === 'setup' || tabName === 'results') && userRole !== 'admin') {
    tabName = 'judging';
  }
  currentTab = tabName;
  localStorage.setItem('tedtalk_currentTab', tabName);

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
  localStorage.setItem('tedtalk_currentSubTab', subtabName);

  document.querySelectorAll('.sub-tab-bar .sub-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.subtab === subtabName);
  });

  const subPanelMap = {
    'students': 'students-subpanel',
    'users': 'users-subpanel',
    'config': 'config-subpanel'
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

  // Refresh branding fields and winner dropdown when admin opens the config tab
  if (subtabName === 'config') {
    applyBranding();
    populateWinnerSelect();
  }
}

// ===== AUTH CORE =====

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
    const { data, error } = await supabase.from('custom_users')
      .select('*').eq('username', username).maybeSingle();
      
    if (error) {
        console.error('Supabase query error:', error);
        throw new Error('Database connection issue');
    }

    if (data) {
      const inputHash = await hashPassword(password);
      if (inputHash === data.password_hash) {
        console.log('Password verified successfully.');
        setAndInitSession(data.id, data.username, data.role);
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
            setAndInitSession(newUser.id, newUser.username, newUser.role);
            return;
        }
    }

    const storedUserStr = localStorage.getItem('user_' + username);
    if (storedUserStr) {
      const user = JSON.parse(storedUserStr);
      if (user.password === password) {
        setAndInitSession(user.id || 'legacy-user', username, user.role || 'judge');
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

async function setAndInitSession(id, username, role) {
  currentUserId = id;
  userRole = role;
  localStorage.setItem('currentUserId', id);
  localStorage.setItem('currentUsername', username);
  localStorage.setItem('currentUserRole', role);
  isAuthenticated = true;
  
  // Show app UI first
  showApp();
  
  // Switch to correct tab immediately to prevent flash of wrong content
  switchTab(userRole === 'admin' ? 'setup' : 'judging');
  
  // Then load data and settings
  await loadSettings();
  applyRolePermissions();
  await loadRoster();
  await loadEvaluations();
  updateFilterDropdowns();
  populateStudentSelect();
  populateWinnerSelect();
  renderRolePanel();
  bindAppEvents(); // Crucial: bind events after UI is shown
}

function handleLogout() {
  localStorage.removeItem('currentUserId');
  localStorage.removeItem('currentUsername');
  localStorage.removeItem('currentUserRole');
  localStorage.removeItem('tedtalk_currentTab');
  localStorage.removeItem('tedtalk_currentSubTab');
  location.reload();
}

// ===== DATA OPERATIONS =====

async function loadRoster() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('students').select('*').order('number');
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

async function loadEvaluations() {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false });
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
  renderJudgingSidebar();
}

async function saveEvaluation() {
  const select = document.getElementById('student-select');
  if (!select || !select.value) return showToast('Please select a student first.', 'error');

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
    return showToast('Please complete all evaluation criteria.', 'error');
  }

  const judgeName = localStorage.getItem('currentUsername') || 'Judge';
  const evaluation = {
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
  if (supabase) {
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
      await loadEvaluations();
      updateResultFilterOptions(); 
      await renderResults();
      renderJudgingSidebar(); 
      showToast(existingEval ? 'Evaluation updated!' : 'Evaluation saved!');
      autoAdvance(); 
      return;
    } else {
      console.error('Supabase evaluation error details:', error);
      showToast('Supabase Error: ' + (error.message || 'Check console'), 'error');
    }
  }

  // Offline / Manual Management
  if (existingEval) {
    const idx = evaluations.findIndex(e => e.student_id === studentId && e.judge_id === currentUserId);
    evaluation.created_at = new Date().toISOString();
    evaluation.id = existingEval.id;
    evaluations[idx] = evaluation;
  } else {
    evaluation.created_at = new Date().toISOString();
    evaluation.id = crypto.randomUUID();
    evaluations.push(evaluation);
  }
  
  localStorage.setItem(EVALUATIONS_KEY, JSON.stringify(evaluations));
  await renderResults();
  renderJudgingSidebar();
  showToast(existingEval ? 'Evaluation updated (Offline).' : 'Evaluation saved (Offline).');
  autoAdvance();
}

// ===== TIMER LOGIC =====

function startTimer() {
  if (timerIsRunning) {
    clearInterval(timerInterval);
    timerIsRunning = false;
    document.getElementById('timer-start').textContent = 'Resume';
  } else {
    timerIsRunning = true;
    document.getElementById('timer-start').textContent = 'Pause';
    timerInterval = setInterval(() => {
      if (timerRemaining > 0) {
        timerRemaining--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerIsRunning = false;
        document.getElementById('timer-start').textContent = 'Time Up';
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
  const { data, error } = await supabase.from('custom_users').select('*').order('username');
  if (!error) allCustomUsers = data || [];
}

function renderRolePanel() {
  const container = document.getElementById('role-users-list');
  if (!container) return;
  container.innerHTML = allCustomUsers.map(u => `
    <div class="user-card">
      <div>
        <span class="user-info-name">${escapeHtml(u.username)}</span>
        <span class="user-info-role">${u.role}</span>
      </div>
      <div style="display:flex; gap:8px;">
        <button class="btn" style="padding: 4px 12px; font-size: 0.8rem; background: rgba(79, 70, 229, 0.1); color: var(--primary); border: 1px solid rgba(79, 70, 229, 0.2);" onclick="startEditUser('${u.id}')">Edit</button>
        <button class="btn btn-logout" style="padding: 4px 12px; font-size: 0.8rem; background: rgba(239, 68, 68, 0.1); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.2);" onclick="deleteCustomUser('${u.id}')">Delete</button>
      </div>
    </div>
  `).join('') || '<p class="empty-state-text">No custom users yet.</p>';
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
  
  if (!username) return showToast('Username is required', 'error');
  if (!editingUserId && !password) return showToast('Password is required for new users', 'error');
  
  const supabase = getSupabase();
  if (!supabase) return;

  const userData = { username, role };
  if (password) {
    userData.password_hash = await hashPassword(password);
  }

  try {
    if (editingUserId) {
      const { error } = await supabase.from('custom_users').update(userData).eq('id', editingUserId);
      if (error) throw error;
      showToast('User updated successfully');
      cancelEditUser();
    } else {
      const { error } = await supabase.from('custom_users').insert([userData]);
      if (error) throw error;
      showToast('User created successfully');
      document.getElementById('new-user-username').value = '';
      document.getElementById('new-user-password').value = '';
    }
    await loadAllCustomUsers();
    renderRolePanel();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteCustomUser(id) {
  if (!confirm('Delete user?')) return;
  const supabase = getSupabase();
  if (supabase) await supabase.from('custom_users').delete().eq('id', id);
  await loadAllCustomUsers();
  renderRolePanel();
}

// ===== ROSTER & STUDENTS =====

async function handleAddStudent(e) {
  e.preventDefault();
  const student = {
    number: document.getElementById('student-number').value.trim(),
    name: document.getElementById('student-name').value.trim(),
    class_name: document.getElementById('student-class').value.trim(),
    section: document.getElementById('student-section').value.trim() || null
  };
  
  if (!student.number || !student.name) return showToast('Number and Name are required', 'error');

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
        showToast('Error uploading photo: ' + uploadError.message, 'error');
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
      showToast('Student updated successfully');
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
      showToast('Student added successfully');
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
    showToast('Error: ' + (err.message || 'Database error'), 'error');
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
  const file = fileInput.files[0];
  if (!file) return showToast('Please select a CSV file first', 'error');

  const text = await file.text();
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  const newStudents = [];
  
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0] && parts[1]) {
      newStudents.push({
        number: parts[0],
        name: parts[1],
        class_name: parts[2] || '',
        section: parts[3] || ''
      });
    }
  }

  if (newStudents.length === 0) return showToast('No valid student data found in CSV', 'error');

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
      showToast(`Successfully imported ${newStudents.length} students`);
    } else {
      showToast('Error importing students: ' + error.message, 'error');
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
    showToast(`Successfully imported ${newStudents.length} students (Offline)`);
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
    showToast('Reordered students...');

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
            showToast('Error saving order to server', 'error');
        } else {
            showToast('Order saved successfully!');
        }
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
        showToast('Order saved locally.');
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

    classSelect.innerHTML = '<option value="">All Classes</option>' + 
        classes.map(c => `<option value="${escapeHtml(c)}" ${c === currentClass ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    
    sectionSelect.innerHTML = '<option value="">All Sections</option>' + 
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

function renderCriteriaManager() {
    const list = document.getElementById('cfg-criteria-list');
    if (!list) return;

    if (CRITERIA_KEYS.length === 0) {
        list.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No criteria defined.</p>';
        return;
    }

    list.innerHTML = CRITERIA_KEYS.map(key => `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; padding: 12px; background: var(--bg); border-radius: var(--radius-sm); border: 1px solid var(--border);">
            <div style="flex: 1;">
                <input type="text" class="form-input criteria-edit-input" data-key="${key}" value="${criteriaLabels[key]}" style="padding: 6px 10px;">
            </div>
            <button class="btn btn-logout" onclick="deleteCriterion('${key}')" style="color: var(--danger); border-color: var(--danger); padding: 6px 12px;">Delete</button>
        </div>
    `).join('') + `
        <button id="save-all-criteria-btn" class="btn btn-login" style="width: 100%; margin-top: 10px;">💾 Save Criteria Changes</button>
    `;

    // Bind save all button
    const saveBtn = document.getElementById('save-all-criteria-btn');
    if (saveBtn) {
        saveBtn.onclick = saveAllCriteria;
    }
}

async function saveAllCriteria() {
    const inputs = document.querySelectorAll('.criteria-edit-input');
    const newCriteria = [];
    inputs.forEach(input => {
        newCriteria.push({
            id: input.dataset.key,
            label: input.value.trim() || 'Untitled Criterion'
        });
    });

    const stored = localStorage.getItem(SETTINGS_KEY);
    const settings = stored ? JSON.parse(stored) : {};
    settings.criteria = newCriteria;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    syncSettingsToSupabase(settings);

    // Update local variables
    CRITERIA_KEYS = newCriteria.map(c => c.id);
    criteriaLabels = {};
    newCriteria.forEach(c => criteriaLabels[c.id] = c.label);

    renderCriteriaMatrix();
    renderCriteriaManager();
    showToast('Criteria updated successfully! ✨');
}

async function addTodoCriterion() {
    const input = document.getElementById('cfg-new-criterion-label');
    const label = input.value.trim();
    if (!label) return showToast('Please enter a criterion name.', 'error');

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
    showToast('Criterion added!');
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
    showToast('Criterion removed.');
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
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">No results found</td></tr>';
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
          <td style="text-align:center;"><button class="btn btn-logout" style="padding:4px 12px; font-size:0.8rem;" onclick="toggleDetails('${r.student_id}')">View</button></td>
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
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:2rem;">No raw evaluations found</td></tr>';
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
  
  return Object.values(studentEvals).map(r => ({
    ...r,
    average_total: (r.sum_total / r.all_evaluations.length).toFixed(1)
  })).sort((a,b) => parseFloat(b.average_total) - parseFloat(a.average_total) || b.highest_total - a.highest_total);
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

    gradeSelect.innerHTML = '<option value="">All Grades</option>' + 
        Array.from(grades).sort().map(g => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('');
    
    sectionSelect.innerHTML = '<option value="">All Sections</option>' + 
        Array.from(sections).sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');

    gradeSelect.value = grades.has(currentGrade) ? currentGrade : "";
    sectionSelect.value = sections.has(currentSection) ? currentSection : "";
}

async function exportToCSV() {
  const aggregated = getAggregatedResults();
  if (aggregated.length === 0) return showToast('No results to export', 'error');
  let csv = 'Rank,Number,Name,Class,Average Score,Highest Score,Evaluations Count\n';
  aggregated.forEach((r, i) => {
    csv += `${i+1},${r.student_number},"${r.student_name}",${r.class_name},${r.average_total},${r.highest_total},${r.all_evaluations.length}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `tedtalk-results-${new Date().toISOString().split('T')[0]}.csv`;
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
  select.innerHTML = '<option value="">-- Select a student --</option>' + 
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
        document.getElementById('total-score').textContent = calculateTotal() + ' / ' + totalMax;
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
      showToast('Timer settings saved!');
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
          showToast('Branding saved! ✨');
        };
        reader.readAsDataURL(logoFile);
      } else if (preview.src.includes('icons/logo.png') || preview.src.endsWith('icons/logo.png')) {
        // Reset logo
        delete settings.logoDataUrl;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        syncSettingsToSupabase(settings);
        applyBranding();
        showToast('Branding saved! ✨');
      } else {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        syncSettingsToSupabase(settings);
        applyBranding();
        showToast('Branding saved! ✨');
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
      showToast('Filters reset');
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
      if (prompt('Type DELETE to confirm:') === 'DELETE') {
          const supabase = getSupabase();
          if (supabase) {
              await supabase.from('evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
          }
          evaluations = [];
          localStorage.removeItem(EVALUATIONS_KEY);
          renderResults();
          showToast('Data cleared');
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
              if (error) return showToast('Error deleting: ' + error.message, 'error');
          }
          roster = roster.filter(s => !selectedStudents.has(s.id));
          selectedStudents.clear();
          if (!supabase) localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
          renderRoster();
          populateStudentSelect();
          populateWinnerSelect();
          showToast('Students deleted successfully');
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
              showToast('No students selected', 'error');
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
              showToast(`Updated ${ids.length} students successfully!`);
          } catch (err) {
              console.error('Bulk update error details:', err);
              showToast('Error updating: ' + (err.message || 'Unknown error'), 'error');
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
        showToast('Please drop a valid CSV file.', 'error');
      }
    }, false);
  }

  const importBtnEl = document.getElementById('import-btn');
  if (importBtnEl) importBtnEl.onclick = importStudents;
  
  const createUserBtn = document.getElementById('create-user-btn');
  if (createUserBtn) createUserBtn.onclick = createCustomUser;
  
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
        return `
            <div class="sidebar-student-item ${isActive ? 'active' : ''} ${isEval ? 'evaluated' : ''}" onclick="selectStudentForJudging('${s.id}')">
                <div style="display:flex; align-items:center;">
                    <div class="status-dot"></div>
                    <div>
                        <div style="font-weight:600;">${escapeHtml(s.name)}</div>
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
        
        if (badge) {
            badge.textContent = student ? `Judging: ${student.name}` : '';
            if (isEval) {
                badge.innerHTML += ` <span style="color:var(--danger); font-size:0.8rem; margin-left:10px;">(Already Evaluated)</span>`;
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
        showToast('All students in roster have been evaluated!', 'success');
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
    if (!confirm('Are you sure you want to delete this student?')) return;
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
  a.download = 'tedtalk_students_template.csv';
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
                localStorage.setItem('tedtalk_theme', newTheme);
                
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
    defaultOption.textContent = '-- No students available --';
    select.appendChild(defaultOption);
    return;
  }

  defaultOption.textContent = '-- Choose a student --';
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
    return showToast('Please select a student first.', 'error');
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
        showToast('Photo upload failed, pushing without photo.', 'error');
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
      .eq('is_active', true);

    // Insert new winner
    const record = {
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

    showToast('🏆 Winner pushed to display screen!');

    // Reset form
    winnerPhotoFile = null;
    const photoInput = document.getElementById('winner-photo-upload');
    if (photoInput) photoInput.value = '';
    const preview = document.getElementById('winner-photo-preview');
    if (preview) preview.style.display = 'none';

  } catch (err) {
    showToast('Error: ' + err.message, 'error');
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

    showToast('Winner display cleared.');
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}
