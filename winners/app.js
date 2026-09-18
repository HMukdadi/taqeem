// ===== WINNERS DISPLAY — Supabase Realtime Listener =====
// This page is DISPLAY ONLY. All control happens from the admin panel.

let supabaseClient = null;
let audioUnlocked = false;
let currentWinnerId = null;
let currentCompetitionId = new URLSearchParams(window.location.search).get('comp');

const translations = {
    en: {
        'app-name': 'Taqeem',
        'waiting': 'Waiting for announcement...',
        'unlock-audio': 'Enable Sound for Reveal',
        'congrats': 'CONGRATULATIONS',
        'grade': 'Grade',
        'section': 'Section'
    },
    ar: {
        'app-name': 'تقييم',
        'waiting': 'بانتظار الإعلان عن الفائز...',
        'unlock-audio': 'تفعيل الصوت للعرض',
        'congrats': 'ألف مبروك',
        'grade': 'الصف',
        'section': 'الشعبة'
    }
};

let currentLang = localStorage.getItem('taqeem_lang') || 'en';

function translate(key) {
    return translations[currentLang][key] || key;
}

function setLanguage(lang) {
    currentLang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = translate(key);
    });

    const pageTitle = document.getElementById('page-title');
    if (pageTitle) pageTitle.textContent = (lang === 'ar' ? '🏆 إعلان الفائز' : '🏆 Winner Announcement');

    const idleTitle = document.getElementById('idle-title');
    if (idleTitle) idleTitle.textContent = translate('app-name');
}

// Sync language from main app
window.addEventListener('storage', (e) => {
    if (e.key === 'taqeem_lang' && e.newValue) {
        setLanguage(e.newValue);
    }
});


// ===== INITIALIZATION =====


function initSupabase() {
  try {
    if (window.supabaseClient) {
      supabaseClient = window.supabaseClient;
      console.log('✅ Supabase initialized for Winners Display');
      return true;
    }
  } catch (err) {
    console.error('Supabase init error:', err);
  }
  
  console.error('❌ Supabase library missing or init failed');
  return false;
}

async function init() {
  console.log('🚀 Loading Winners Celebration Screen...');
  
  if (!initSupabase()) {
    setTimeout(init, 2000);
    return;
  }

  setLanguage(currentLang);

  // Load branding safely
  try {
    applyBranding();
  } catch (err) {
    console.warn('Branding load failed:', err);
  }

  // Show audio unlock button
  showAudioUnlock();

  // Subscribe to real-time changes
  subscribeToWinners();

  // Load current winner
  await checkCurrentWinner();

  // Load competition name
  await fetchCompetitionName();
}

async function fetchCompetitionName() {
  if (!currentCompetitionId || !supabaseClient) return;
  try {
    const { data, error } = await supabaseClient
      .from('competitions')
      .select('name')
      .eq('id', currentCompetitionId)
      .single();
    
    if (data && data.name) {
      const titleEl = document.getElementById('idle-title');
      if (titleEl) titleEl.textContent = data.name;
      document.title = '🏆 ' + data.name + ' — Winner';
    }
  } catch (err) {
    console.warn('Failed to fetch competition name:', err);
  }
}

// ===== BRANDING =====

function applyBranding() {
  try {
    const stored = localStorage.getItem('taqeem_settings');
    if (!stored) return;
    
    const settings = JSON.parse(stored);
    const appName = settings.appName || 'Taqeem';
    const logoSrc = settings.logoDataUrl || null;

    const titleEl = document.getElementById('idle-title');
    if (titleEl) titleEl.textContent = appName;
    document.title = '🏆 ' + appName + ' — Winner';

    if (logoSrc) {
      const logoEl = document.getElementById('idle-logo');
      if (logoEl) logoEl.src = logoSrc;
    }
  } catch (err) {
    console.warn('Storage access restricted in this browser mode:', err.message);
  }
}

// ===== AUDIO =====

