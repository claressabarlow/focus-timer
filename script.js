const MODES = {
  focus: { label: 'Focus', minutes: 25, color: 'var(--focus)' },
  short: { label: 'Short Break', minutes: 5, color: 'var(--short)' },
  long: { label: 'Long Break', minutes: 15, color: 'var(--long)' },
};

const CIRCUMFERENCE = 2 * Math.PI * 100;

const timeDisplay = document.getElementById('timeDisplay');
const sessionCountEl = document.getElementById('sessionCount');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const skipBtn = document.getElementById('skipBtn');
const taskInput = document.getElementById('taskInput');
const ringProgress = document.querySelector('.ring-progress');
const modeButtons = document.querySelectorAll('.mode-btn');
const logList = document.getElementById('logList');
const logEmpty = document.getElementById('logEmpty');
const logSummary = document.getElementById('logSummary');
const clearLogBtn = document.getElementById('clearLogBtn');

let currentMode = 'focus';
let secondsLeft = MODES[currentMode].minutes * 60;
let totalSeconds = secondsLeft;
let running = false;
let timerId = null;
let focusSessionsCompleted = 0;

const todayKey = () => `focusLog-${new Date().toISOString().slice(0, 10)}`;

function loadLog() {
  const raw = localStorage.getItem(todayKey());
  return raw ? JSON.parse(raw) : [];
}

function saveLog(entries) {
  localStorage.setItem(todayKey(), JSON.stringify(entries));
}

function renderLog() {
  const entries = loadLog();
  logList.innerHTML = '';

  if (entries.length === 0) {
    logList.appendChild(logEmpty);
    logSummary.textContent = '0 sessions · 0m focused';
    return;
  }

  entries.slice().reverse().forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'log-item';
    li.innerHTML = `
      <span class="log-dot ${entry.mode}"></span>
      <span class="log-text">
        <div class="log-task">${entry.task ? escapeHtml(entry.task) : MODES[entry.mode].label}</div>
        <div class="log-time">${MODES[entry.mode].label} · ${entry.minutes}m · ${entry.time}</div>
      </span>
    `;
    logList.appendChild(li);
  });

  const focusEntries = entries.filter((e) => e.mode === 'focus');
  const totalMinutes = focusEntries.reduce((sum, e) => sum + e.minutes, 0);
  logSummary.textContent = `${focusEntries.length} session${focusEntries.length === 1 ? '' : 's'} · ${totalMinutes}m focused`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function logSession() {
  const entries = loadLog();
  entries.push({
    mode: currentMode,
    minutes: MODES[currentMode].minutes,
    task: currentMode === 'focus' ? taskInput.value.trim() : '',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  });
  saveLog(entries);
  renderLog();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(secondsLeft);
  const fraction = secondsLeft / totalSeconds;
  ringProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
  document.title = `${formatTime(secondsLeft)} · ${MODES[currentMode].label}`;
}

function setMode(mode, resetRunning = true) {
  currentMode = mode;
  modeButtons.forEach((btn) => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });
  ringProgress.style.stroke = MODES[mode].color;
  secondsLeft = MODES[mode].minutes * 60;
  totalSeconds = secondsLeft;
  if (resetRunning) stopTimer();
  updateDisplay();
  taskInput.parentElement.style.display = mode === 'focus' ? 'block' : 'none';
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 0.4);
    });
  } catch (e) {
    // audio not available, ignore
  }
}

function tick() {
  secondsLeft -= 1;
  updateDisplay();
  if (secondsLeft <= 0) {
    completeSession();
  }
}

function completeSession() {
  stopTimer();
  playChime();
  logSession();

  if (currentMode === 'focus') {
    focusSessionsCompleted += 1;
    sessionCountEl.textContent = `Session ${focusSessionsCompleted + 1}`;
    const nextMode = focusSessionsCompleted % 4 === 0 ? 'long' : 'short';
    setMode(nextMode);
  } else {
    setMode('focus');
  }
  taskInput.value = '';
}

function startTimer() {
  if (running) return;
  running = true;
  startBtn.textContent = 'Pause';
  timerId = setInterval(tick, 1000);
}

function pauseTimer() {
  running = false;
  startBtn.textContent = 'Start';
  clearInterval(timerId);
}

function stopTimer() {
  pauseTimer();
}

function resetTimer() {
  stopTimer();
  secondsLeft = MODES[currentMode].minutes * 60;
  totalSeconds = secondsLeft;
  updateDisplay();
}

startBtn.addEventListener('click', () => {
  running ? pauseTimer() : startTimer();
});

resetBtn.addEventListener('click', resetTimer);

skipBtn.addEventListener('click', () => {
  stopTimer();
  if (currentMode === 'focus') {
    setMode(focusSessionsCompleted % 4 === 3 ? 'long' : 'short');
  } else {
    setMode('focus');
  }
});

modeButtons.forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

clearLogBtn.addEventListener('click', () => {
  if (confirm("Clear today's log?")) {
    saveLog([]);
    renderLog();
  }
});

setMode('focus', false);
updateDisplay();
renderLog();
