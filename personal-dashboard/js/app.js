/* ============================================================
   Personal Dashboard — app.js
   Challenges: 1) Light/Dark mode  2) Custom name  3) Change Pomodoro time
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────
   STORAGE HELPERS
────────────────────────────────────────────────────────── */
const store = {
  get:    (key, fallback) => { try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set:    (key, val)      => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('localStorage unavailable', e); } },
  remove: (key)           => { try { localStorage.removeItem(key); } catch {/* */} }
};

/* ──────────────────────────────────────────────────────────
   GREETING + CLOCK
────────────────────────────────────────────────────────── */
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function getGreeting(hour) {
  if (hour < 12) return '☀️ Good morning';
  if (hour < 17) return '🌤 Good afternoon';
  if (hour < 21) return '🌇 Good evening';
  return '🌙 Good night';
}

function formatTime(date) {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function updateClock() {
  const now   = new Date();
  const hour  = now.getHours();
  const name  = store.get('userName', '');

  document.getElementById('greeting').textContent = getGreeting(hour);
  document.getElementById('greetingName').textContent =
    name ? `${getGreeting(hour).split(' ').slice(-1)[0]}, ${name}!` : getGreeting(hour) + '!';

  document.getElementById('datetime').textContent =
    `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}  •  ${formatTime(now)}`;
}

setInterval(updateClock, 1000);
updateClock();

/* ──────────────────────────────────────────────────────────
   DARK / LIGHT MODE  (Challenge 1)
────────────────────────────────────────────────────────── */
const themeToggle = document.getElementById('themeToggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  themeToggle.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

function initTheme() {
  const saved = store.get('theme', null);
  const preferred = (saved)
    ? saved
    : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(preferred);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  store.set('theme', next);
});

initTheme();

/* ──────────────────────────────────────────────────────────
   CUSTOM NAME  (Challenge 2)
────────────────────────────────────────────────────────── */
const nameModal     = document.getElementById('nameModal');
const nameInput     = document.getElementById('nameInput');
const saveNameBtn   = document.getElementById('saveNameBtn');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const editNameBtn   = document.getElementById('editNameBtn');

function openNameModal() {
  nameInput.value = store.get('userName', '');
  nameModal.classList.add('open');
  nameInput.focus();
  nameInput.select();
}

function closeNameModal() {
  nameModal.classList.remove('open');
}

function saveName() {
  const name = nameInput.value.trim();
  if (name) store.set('userName', name);
  else store.remove('userName');
  closeNameModal();
  updateClock();
}

editNameBtn.addEventListener('click', openNameModal);
saveNameBtn.addEventListener('click', saveName);
cancelNameBtn.addEventListener('click', closeNameModal);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') closeNameModal(); });
nameModal.addEventListener('click', e => { if (e.target === nameModal) closeNameModal(); });

// Auto-open name modal on first visit
if (!store.get('userName', null) && !store.get('namePromptShown', false)) {
  store.set('namePromptShown', true);
  setTimeout(openNameModal, 600);
}

/* ──────────────────────────────────────────────────────────
   FOCUS TIMER  (with Challenge 3: change Pomodoro time)
────────────────────────────────────────────────────────── */
const timerDisplay      = document.getElementById('timerDisplay');
const timerStart        = document.getElementById('timerStart');
const timerStop         = document.getElementById('timerStop');
const timerReset        = document.getElementById('timerReset');
const timerSettingsBtn  = document.getElementById('timerSettingsBtn');
const timerSettings     = document.getElementById('timerSettings');
const timerMinutesInput = document.getElementById('timerMinutes');
const applyTimerBtn     = document.getElementById('applyTimerBtn');
const timerLabel        = document.getElementById('timerLabel');

let timerDuration = store.get('timerDuration', 25); // minutes
let timerSeconds  = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

timerMinutesInput.value = timerDuration;

function formatTimerDisplay(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimerDisplay(timerSeconds);
}

function startTimer() {
  if (timerRunning) return;
  timerRunning = true;
  timerStart.disabled = true;
  timerStop.disabled  = false;
  timerLabel.textContent = 'Focus Session';

  timerInterval = setInterval(() => {
    timerSeconds--;
    renderTimer();
    if (timerSeconds <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStart.disabled = false;
      timerStop.disabled  = true;
      timerLabel.textContent = '🎉 Session complete!';
      // Optional beep via Web Audio
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(); osc.stop(ctx.currentTime + 0.8);
      } catch {/* audio blocked — silent finish */}
    }
  }, 1000);
}

function pauseTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  timerStart.disabled = false;
  timerStop.disabled  = true;
  timerLabel.textContent = 'Paused';
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerSeconds  = timerDuration * 60;
  timerStart.disabled = false;
  timerStop.disabled  = true;
  timerLabel.textContent = 'Focus Session';
  renderTimer();
}

timerStart.addEventListener('click', startTimer);
timerStop.addEventListener('click', pauseTimer);
timerReset.addEventListener('click', resetTimer);

timerSettingsBtn.addEventListener('click', () => {
  timerSettings.hidden = !timerSettings.hidden;
});

applyTimerBtn.addEventListener('click', () => {
  const mins = parseInt(timerMinutesInput.value, 10);
  if (!mins || mins < 1 || mins > 120) return;
  timerDuration = mins;
  store.set('timerDuration', timerDuration);
  resetTimer();
  timerSettings.hidden = true;
});