function showAudioUnlock() {
  const overlay = document.getElementById('audio-unlock');
  const btn = document.getElementById('unlock-btn');
  
  if (overlay) overlay.style.display = 'block';
  
  if (btn) {
    btn.onclick = async () => {
      // Audio unlock flow
      const celebAudio = document.getElementById('celebration-audio');
      const drumAudio = document.getElementById('drumroll-audio');
      const idleAudio = document.getElementById('idle-audio');
      
      const unlock = async (audio) => {
        if (!audio) return;
        audio.volume = 0;
        try {
          await audio.play();
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        } catch (err) {}
      };

      // Wait for all audio elements to be properly unlocked
      await Promise.all([
        unlock(celebAudio),
        unlock(drumAudio),
        unlock(idleAudio)
      ]);
      
      audioUnlocked = true;
      overlay.style.display = 'none';
      console.log('🔊 Audio unlocked successfully');

      // Start idle music if we are on the idle screen
      if (!currentWinnerId) {
        startIdleMusic();
      }
    };
  }
}

function startIdleMusic() {
  if (!audioUnlocked) return;
  const audio = document.getElementById('idle-audio');
  if (audio) {
    audio.loop = true; // Reinforce looping
    audio.volume = 0;
    audio.play().then(() => {
      console.log('🎵 Idle music started looping');
      // Fade in
      let vol = 0;
      const interval = setInterval(() => {
        vol += 0.05;
        if (vol >= 1.0) {
          audio.volume = 1.0;
          clearInterval(interval);
        } else {
          audio.volume = vol;
        }
      }, 50);
    }).catch(err => {
      console.error('❌ Idle music play failed:', err);
      // Attempt restart if it was a temporary block
      setTimeout(startIdleMusic, 3000);
    });
  }
}

function stopIdleMusic() {
  const audio = document.getElementById('idle-audio');
  if (audio && !audio.paused) {
    // Fade out
    let vol = audio.volume;
    const interval = setInterval(() => {
      vol -= 0.05;
      if (vol <= 0) {
        audio.volume = 0;
        audio.pause();
        clearInterval(interval);
      } else {
        audio.volume = vol;
      }
    }, 50);
  }
}

let stageAudioMuted = false;
let webAudioCtx = null;
let lastChimePlayedSecond = null;

