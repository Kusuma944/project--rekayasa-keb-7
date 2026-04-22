/**
 * LifeSync AI – To-Do List App
 * Pure Vanilla JS, no dependencies
 * Data persisted in localStorage
 */

// =============================================
// STATE & STORAGE
// =============================================
const STORAGE_KEY = 'lifesync_tasks';
const THEME_KEY   = 'lifesync_theme';

let state = {
  tasks: [],
  filter: 'all',
  search: '',
  sortBy: 'created', // 'created' | 'deadline' | 'priority'
  pendingDeleteId: null,
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.tasks = raw ? JSON.parse(raw) : getSampleTasks();
  } catch {
    state.tasks = getSampleTasks();
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function getSampleTasks() {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return [
    {
      id: uid(), title: 'Review laporan analisis kompetitor',
      desc: 'Periksa kembali Ansoff Matrix dan use case diagram sebelum dikumpulkan.',
      priority: 'high', area: 'belajar',
      deadline: today, time: '09:00', done: false, createdAt: Date.now() - 3000,
    },
    {
      id: uid(), title: 'Sprint planning meeting',
      desc: 'Diskusi fitur AI Task Generator untuk sprint berikutnya.',
      priority: 'medium', area: 'karir',
      deadline: today, time: '13:00', done: false, createdAt: Date.now() - 2000,
    },
    {
      id: uid(), title: 'Jogging pagi 30 menit',
      desc: 'Olahraga rutin di kompleks.',
      priority: 'low', area: 'kesehatan',
      deadline: today, time: '06:00', done: true, createdAt: Date.now() - 1500,
    },
    {
      id: uid(), title: 'Belajar React Hooks',
      desc: 'useState, useEffect, useContext, dan custom hooks.',
      priority: 'medium', area: 'belajar',
      deadline: tomorrow, time: '', done: false, createdAt: Date.now() - 1000,
    },
    {
      id: uid(), title: 'Update portofolio GitHub',
      desc: 'Tambahkan project LifeSync AI ke README.',
      priority: 'low', area: 'personal',
      deadline: yesterday, time: '', done: false, createdAt: Date.now() - 500,
    },
  ];
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// =============================================
// SELECTORS
// =============================================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

const taskList    = $('taskList');
const emptyState  = $('emptyState');
const modalOverlay = $('modalOverlay');
const deleteOverlay = $('deleteOverlay');
const searchInput = $('searchInput');

// =============================================
// DATE HELPERS
// =============================================
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDeadline(dateStr) {
  if (!dateStr) return null;
  const today = todayStr();
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const diff = Math.round((d - t) / 86400000);
  if (diff < 0)   return { label: `${Math.abs(diff)} hari lalu`, cls: 'overdue' };
  if (diff === 0) return { label: 'Hari ini',  cls: 'today' };
  if (diff === 1) return { label: 'Besok',     cls: '' };
  return { label: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), cls: '' };
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  let out = '';
  const d = new Date(dateStr + 'T00:00:00');
  out = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  if (timeStr) out += ' ' + timeStr;
  return out;
}

// =============================================
// FILTER & SORT
// =============================================
function getFilteredTasks() {
  let tasks = [...state.tasks];
  const today = todayStr();

  // Filter
  switch (state.filter) {
    case 'today':
      tasks = tasks.filter(t => t.deadline === today);
      break;
    case 'pending':
      tasks = tasks.filter(t => !t.done);
      break;
    case 'done':
      tasks = tasks.filter(t => t.done);
      break;
    default:
      if (state.filter.startsWith('area-')) {
        const area = state.filter.replace('area-', '');
        tasks = tasks.filter(t => t.area === area);
      }
  }

  // Search
  if (state.search) {
    const q = state.search.toLowerCase();
    tasks = tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.desc && t.desc.toLowerCase().includes(q))
    );
  }

  // Sort
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1; // done tasks go last
    switch (state.sortBy) {
      case 'deadline':
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.localeCompare(b.deadline);
      case 'priority':
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      default:
        return b.createdAt - a.createdAt;
    }
  });

  return tasks;
}

// =============================================
// BADGES & COUNTERS
// =============================================
function updateBadges() {
  const today = todayStr();
  const all     = state.tasks.filter(t => !t.done).length;
  const todayN  = state.tasks.filter(t => t.deadline === today && !t.done).length;
  const pending = state.tasks.filter(t => !t.done).length;
  const done    = state.tasks.filter(t => t.done).length;

  $('badge-all').textContent     = all;
  $('badge-today').textContent   = todayN;
  $('badge-pending').textContent = pending;
  $('badge-done').textContent    = done;

  const total   = state.tasks.length;
  const overdue = state.tasks.filter(t => !t.done && t.deadline && t.deadline < today).length;

  $('statTotal').textContent   = total;
  $('statPending').textContent = pending;
  $('statDone').textContent    = done;
  $('statOverdue').textContent = overdue;

  // Progress ring
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const circ = 138.2;
  const offset = circ - (circ * pct / 100);
  const ring = $('progressCircle');
  ring.style.transition = 'stroke-dashoffset 0.6s ease';
  ring.setAttribute('stroke-dashoffset', offset);
  $('progressPct').textContent = pct + '%';
  $('progressSub').textContent = `${done} dari ${total} selesai`;
}

