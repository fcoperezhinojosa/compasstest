/**
 * Main application controller.
 * Manages screens, compass updates, challenge flow, and scoring.
 */
const App = (() => {
  // --- DOM references ---
  const screens = {
    desktop: document.getElementById('desktop-blocker'),
    permission: document.getElementById('permission-screen'),
    home: document.getElementById('home-screen'),
    freeCompass: document.getElementById('free-compass-screen'),
    challenge: document.getElementById('challenge-screen'),
    voyage: document.getElementById('voyage-screen'),
    results: document.getElementById('results-screen')
  };

  // --- State ---
  let currentScreen = null;
  let gameState = null;
  let timerInterval = null;
  let lockTimer = null;
  let headingUnsubscribe = null;

  // Lock-on: user must hold on-target for a duration to succeed
  const LOCK_DURATION = 1200; // ms to hold on target to complete

  // --- Screen Management ---
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.add('hidden'));
    if (screens[name]) {
      screens[name].classList.remove('hidden');
      currentScreen = name;
    }
  }

  // --- Initialization ---
  function init() {
    // Check if mobile
    if (!Compass.isMobile()) {
      showScreen('desktop');
      return;
    }

    // Check if compass supported
    if (!Compass.isSupported()) {
      showScreen('desktop');
      document.querySelector('.desktop-message h1').textContent = 'Compass Not Available';
      document.querySelector('.desktop-message p').textContent =
        'Your device does not support compass functionality.';
      return;
    }

    // Bind all event listeners
    bindEvents();

    // Update home stats
    updateHomeStats();

    // Show permission screen if iOS needs permission, else go to home
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      showScreen('permission');
    } else {
      Compass.start();
      showScreen('home');
    }
  }

  function bindEvents() {
    // Permission
    document.getElementById('btn-grant-permission').addEventListener('click', async () => {
      const granted = await Compass.requestPermission();
      if (granted) {
        Compass.start();
        showScreen('home');
      } else {
        alert('Compass permission is required for this app to work. Please enable it in your device settings.');
      }
    });

    // Home buttons
    document.getElementById('btn-quick-play').addEventListener('click', startQuickPlay);
    document.getElementById('btn-challenge-mode').addEventListener('click', startVoyage);
    document.getElementById('btn-free-compass').addEventListener('click', startFreeCompass);

    // Navigation buttons
    document.getElementById('btn-free-back').addEventListener('click', goHome);
    document.getElementById('btn-challenge-back').addEventListener('click', confirmQuit);
    document.getElementById('btn-voyage-back').addEventListener('click', confirmQuit);

    // Results buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
      if (gameState && gameState.mode === 'voyage') {
        startVoyage();
      } else {
        startQuickPlay();
      }
    });
    document.getElementById('btn-results-home').addEventListener('click', goHome);
  }

  function goHome() {
    cleanupGame();
    updateHomeStats();
    showScreen('home');
  }

  function confirmQuit() {
    if (confirm('Quit this challenge? Your progress will be lost.')) {
      goHome();
    }
  }

  function updateHomeStats() {
    const stats = Challenges.loadStats();
    document.getElementById('home-best-score').textContent = stats.bestScore;
    document.getElementById('home-challenges-won').textContent = stats.challengesWon;
  }

  // --- Compass Display Update ---
  function updateCompassDisplay(heading, roseId, bearingId, directionId) {
    const rose = document.getElementById(roseId);
    const bearingEl = document.getElementById(bearingId);
    const directionEl = document.getElementById(directionId);

    if (rose) {
      rose.style.transform = `rotate(${-heading}deg)`;
    }
    if (bearingEl) {
      bearingEl.textContent = Math.round(heading);
    }
    if (directionEl) {
      directionEl.textContent = Compass.getSimpleDirection(heading);
    }
  }

  // --- Free Compass Mode ---
  function startFreeCompass() {
    showScreen('freeCompass');
    if (headingUnsubscribe) headingUnsubscribe();
    headingUnsubscribe = Compass.onHeadingChange((heading) => {
      if (currentScreen !== 'freeCompass') return;
      updateCompassDisplay(heading, 'free-compass-rose', 'free-bearing', 'free-direction');
    });
  }

  // --- Quick Play Mode ---
  function startQuickPlay() {
    const challenges = Challenges.generateQuickPlay(5);
    gameState = {
      mode: 'quickplay',
      challenges,
      currentIndex: 0,
      score: 0,
      results: [],
      isLocked: false
    };
    showScreen('challenge');
    startChallenge();
  }

  function startChallenge() {
    const challenge = gameState.challenges[gameState.currentIndex];
    gameState.isLocked = false;
    gameState.timeRemaining = challenge.timeLimit;
    gameState.lockProgress = 0;

    // Update UI
    document.getElementById('challenge-instruction').textContent = challenge.instruction;
    document.getElementById('challenge-detail').textContent = challenge.detail;
    document.getElementById('challenge-counter').textContent =
      `${gameState.currentIndex + 1} / ${gameState.challenges.length}`;
    document.getElementById('current-score').textContent = gameState.score;
    document.getElementById('challenge-feedback').classList.add('hidden');
    document.getElementById('accuracy-fill').style.width = '0%';
    document.getElementById('accuracy-fill').className = 'accuracy-fill';
    document.getElementById('accuracy-value').textContent = '0%';

    // Reset compass frame
    const frame = document.querySelector('#challenge-screen .compass-frame');
    frame.classList.remove('locked');

    // Set target indicator rotation
    updateTargetIndicator('target-indicator', challenge.target);

    // Timer bar
    const timerFill = document.getElementById('timer-fill');
    timerFill.style.width = '100%';
    timerFill.className = 'timer-fill';

    // Start compass listener
    if (headingUnsubscribe) headingUnsubscribe();
    headingUnsubscribe = Compass.onHeadingChange((heading) => {
      if (currentScreen !== 'challenge' || gameState.isLocked) return;
      handleChallengeHeading(heading, challenge);
    });

    // Start countdown
    startTimer(challenge.timeLimit, 'timer-fill', () => {
      // Time's up!
      recordChallengeResult(false, 0, 0);
    });
  }

  function handleChallengeHeading(heading, challenge) {
    updateCompassDisplay(heading, 'challenge-compass-rose', 'challenge-bearing', 'challenge-direction');

    const accuracy = Challenges.calculateAccuracy(heading, challenge.target, challenge.threshold);
    const onTarget = Challenges.isOnTarget(heading, challenge.target, challenge.threshold);

    // Update accuracy display
    const fill = document.getElementById('accuracy-fill');
    fill.style.width = `${Math.min(accuracy, 100)}%`;
    fill.className = 'accuracy-fill' +
      (accuracy >= 80 ? ' great' : accuracy >= 50 ? ' good' : '');
    document.getElementById('accuracy-value').textContent = `${accuracy}%`;

    if (onTarget) {
      if (!gameState.lockStartTime) {
        gameState.lockStartTime = Date.now();
      }
      const elapsed = Date.now() - gameState.lockStartTime;
      if (elapsed >= LOCK_DURATION) {
        // Challenge completed!
        gameState.isLocked = true;
        const frame = document.querySelector('#challenge-screen .compass-frame');
        frame.classList.add('locked');

        const bonus = Challenges.calculateBonus(
          gameState.timeRemaining, challenge.timeLimit, accuracy
        );
        const totalPoints = challenge.points + bonus;
        recordChallengeResult(true, totalPoints, accuracy);
      }
    } else {
      gameState.lockStartTime = null;
    }
  }

  function recordChallengeResult(success, points, accuracy) {
    clearInterval(timerInterval);
    gameState.isLocked = true;

    gameState.results.push({ success, points, accuracy });
    if (success) {
      gameState.score += points;
    }

    // Show feedback overlay
    showFeedback(success, points, () => {
      if (gameState.currentIndex < gameState.challenges.length - 1) {
        gameState.currentIndex++;
        startChallenge();
      } else {
        showResults();
      }
    });
  }

  function showFeedback(success, points, callback) {
    const feedback = document.getElementById('challenge-feedback');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    const pts = document.getElementById('feedback-points');

    feedback.className = 'challenge-feedback ' + (success ? 'feedback-success' : 'feedback-fail');
    icon.textContent = success ? '\u2713' : '\u2717';
    text.textContent = success ? getSuccessMessage() : getFailMessage();
    pts.textContent = success ? `+${points} points` : 'No points';

    feedback.classList.remove('hidden');

    // Also vibrate on result
    if (navigator.vibrate) {
      navigator.vibrate(success ? [100, 50, 100] : [300]);
    }

    setTimeout(() => {
      feedback.classList.add('hidden');
      callback();
    }, 1500);
  }

  function getSuccessMessage() {
    const messages = [
      'On target!', 'Well navigated!', 'Steady as she goes!',
      'Perfect heading!', 'Aye aye, Captain!', 'Spot on!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  function getFailMessage() {
    const messages = [
      'Lost at sea!', 'Off course!', 'Man overboard!',
      'Time\'s up!', 'Wrong heading!', 'Adrift!'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // --- Voyage Mode ---
  function startVoyage() {
    const route = Challenges.getRandomVoyage();
    gameState = {
      mode: 'voyage',
      route,
      legs: route.legs,
      currentLeg: 0,
      score: 0,
      results: [],
      isLocked: false
    };
    showScreen('voyage');
    buildVoyageMap();
    startVoyageLeg();
  }

  function buildVoyageMap() {
    const container = document.getElementById('voyage-progress');
    container.innerHTML = '';
    gameState.legs.forEach((leg, i) => {
      if (i > 0) {
        const line = document.createElement('div');
        line.className = 'voyage-leg-line';
        line.id = `vleg-line-${i}`;
        container.appendChild(line);
      }
      const wp = document.createElement('div');
      wp.className = 'voyage-waypoint' + (i === 0 ? ' active' : '');
      wp.id = `vleg-wp-${i}`;
      wp.textContent = i + 1;
      container.appendChild(wp);
    });
  }

  function updateVoyageMap() {
    gameState.legs.forEach((_, i) => {
      const wp = document.getElementById(`vleg-wp-${i}`);
      const line = document.getElementById(`vleg-line-${i}`);
      if (i < gameState.currentLeg) {
        wp.className = 'voyage-waypoint completed';
        if (line) line.className = 'voyage-leg-line completed';
      } else if (i === gameState.currentLeg) {
        wp.className = 'voyage-waypoint active';
      } else {
        wp.className = 'voyage-waypoint';
      }
    });
  }

  function startVoyageLeg() {
    const leg = gameState.legs[gameState.currentLeg];
    gameState.isLocked = false;
    gameState.timeRemaining = leg.timeLimit;
    gameState.lockStartTime = null;

    // Update UI
    document.getElementById('voyage-leg').textContent =
      `Leg ${gameState.currentLeg + 1} of ${gameState.legs.length}`;
    document.getElementById('voyage-instruction').textContent = leg.name;
    document.getElementById('voyage-detail').textContent = leg.detail;
    document.getElementById('voyage-score').textContent = gameState.score;
    document.getElementById('voyage-accuracy-fill').style.width = '0%';
    document.getElementById('voyage-accuracy-fill').className = 'accuracy-fill';
    document.getElementById('voyage-accuracy-value').textContent = '0%';

    // Reset compass frame
    const frame = document.querySelector('#voyage-screen .compass-frame');
    frame.classList.remove('locked');

    // Target indicator
    updateTargetIndicator('voyage-target-indicator', leg.target);

    // Timer
    const timerFill = document.getElementById('voyage-timer-fill');
    timerFill.style.width = '100%';
    timerFill.className = 'timer-fill';

    updateVoyageMap();

    // Compass listener
    if (headingUnsubscribe) headingUnsubscribe();
    headingUnsubscribe = Compass.onHeadingChange((heading) => {
      if (currentScreen !== 'voyage' || gameState.isLocked) return;
      handleVoyageHeading(heading, leg);
    });

    // Start countdown
    startTimer(leg.timeLimit, 'voyage-timer-fill', () => {
      recordVoyageResult(false, 0, 0);
    });
  }

  function handleVoyageHeading(heading, leg) {
    updateCompassDisplay(heading, 'voyage-compass-rose', 'voyage-bearing', 'voyage-direction');

    const accuracy = Challenges.calculateAccuracy(heading, leg.target, leg.threshold);
    const onTarget = Challenges.isOnTarget(heading, leg.target, leg.threshold);

    const fill = document.getElementById('voyage-accuracy-fill');
    fill.style.width = `${Math.min(accuracy, 100)}%`;
    fill.className = 'accuracy-fill' +
      (accuracy >= 80 ? ' great' : accuracy >= 50 ? ' good' : '');
    document.getElementById('voyage-accuracy-value').textContent = `${accuracy}%`;

    if (onTarget) {
      if (!gameState.lockStartTime) {
        gameState.lockStartTime = Date.now();
      }
      const elapsed = Date.now() - gameState.lockStartTime;
      if (elapsed >= LOCK_DURATION) {
        gameState.isLocked = true;
        const frame = document.querySelector('#voyage-screen .compass-frame');
        frame.classList.add('locked');

        const bonus = Challenges.calculateBonus(
          gameState.timeRemaining, leg.timeLimit, accuracy
        );
        const totalPoints = leg.points + bonus;
        recordVoyageResult(true, totalPoints, accuracy);
      }
    } else {
      gameState.lockStartTime = null;
    }
  }

  function recordVoyageResult(success, points, accuracy) {
    clearInterval(timerInterval);
    gameState.isLocked = true;

    gameState.results.push({ success, points, accuracy });
    if (success) {
      gameState.score += points;
    }

    // Brief delay then move to next leg or results
    if (navigator.vibrate) {
      navigator.vibrate(success ? [100, 50, 100] : [300]);
    }

    // Flash the waypoint
    const wp = document.getElementById(`vleg-wp-${gameState.currentLeg}`);
    if (wp) {
      wp.className = 'voyage-waypoint ' + (success ? 'completed' : '');
    }
    const line = document.getElementById(`vleg-line-${gameState.currentLeg}`);
    if (line && success) {
      line.className = 'voyage-leg-line completed';
    }

    setTimeout(() => {
      if (gameState.currentLeg < gameState.legs.length - 1) {
        gameState.currentLeg++;
        startVoyageLeg();
      } else {
        showResults();
      }
    }, success ? 1000 : 1500);
  }

  // --- Timer ---
  function startTimer(seconds, fillId, onComplete) {
    clearInterval(timerInterval);
    const totalMs = seconds * 1000;
    const startTime = Date.now();
    const fillEl = document.getElementById(fillId);

    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, totalMs - elapsed);
      const percent = (remaining / totalMs) * 100;

      if (gameState) {
        gameState.timeRemaining = remaining / 1000;
      }

      fillEl.style.width = `${percent}%`;

      // Color changes
      if (percent < 20) {
        fillEl.className = 'timer-fill danger';
      } else if (percent < 40) {
        fillEl.className = 'timer-fill warning';
      }

      if (remaining <= 0) {
        clearInterval(timerInterval);
        onComplete();
      }
    }, 50);
  }

  // --- Target Indicator ---
  function updateTargetIndicator(indicatorId, targetBearing) {
    const indicator = document.getElementById(indicatorId);
    indicator.style.transform = `rotate(${targetBearing}deg)`;
    indicator.className = 'target-indicator active';
  }

  // --- Results Screen ---
  function showResults() {
    cleanupGame();

    const totalPossible = gameState.results.length > 0
      ? gameState.results.reduce((sum, r) => sum + (r.success ? r.points : 0), 0)
      : 0;
    const maxPossible = gameState.mode === 'voyage'
      ? gameState.legs.reduce((sum, l) => sum + l.points + 100, 0) // points + max bonus
      : gameState.challenges
        ? gameState.challenges.reduce((sum, c) => sum + c.points + 100, 0)
        : 1;

    const scorePercent = maxPossible > 0 ? (gameState.score / maxPossible) * 100 : 0;
    const stars = Challenges.getStarRating(scorePercent);
    const wins = gameState.results.filter(r => r.success).length;

    // Update stats
    const stats = Challenges.loadStats();
    stats.totalPlayed++;
    if (gameState.score > stats.bestScore) {
      stats.bestScore = gameState.score;
    }
    stats.challengesWon += wins;
    Challenges.saveStats(stats);

    // Populate results screen
    const title = gameState.mode === 'voyage'
      ? `${gameState.route.name} Complete!`
      : 'Challenge Complete!';
    document.getElementById('results-title').textContent = title;
    document.getElementById('results-score-value').textContent = gameState.score;

    // Stars
    const starsEl = document.getElementById('results-stars');
    starsEl.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      starsEl.innerHTML += i < stars
        ? '<span style="color: var(--gold);">\u2605</span>'
        : '<span style="color: var(--text-dim);">\u2606</span>';
    }

    // Breakdown
    const breakdown = document.getElementById('results-breakdown');
    breakdown.innerHTML = '';

    const items = gameState.mode === 'voyage' ? gameState.legs : gameState.challenges;
    const labels = gameState.mode === 'voyage'
      ? items.map(l => l.name)
      : items.map(c => c.instruction);

    gameState.results.forEach((r, i) => {
      const row = document.createElement('div');
      row.className = 'result-row';
      row.innerHTML = `
        <span class="result-row-label">${labels[i] || `Challenge ${i + 1}`}</span>
        <span class="result-row-value ${r.success ? 'success' : 'fail'}">
          ${r.success ? `+${r.points}` : 'Failed'}
        </span>
      `;
      breakdown.appendChild(row);
    });

    showScreen('results');
  }

  // --- Cleanup ---
  function cleanupGame() {
    clearInterval(timerInterval);
    clearTimeout(lockTimer);
    if (headingUnsubscribe) {
      headingUnsubscribe();
      headingUnsubscribe = null;
    }
  }

  // --- Start ---
  document.addEventListener('DOMContentLoaded', init);

  return { init };
})();