function getWebAudioContext() {
  if (!webAudioCtx && (window.AudioContext || window.webkitAudioContext)) {
    webAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (webAudioCtx && webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

function playWebAudioChime(type) {
  if (stageAudioMuted) return;
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'warning-30s') {
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
  } else if (type === 'overtime') {
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

function toggleStageAudio() {
  stageAudioMuted = !stageAudioMuted;
  const btn = document.getElementById('stage-audio-toggle');
  const icon = document.getElementById('stage-audio-icon');

  if (btn) {
    if (stageAudioMuted) btn.classList.add('muted');
    else btn.classList.remove('muted');
  }
  if (icon) {
    icon.textContent = stageAudioMuted ? '🔇' : '🔊';
  }

  const idleAudio = document.getElementById('idle-audio');
  if (idleAudio) {
    idleAudio.muted = stageAudioMuted;
  }
}

function playCelebration() {
  if (stageAudioMuted) return;
  const customAnthem = localStorage.getItem('taqeem_custom_anthem');
  if (customAnthem) {
    try {
      const customAudio = new Audio(customAnthem);
      customAudio.volume = 0.8;
      customAudio.play().catch(err => {
        console.warn('Custom anthem playback failed, fallback to default:', err);
        fallbackCelebrationAudio();
      });
      return;
    } catch (e) {
      console.warn('Custom anthem init failed:', e);
    }
  }
  fallbackCelebrationAudio();
}

function fallbackCelebrationAudio() {
  if (!audioUnlocked || stageAudioMuted) return;
  const audio = document.getElementById('celebration-audio');
  if (audio) {
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch(err => console.warn('Audio play failed:', err));
  }
}

function playDrumroll() {
  if (!audioUnlocked) return;
  const audio = document.getElementById('drumroll-audio');
  if (audio) {
    audio.currentTime = 0;
    audio.volume = 0.5;
    audio.play().catch(err => console.warn('Drumroll play failed:', err));
  }
}

// ===== SUPABASE REALTIME =====

function subscribeToWinners() {
  if (!supabaseClient) return;

  const channelName = currentCompetitionId ? `winners-display-${currentCompetitionId}` : 'winners-display-channel';
  const filterString = currentCompetitionId ? `competition_id=eq.${currentCompetitionId}` : undefined;

  const channel = supabaseClient
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'winners_display',
        filter: filterString
      },
      (payload) => {
        console.log('🏆 Realtime: New winner received!', payload.new);
        revealWinner(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'winners_display',
        filter: filterString
      },
      (payload) => {
        console.log('🔄 Realtime: Winner updated!', payload.new);
        if (payload.new.is_active) {
          revealWinner(payload.new);
        } else {
          hideWinner();
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'winners_display',
        filter: filterString
      },
      () => {
        console.log('🗑️ Realtime: Winner removed');
        hideWinner();
      }
    )
    .on(
      'broadcast',
      { event: 'winner-reveal' },
      (payload) => {
        console.log('📣 Broadcast: Winner received!', payload.payload);
        revealWinner(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'podium-reveal' },
      (payload) => {
        console.log('📣 Broadcast: Podium reveal received!', payload.payload);
        revealPodium(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'stage-timer-sync' },
      (payload) => {
        handleStageTimerSync(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'show-audience-voting' },
      (payload) => {
        showAudienceVotingScreen(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'audience-vote-cast' },
      (payload) => {
        handleAudienceVoteCast(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'reveal-audience-favorite' },
      (payload) => {
        revealAudienceFavorite(payload.payload);
      }
    )
    .on(
      'broadcast',
      { event: 'clear-display' },
      () => {
        console.log('📣 Broadcast: Clear display');
        hideWinner();
      }
    )
    .subscribe((status) => {
      console.log('📡 Realtime status:', status);
      if (status === 'SUBSCRIBED') {
        // Connected
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        // Error
      }
    });
}

async function checkCurrentWinner(isPolling = false) {
  if (!supabaseClient) return;

  try {
    let query = supabaseClient
      .from('winners_display')
      .select('*')
      .eq('is_active', true);
      
    if (currentCompetitionId) {
      query = query.eq('competition_id', currentCompetitionId);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (!isPolling) {
        console.error('❌ Could not fetch current winner:', error.message);
      }
      return;
    }

    if (data) {
      // If we found an active winner and it's not the one we are currently showing
      if (currentWinnerId !== data.id) {
        if (!isPolling) console.log('📋 Existing winner found on load:', data);
        else console.log('🔄 Polling: New winner detected!', data);
        revealWinner(data);
      }
    } else {
      // If there is no active winner in DB, but we are displaying one
      if (currentWinnerId !== null) {
        console.log('🔄 Polling: Display cleared in DB.');
        hideWinner();
      }
    }
  } catch (err) {
    if (!isPolling) console.warn('Init check failed:', err.message);
  }
}

// Set up Bulletproof Polling Fallback (runs every 3 seconds)
setInterval(() => {
  checkCurrentWinner(true);
}, 3000);

// ===== WINNER REVEAL =====

function revealWinner(winner) {
  if (!winner || winner.id === currentWinnerId) return;
  
  currentWinnerId = winner.id;
  
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const winnerName = document.getElementById('winner-name');
  const winnerDetails = document.getElementById('winner-details');
  const winnerPhoto = document.getElementById('winner-photo');
  const photoFrame = document.getElementById('photo-frame');
  const winnerContent = document.getElementById('winner-content');

  // Set data
  winnerName.textContent = winner.student_name || 'Winner';
  
  const details = [];
  if (winner.class_name) details.push(translate('grade') + ': ' + winner.class_name);
  if (winner.section) details.push(translate('section') + ': ' + winner.section);
  winnerDetails.textContent = details.join(' • ') || '';

  // Handle photo
  if (winner.photo_url) {
    winnerPhoto.src = winner.photo_url;
    photoFrame.classList.remove('no-photo');
  } else {
    photoFrame.classList.add('no-photo');
  }

  // Handle audio transitions
  stopIdleMusic();
  playDrumroll();

  // Brief darkness/suspense, then reveal
  winnerContent.classList.remove('revealed');
  
  // Switch screens
  setTimeout(() => {
    idleScreen.style.display = 'none';
    winnerScreen.hidden = false;
    
    // Spawn ambient particles
    spawnParticles();
    
    // Start reveal animation cascade
    setTimeout(() => {
      winnerContent.classList.add('revealed');
      
      // After the name is visible, fire confetti + celebration audio
      setTimeout(() => {
        playCelebration();
        fireConfetti();
        // Second burst for "Double Fireworks"
        setTimeout(fireConfetti, 2000); 
      }, 800);
      
    }, 200);
  }, 800);
}

function handleStageTimerSync(payload) {
  const liveScreen = document.getElementById('live-speaker-screen');
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const podiumScreen = document.getElementById('podium-screen');

  if (!liveScreen) return;

  if (payload && (payload.isRunning || (payload.remaining > 0 && payload.studentName))) {
    if (winnerScreen) winnerScreen.hidden = true;
    if (podiumScreen) podiumScreen.hidden = true;
    if (idleScreen) idleScreen.style.display = 'none';
    liveScreen.hidden = false;

    const nameEl = document.getElementById('live-speaker-name');
    const metaEl = document.getElementById('live-speaker-meta');
    const clockEl = document.getElementById('stage-timer-clock');
    const photoEl = document.getElementById('live-speaker-photo');

    if (nameEl) nameEl.textContent = payload.studentName || 'Student Speaker';
    if (metaEl) metaEl.textContent = payload.studentClass || '';
    if (photoEl && payload.studentPhoto) photoEl.src = payload.studentPhoto;

    if (clockEl) {
      const minutes = Math.floor(payload.remaining / 60);
      const seconds = payload.remaining % 60;
      clockEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      
      clockEl.classList.remove('warning', 'expired');
      if (payload.remaining === 0) {
        clockEl.classList.add('expired');
        if (lastChimePlayedSecond !== 0 && payload.chimesEnabled !== false) {
          lastChimePlayedSecond = 0;
          playWebAudioChime('overtime');
        }
      } else if (payload.remaining <= 30) {
        clockEl.classList.add('warning');
        if (payload.remaining === 30 && lastChimePlayedSecond !== 30 && payload.chimesEnabled !== false) {
          lastChimePlayedSecond = 30;
          playWebAudioChime('warning-30s');
        }
      } else {
        lastChimePlayedSecond = null;
      }
    }
  } else if (payload && !payload.isRunning && payload.remaining === 0) {
    // Keep showing expired for a bit or until next action
  }
}

async function revealPodium(payload) {
  const liveScreen = document.getElementById('live-speaker-screen');
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const podiumScreen = document.getElementById('podium-screen');

  if (!podiumScreen || !payload || !payload.top3) return;

  if (idleScreen) idleScreen.style.display = 'none';
  if (winnerScreen) winnerScreen.hidden = true;
  if (liveScreen) liveScreen.hidden = true;

  podiumScreen.hidden = false;

  const top3 = payload.top3;
  
  const col1 = document.getElementById('podium-rank-1');
  const col2 = document.getElementById('podium-rank-2');
  const col3 = document.getElementById('podium-rank-3');

  [col1, col2, col3].forEach(c => c?.classList.remove('revealed'));

  if (payload.competitionName) {
    const compEl = document.getElementById('podium-comp-title');
    if (compEl) compEl.textContent = payload.competitionName;
  }

  if (top3[0]) {
    document.getElementById('podium-name-1').textContent = top3[0].student_name || top3[0].name || '';
    document.getElementById('podium-class-1').textContent = `${top3[0].class_name || ''} ${top3[0].section || ''}`;
    if (top3[0].photo_url) document.getElementById('podium-photo-1').src = top3[0].photo_url;
  }
  if (top3[1]) {
    document.getElementById('podium-name-2').textContent = top3[1].student_name || top3[1].name || '';
    document.getElementById('podium-class-2').textContent = `${top3[1].class_name || ''} ${top3[1].section || ''}`;
    if (top3[1].photo_url) document.getElementById('podium-photo-2').src = top3[1].photo_url;
  }
  if (top3[2]) {
    document.getElementById('podium-name-3').textContent = top3[2].student_name || top3[2].name || '';
    document.getElementById('podium-class-3').textContent = `${top3[2].class_name || ''} ${top3[2].section || ''}`;
    if (top3[2].photo_url) document.getElementById('podium-photo-3').src = top3[2].photo_url;
  }

  playDrumroll();

  // Reveal 3rd place first
  setTimeout(() => {
    col3?.classList.add('revealed');
  }, 1200);

  // Reveal 2nd place
  setTimeout(() => {
    col2?.classList.add('revealed');
  }, 3000);

  // Reveal 1st place with celebration
  setTimeout(() => {
    col1?.classList.add('revealed');
    playCelebration();
    fireConfetti();
    setTimeout(fireConfetti, 1500);
  }, 5000);
}

function hideWinner() {
  currentWinnerId = null;
  
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const winnerContent = document.getElementById('winner-content');
  const liveScreen = document.getElementById('live-speaker-screen');
  const podiumScreen = document.getElementById('podium-screen');
  const particles = document.getElementById('particles');

  if (winnerContent) winnerContent.classList.remove('revealed');
  if (liveScreen) liveScreen.hidden = true;
  if (podiumScreen) podiumScreen.hidden = true;
  const audienceScreen = document.getElementById('audience-vote-screen');
  if (audienceScreen) audienceScreen.hidden = true;

  setTimeout(() => {
    if (winnerScreen) winnerScreen.hidden = true;
    if (idleScreen) idleScreen.style.display = 'flex';
    if (particles) particles.innerHTML = '';
    startIdleMusic();
  }, 600);
}

// ===== CONFETTI =====

function fireConfetti() {
  const defaults = {
    spread: 70,
    ticks: 200,
    gravity: 0.8,
    decay: 0.94,
    startVelocity: 35,
    colors: ['#fbbf24', '#fde68a', '#f59e0b', '#ffffff', '#d97706']
  };

  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.15, y: 0.6 },
    angle: 60
  });

  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.85, y: 0.6 },
    angle: 120
  });

  setTimeout(() => {
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { x: 0.5, y: 0.3 },
      colors: ['#fbbf24', '#fde68a', '#f59e0b', '#fff', '#7c3aed'],
      ticks: 300,
      gravity: 0.6,
      startVelocity: 45,
      shapes: ['circle', 'square']
    });
  }, 500);
}

// ===== PARTICLES =====

function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  container.innerHTML = '';
  
  const count = 40;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.width = (Math.random() * 4 + 2) + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDuration = (Math.random() * 6 + 4) + 's';
    particle.style.animationDelay = (Math.random() * 5) + 's';
    particle.style.background = Math.random() > 0.5 ? 'var(--gold)' : 'rgba(255,255,255,0.6)';
    container.appendChild(particle);
  }
}

