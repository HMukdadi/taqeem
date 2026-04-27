// ===== WINNERS DISPLAY — Supabase Realtime Listener =====
// This page is DISPLAY ONLY. All control happens from the admin panel.

const SUPABASE_URL = 'https://mdzsxzrisfxgebtgetxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kenN4enJpc2Z4Z2VidGdldHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NTA5MTEsImV4cCI6MjA5MTIyNjkxMX0.6r1IZJo28dEv7dnfppkwNwATIMt9ahRhLYCxSPAKRXw';

let supabaseClient = null;
let audioUnlocked = false;
let currentWinnerId = null;

// ===== INITIALIZATION =====


function initSupabase() {
  try {
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
}

// ===== BRANDING =====

function applyBranding() {
  try {
    const stored = localStorage.getItem('tedtalk_settings');
    if (!stored) return;
    
    const settings = JSON.parse(stored);
    const appName = settings.appName || 'Al Hassad TedTalk';
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

function playCelebration() {
  if (!audioUnlocked) return;
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

  const channel = supabaseClient
    .channel('winners-display-channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'winners_display'
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
        table: 'winners_display'
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
        table: 'winners_display'
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
    const { data, error } = await supabaseClient
      .from('winners_display')
      .select('*')
      .eq('is_active', true)
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
  if (winner.class_name) details.push('Grade: ' + winner.class_name);
  if (winner.section) details.push('Section: ' + winner.section);
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

function hideWinner() {
  currentWinnerId = null;
  
  const idleScreen = document.getElementById('idle-screen');
  const winnerScreen = document.getElementById('winner-screen');
  const winnerContent = document.getElementById('winner-content');
  const particles = document.getElementById('particles');

  winnerContent.classList.remove('revealed');

  setTimeout(() => {
    winnerScreen.hidden = true;
    idleScreen.style.display = 'flex';
    particles.innerHTML = '';
    // Restart background music
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