// =============================================
// RENDER TASKS
// =============================================
function priorityColor(p) {
  return p === 'high' ? 'var(--red)' : p === 'medium' ? 'var(--orange)' : 'var(--green)';
}

function renderTasks() {
  const tasks = getFilteredTasks();
  taskList.innerHTML = '';

  if (tasks.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  tasks.forEach(task => {
    const today = todayStr();
    const dl = formatDeadline(task.deadline);
    const card = document.createElement('div');
    card.className = 'task-card' + (task.done ? ' done' : '');
    card.dataset.id = task.id;
    card.style.setProperty('--priority-color', priorityColor(task.priority));

    const priorityLabel = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' }[task.priority];
    const areaLabel = { karir: '💼 Karir', kesehatan: '💪 Kesehatan', belajar: '📚 Belajar', personal: '🌿 Personal' }[task.area];

    card.innerHTML = `
      <button class="task-check" data-id="${task.id}" title="${task.done ? 'Tandai belum selesai' : 'Tandai selesai'}">
        ${task.done ? '✓' : ''}
      </button>
      <div class="task-body">
        <div class="task-title" title="${escHtml(task.title)}">${escHtml(task.title)}</div>
        ${task.desc ? `<div class="task-desc">${escHtml(task.desc)}</div>` : ''}
        <div class="task-meta">
          <span class="task-badge badge-${task.area}">${areaLabel}</span>
          <span class="task-badge badge-priority-${task.priority}">⬤ ${priorityLabel}</span>
          ${dl ? `<span class="task-deadline ${dl.cls}">⏰ ${dl.label}${task.time ? ' ' + task.time : ''}</span>` : ''}
        </div>
      </div>
      <div class="task-actions">
        <button class="action-btn edit-btn" data-id="${task.id}" title="Edit task">✎</button>
        <button class="action-btn delete delete-btn" data-id="${task.id}" title="Hapus task">⌫</button>
      </div>
    `;

    taskList.appendChild(card);
  });

  // Events
  $$('.task-check').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleDone(btn.dataset.id);
    });
  });
  $$('.edit-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openEdit(btn.dataset.id);
    });
  });
  $$('.delete-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openDelete(btn.dataset.id);
    });
  });
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =============================================
// CRUD OPERATIONS
// =============================================
function toggleDone(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  task.done = !task.done;
  saveTasks();
  renderTasks();
  updateBadges();
  showToast(task.done ? '✓ Task ditandai selesai!' : '○ Task dibuka kembali.', task.done ? 'success' : 'info');
}

function addTask(data) {
  const task = {
    id: uid(),
    ...data,
    done: false,
    createdAt: Date.now(),
  };
  state.tasks.unshift(task);
  saveTasks();
  renderTasks();
  updateBadges();
  showToast('✓ Task berhasil ditambahkan!', 'success');
}

function editTask(id, data) {
  const idx = state.tasks.findIndex(t => t.id === id);
  if (idx === -1) return;
  state.tasks[idx] = { ...state.tasks[idx], ...data };
  saveTasks();
  renderTasks();
  updateBadges();
  showToast('✎ Task berhasil diperbarui!', 'info');
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  updateBadges();
  showToast('⌫ Task dihapus.', 'error');
}

// =============================================
// MODAL – ADD / EDIT
// =============================================
function openAdd() {
  $('editId').value = '';
  $('modalTitle').textContent = 'Tambah Task Baru';
  $('taskTitle').value = '';
  $('taskDesc').value = '';
  $('taskPriority').value = 'medium';
  $('taskArea').value = 'karir';
  $('taskDeadline').value = todayStr();
  $('taskTime').value = '';
  modalOverlay.classList.add('open');
  setTimeout(() => $('taskTitle').focus(), 100);
}