renderTimer();

/* ──────────────────────────────────────────────────────────
   TO-DO LIST
────────────────────────────────────────────────────────── */
const todoForm  = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList  = document.getElementById('todoList');
const todoCount = document.getElementById('todoCount');

let todos = store.get('todos', []);
// Ensure IDs are valid
todos = todos.map(t => ({ id: t.id || Date.now() + Math.random(), text: t.text, done: !!t.done }));

function saveTodos() { store.set('todos', todos); }

function updateTodoCount() {
  const left = todos.filter(t => !t.done).length;
  todoCount.textContent = `${left} left`;
}

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');
    li.setAttribute('role', 'listitem');

    li.innerHTML = `
      <input type="checkbox" aria-label="Mark done" ${todo.done ? 'checked' : ''} />
      <span class="task-text">${escapeHtml(todo.text)}</span>
      <div class="todo-item-actions">
        <button title="Edit" aria-label="Edit task">✏️</button>
        <button title="Delete" aria-label="Delete task">🗑️</button>
      </div>`;

    const checkbox  = li.querySelector('input[type="checkbox"]');
    const editBtn   = li.querySelectorAll('button')[0];
    const deleteBtn = li.querySelectorAll('button')[1];

    checkbox.addEventListener('change', () => {
      todo.done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    editBtn.addEventListener('click', () => startEditTodo(li, todo));
    deleteBtn.addEventListener('click', () => {
      todos = todos.filter(t => t.id !== todo.id);
      saveTodos();
      renderTodos();
    });

    todoList.appendChild(li);
  });
  updateTodoCount();
}

function startEditTodo(li, todo) {
  const span = li.querySelector('.task-text');
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = todo.text;
  span.replaceWith(input);
  input.focus();
  input.select();

  const finish = () => {
    const val = input.value.trim();
    if (val) todo.text = val;
    saveTodos();
    renderTodos();
  };
  input.addEventListener('blur', finish);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') finish(); if (e.key === 'Escape') renderTodos(); });
}

todoForm.addEventListener('submit', e => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;
  todos.push({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
});

renderTodos();

/* ──────────────────────────────────────────────────────────
   QUICK LINKS
────────────────────────────────────────────────────────── */
const linksGrid    = document.getElementById('linksGrid');
const addLinkBtn   = document.getElementById('addLinkBtn');
const linkForm     = document.getElementById('linkForm');
const linkName     = document.getElementById('linkName');
const linkUrl      = document.getElementById('linkUrl');
const saveLinkBtn  = document.getElementById('saveLinkBtn');
const cancelLinkBtn= document.getElementById('cancelLinkBtn');

const DEFAULT_LINKS = [
  { id: 'dl-1', name: 'Google',  url: 'https://google.com' },
  { id: 'dl-2', name: 'YouTube', url: 'https://youtube.com' },
  { id: 'dl-3', name: 'GitHub',  url: 'https://github.com' },
];

let links = store.get('quickLinks', null);
if (!links) { links = DEFAULT_LINKS; store.set('quickLinks', links); }

function saveLinks() { store.set('quickLinks', links); }

function getFavicon(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(origin)}`;
  } catch { return null; }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  links.forEach(link => {
    const a = document.createElement('a');
    a.className = 'link-chip';
    a.href   = link.url;
    a.target = '_blank';
    a.rel    = 'noopener noreferrer';
    a.setAttribute('role', 'listitem');

    const favicon = getFavicon(link.url);
    a.innerHTML = `
      ${favicon ? `<img class="link-icon" src="${escapeAttr(favicon)}" alt="" loading="lazy" onerror="this.style.display='none'" />` : ''}
      <span>${escapeHtml(link.name)}</span>
      <button class="link-delete" title="Remove link" aria-label="Remove ${escapeAttr(link.name)}">✕</button>`;

    a.querySelector('.link-delete').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    linksGrid.appendChild(a);
  });
}

addLinkBtn.addEventListener('click', () => {
  linkForm.hidden = !linkForm.hidden;
  if (!linkForm.hidden) { linkName.value = ''; linkUrl.value = ''; linkName.focus(); }
});

saveLinkBtn.addEventListener('click', () => {
  const name = linkName.value.trim();
  const url  = linkUrl.value.trim();
  if (!name || !url) return;
  let finalUrl = url;
  if (!/^https?:\/\//i.test(url)) finalUrl = 'https://' + url;
  try { new URL(finalUrl); } catch { linkUrl.style.borderColor = '#e05'; linkUrl.focus(); return; }
  linkUrl.style.borderColor = '';
  links.push({ id: Date.now().toString(), name, url: finalUrl });
  saveLinks();
  renderLinks();
  linkForm.hidden = true;
});

cancelLinkBtn.addEventListener('click', () => { linkForm.hidden = true; });
linkUrl.addEventListener('keydown', e => { if (e.key === 'Enter') saveLinkBtn.click(); });
linkName.addEventListener('keydown', e => { if (e.key === 'Enter') linkUrl.focus(); });

renderLinks();

/* ──────────────────────────────────────────────────────────
   UTILITIES
────────────────────────────────────────────────────────── */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