// ===== LAUNCH =====

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ===== AUDIENCE CHOICE VOTING HANDLERS =====
let audienceVotesCount = 0;

function showAudienceVotingScreen(payload) {
  hideWinner();
  const idleScreen = document.getElementById('idle-screen');
  const screen = document.getElementById('audience-vote-screen');
  const canvas = document.getElementById('stage-audience-qr');
  const titleEl = document.getElementById('audience-vote-comp-title');

  if (idleScreen) idleScreen.style.display = 'none';

  if (payload && payload.competitionName && titleEl) {
    titleEl.textContent = `${payload.competitionName} • Scan with smartphone camera to vote!`;
  }

  if (screen) screen.hidden = false;

  if (canvas && window.TaqeemQR && payload && payload.voteUrl) {
    window.TaqeemQR.renderToCanvas(canvas, payload.voteUrl, {
      size: 260,
      darkColor: '#1e1b4b',
      lightColor: '#ffffff'
    });
  }
}

function handleAudienceVoteCast(payload) {
  audienceVotesCount++;
  const counterEl = document.getElementById('live-vote-counter-text');
  if (counterEl) {
    counterEl.textContent = `Votes Cast: ${audienceVotesCount} (أصوات مسجلة)`;
  }
}

function revealAudienceFavorite(payload) {
  if (!payload) return;
  hideWinner();
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const winnerContent = document.getElementById('winner-content');
  const nameEl = document.getElementById('winner-name');
  const detailsEl = document.getElementById('winner-details');
  const photoEl = document.getElementById('winner-photo');
  const trophyEl = document.getElementById('trophy-icon');

  if (idleScreen) idleScreen.style.display = 'none';
  if (trophyEl) trophyEl.textContent = '🌟';
  if (nameEl) nameEl.textContent = payload.winner || 'Fan Favorite';
  if (detailsEl) detailsEl.textContent = `${payload.className || ''} • 🗳️ AUDIENCE CHOICE AWARD • اختيار الجمهور`;
  if (photoEl && payload.photoUrl) photoEl.src = payload.photoUrl;

  if (winnerScreen) winnerScreen.hidden = false;
  if (winnerContent) winnerContent.classList.add('revealed');

  playDrumroll();
  setTimeout(() => {
    playCelebration();
    fireConfetti();
    setTimeout(fireConfetti, 1500);
  }, 2000);
}

window.toggleStageAudio = toggleStageAudio;
window.playWebAudioChime = playWebAudioChime;