function openEdit(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  $('editId').value = id;
  $('modalTitle').textContent = 'Edit Task';
  $('taskTitle').value = task.title;
  $('taskDesc').value = task.desc || '';
  $('taskPriority').value = task.priority;
  $('taskArea').value = task.area;
  $('taskDeadline').value = task.deadline || '';
  $('taskTime').value = task.time || '';
  modalOverlay.classList.add('open');
  setTimeout(() => $('taskTitle').focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

function saveModal() {
  const title = $('taskTitle').value.trim();
  if (!title) {
    $('taskTitle').style.borderColor = 'var(--red)';
    $('taskTitle').focus();
    showToast('⚠ Judul task tidak boleh kosong!', 'error');
    setTimeout(() => { $('taskTitle').style.borderColor = ''; }, 1200);
    return;
  }
  const data = {
    title,
    desc: $('taskDesc').value.trim(),
    priority: $('taskPriority').value,
    area: $('taskArea').value,
    deadline: $('taskDeadline').value,
    time: $('taskTime').value,
  };
  const editId = $('editId').value;
  if (editId) editTask(editId, data);
  else addTask(data);
  closeModal();
}

// =============================================
// MODAL – DELETE CONFIRM
// =============================================
function openDelete(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  state.pendingDeleteId = id;
  $('deleteTaskName').textContent = task.title;
  deleteOverlay.classList.add('open');
}

function closeDelete() {
  deleteOverlay.classList.remove('open');
  state.pendingDeleteId = null;
}

// =============================================
// TOAST
// =============================================
function showToast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  $('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3100);
}

// =============================================
// SIDEBAR & NAV
// =============================================
const sidebar = $('sidebar');
const mainEl  = $('main');

function toggleSidebar() {
  sidebar.classList.toggle('collapsed');
  mainEl.classList.toggle('sidebar-collapsed');
}

function setFilter(filter) {
  state.filter = filter;
  $$('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  const labels = {
    all: 'Semua Task', today: 'Hari Ini',
    pending: 'Belum Selesai', done: 'Selesai',
    'area-karir': 'Karir', 'area-kesehatan': 'Kesehatan',
    'area-belajar': 'Belajar', 'area-personal': 'Personal',
  };
  $('pageTitle').textContent = labels[filter] || 'Task';
  renderTasks();
}

// =============================================
// THEME
// =============================================
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  document.documentElement.dataset.theme = saved;
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem(THEME_KEY, next);
  showToast(next === 'dark' ? '🌙 Mode gelap aktif' : '☀ Mode terang aktif', 'info');
}

// =============================================
// SORT
// =============================================
const SORTS = ['created', 'deadline', 'priority'];
const SORT_LABELS = { created: 'Terbaru', deadline: 'Deadline', priority: 'Prioritas' };

function cycleSort() {
  const idx = SORTS.indexOf(state.sortBy);
  state.sortBy = SORTS[(idx + 1) % SORTS.length];
  renderTasks();
  showToast(`⇅ Urutan: ${SORT_LABELS[state.sortBy]}`, 'info');
}

// =============================================
// DATE DISPLAY
// =============================================
function updatePageDate() {
  $('pageDate').textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
}

// =============================================
// EVENT LISTENERS
// =============================================
function attachEvents() {
  // Sidebar toggle
  $('sidebarToggle').addEventListener('click', toggleSidebar);

  // Mobile menu
  $('mobileMenuBtn').addEventListener('click', () => {
    sidebar.classList.toggle('mobile-open');
  });

  // Theme
  $('themeToggle').addEventListener('click', toggleTheme);

  // Sort
  $('sortBtn').addEventListener('click', cycleSort);

  // Open add modal
  $('openAddModal').addEventListener('click', openAdd);

  // Modal actions
  $('modalClose').addEventListener('click', closeModal);
  $('modalCancel').addEventListener('click', closeModal);
  $('modalSave').addEventListener('click', saveModal);

  // Close modal on overlay click
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });

  // Delete modal
  $('deleteClose').addEventListener('click', closeDelete);
  $('deleteCancelBtn').addEventListener('click', closeDelete);
  $('deleteConfirmBtn').addEventListener('click', () => {
    if (state.pendingDeleteId) deleteTask(state.pendingDeleteId);
    closeDelete();
  });
  deleteOverlay.addEventListener('click', e => {
    if (e.target === deleteOverlay) closeDelete();
  });

  // Nav items
  $$('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      setFilter(btn.dataset.filter);
      // close mobile sidebar
      sidebar.classList.remove('mobile-open');
    });
  });

  // Search
  searchInput.addEventListener('input', () => {
    state.search = searchInput.value.trim();
    renderTasks();
  });
  $('clearSearch').addEventListener('click', () => {
    searchInput.value = '';
    state.search = '';
    renderTasks();
    searchInput.focus();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // ESC = close modals
    if (e.key === 'Escape') { closeModal(); closeDelete(); }
    // Ctrl/Cmd + K = focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    // Ctrl/Cmd + N = add task
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      if (!modalOverlay.classList.contains('open')) {
        e.preventDefault();
        openAdd();
      }
    }
    // Enter in title input = save
    if (e.key === 'Enter' && document.activeElement === $('taskTitle')) {
      saveModal();
    }
  });

  // Auto-refresh every minute (update "today" state, overdue highlighting)
  setInterval(() => {
    renderTasks();
    updateBadges();
    updatePageDate();
  }, 60000);
}

// =============================================
// INIT
// =============================================
function init() {
  loadTheme();
  loadTasks();
  updatePageDate();
  renderTasks();
  updateBadges();
  attachEvents();
  console.log('%c⚡ LifeSync AI loaded', 'color:#f0a500;font-size:14px;font-weight:bold;');
  console.log('%cShortcuts: Ctrl+N = Tambah Task | Ctrl+K = Cari | ESC = Tutup Modal',
    'color:#9498b0;font-size:11px;');
}

document.addEventListener('DOMContentLoaded', init);
