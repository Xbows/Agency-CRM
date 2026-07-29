/**
 * Cold Call Tracker Dashboard - app.js
 */

// --- State Management ---
const state = {
  calls: [],
  currentView: 'dashboard',
  callLogPage: 1,
  callLogPerPage: 8,
  sortBy: 'dateTime',
  sortDir: 'desc',
  filters: {
    priority: 'all',
    outcome: 'all',
    date: 'all',
    search: ''
  },
  editingCallId: null,
  pendingDeleteId: null,
  currentUser: null,
  charts: {}
};

// --- Utilities ---
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
         date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval >= 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  
  let icon = '';
  if (type === 'success') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  else if (type === 'error') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
  else icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

  toast.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: #1D222B; border-left: 4px solid ${type === 'success' ? '#00C48C' : type === 'error' ? '#FF4D6A' : '#7B61FF'}; border-radius: 4px; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
      ${icon}
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
      if (container.contains(toast)) container.removeChild(toast);
    }, 300);
  }, 3000);
}

// --- Supabase Setup & Auth ---
const SUPABASE_URL = 'https://nvzsmqlznqwxvrdvxrmc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52enNtcWx6bnF3eHZyZHZ4cm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjQxMjUsImV4cCI6MjEwMDc0MDEyNX0.WXOVQTEUa45Ze80zDODOZAnTLW8sj74HhvLfEfczQeY';
let supabaseClient = null;

if (typeof window.supabase !== 'undefined') {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function checkAuth() {
  const authOverlay = document.getElementById('authOverlay');
  if (!supabaseClient) {
    if (authOverlay) authOverlay.classList.add('active');
    showToast('Unable to connect to authentication. Please refresh and try again.', 'error');
    return false;
  }

  const { data: { session }, error } = await supabaseClient.auth.getSession();
  if (error) {
    if (authOverlay) authOverlay.classList.add('active');
    showToast(error.message, 'error');
    return false;
  }

  state.currentUser = session?.user || null;
  if (authOverlay) authOverlay.classList.toggle('active', !session);
  return Boolean(session);
}

function setupAuth() {
  const authForm = document.getElementById('authForm');
  const toggleLink = document.getElementById('authToggleLink');
  const toggleText = document.getElementById('authToggleText');
  const submitBtn = document.getElementById('authSubmitBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  
  let isSignUp = false;

  if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      isSignUp = !isSignUp;
      toggleLink.textContent = isSignUp ? 'Sign in' : 'Sign up';
      if (toggleText) toggleText.childNodes[0].textContent = isSignUp ? 'Already have an account? ' : 'Need an account? ';
      if (submitBtn) submitBtn.innerHTML = `<span>${isSignUp ? 'Create Account' : 'Sign In'}</span>`;
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!supabaseClient) return showToast('Authentication is temporarily unavailable.', 'error');
      
      const email = document.getElementById('authEmail').value;
      const password = document.getElementById('authPassword').value;

      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = isSignUp ? 'Creating Account…' : 'Signing In…';

      try {
        if (isSignUp) {
          const { data, error } = await supabaseClient.auth.signUp({ email, password });
          if (error) throw error;

          if (data.session) {
            showToast('Account created and signed in!', 'success');
            await activateAuthenticatedApp();
          } else {
            showToast('Account created. Check your email to confirm your address.', 'success');
          }
        } else {
          const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
          if (error) throw error;
          showToast('Logged in successfully', 'success');
          await activateAuthenticatedApp();
        }
      } catch (error) {
        showToast(error.message || 'Authentication failed. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = isSignUp ? 'Create Account' : 'Sign In';
      }
    });
  }
  
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      if (supabaseClient) {
        const { error } = await supabaseClient.auth.signOut();
        if (error) return showToast(error.message, 'error');
        state.currentUser = null;
        state.calls = [];
        renderAll();
        await checkAuth();
      }
    });
  }

  supabaseClient?.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      state.currentUser = null;
      state.calls = [];
      renderAll();
      document.getElementById('authOverlay')?.classList.add('active');
    } else if (session) {
      window.setTimeout(() => {
        if (session.user?.id !== state.currentUser?.id) activateAuthenticatedApp();
      }, 0);
    }
  });
}

// --- Initialization ---
async function initApp() {
  setupAuth();
  setupNavigation();
  setupSidebarToggle();
  setupFilters();
  setupEventListeners();
  initCharts();
  renderAll();

  if (await checkAuth()) {
    await activateAuthenticatedApp();
  }
}

async function loadData() {
  if (!supabaseClient || !state.currentUser) {
    state.calls = [];
    return;
  }

  const { data, error } = await supabaseClient
    .from('calls')
    .select('id, user_id, called_at, company_name, contact_person, phone, email, priority, outcome, report, business_details, created_at')
    .eq('user_id', state.currentUser.id)
    .order('called_at', { ascending: false });

  if (error) {
    showToast(`Could not load calls: ${error.message}`, 'error');
    state.calls = [];
    return;
  }

  state.calls = (data || []).map(fromDatabaseCall);
}

function fromDatabaseCall(row) {
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    dateTime: row.called_at,
    priority: row.priority,
    outcome: row.outcome,
    report: row.report,
    callNotes: row.report,
    businessDetails: row.business_details,
    createdAt: row.created_at
  };
}

function toDatabaseCall(call) {
  return {
    user_id: state.currentUser.id,
    company_name: call.companyName,
    contact_person: call.contactPerson,
    phone: call.phone,
    email: call.email || null,
    called_at: call.dateTime,
    priority: call.priority,
    outcome: call.outcome,
    report: call.report,
    business_details: call.businessDetails || null
  };
}

async function activateAuthenticatedApp() {
  if (!await checkAuth()) return;
  await loadData();
  renderAll();
}

function renderAll() {
  updateKPIs();
  updateCharts();
  renderRecentCalls();
  renderCallLog();
  updateAnalyticsKPIs();
}

// --- Navigation ---
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.getAttribute('data-view');
      switchView(view);
    });
  });
}

function switchView(viewName) {
  state.currentView = viewName;
  
  // Update nav items
  document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    if (item.getAttribute('data-view') === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update views — map data-view names to DOM IDs
  const viewMap = { dashboard: 'dashboardView', calllog: 'callLogView', analytics: 'analyticsView' };
  Object.entries(viewMap).forEach(([name, id]) => {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('active', name === viewName);
    }
  });

  // Update page title
  const titles = { dashboard: 'Dashboard', calllog: 'Call Log', analytics: 'Analytics' };
  const titleEl = document.getElementById('pageTitle');
  if (titleEl) titleEl.textContent = titles[viewName] || 'Dashboard';

  // Re-render specific view components
  if (viewName === 'dashboard') {
    updateKPIs();
    updateCharts();
    renderRecentCalls();
  } else if (viewName === 'calllog') {
    renderCallLog();
  } else if (viewName === 'analytics') {
    updateAnalyticsKPIs();
    updateCharts();
  }
}

function setupSidebarToggle() {
  const toggleBtn = document.getElementById('sidebarToggle');
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.getElementById('mainContent');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      if (mainContent) mainContent.classList.toggle('expanded');
    });
  }

  // View All link
  const viewAllLink = document.getElementById('viewAllCalls');
  if (viewAllLink) {
    viewAllLink.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('calllog');
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      await loadData();
      renderAll();
      showToast('Data refreshed', 'success');
    });
  }
}

// --- KPIs ---
function isToday(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function isThisWeek(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
  const startOfWeek = new Date(now);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);
  
  return date >= startOfWeek;
}

function updateKPIs() {
  let todayCalls = 0;
  let interestedCalls = 0;
  let weeklyCalls = 0;
  let pendingFollowups = 0;

  state.calls.forEach(call => {
    if (isToday(call.dateTime)) todayCalls++;
    if (call.outcome === 'interested') interestedCalls++;
    if (isThisWeek(call.dateTime)) weeklyCalls++;
    if (call.outcome === 'not-quite-interested') pendingFollowups++;
  });

  const conversionRate = state.calls.length > 0 ? ((interestedCalls / state.calls.length) * 100).toFixed(1) : 0;

  const elTotal = document.getElementById('kpiTotalCalls');
  const elConv = document.getElementById('kpiConversionRate');
  const elWeekly = document.getElementById('kpiWeeklyCalls');
  const elPending = document.getElementById('kpiPendingFollowups');

  if (elTotal) elTotal.textContent = todayCalls;
  if (elConv) elConv.textContent = `${conversionRate}%`;
  if (elWeekly) elWeekly.textContent = weeklyCalls;
  if (elPending) elPending.textContent = pendingFollowups;
  
  // Trends require a previous comparison period. Hide them until that calculation exists.
  const hideTrend = (id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  };
  
  hideTrend('kpiTotalTrend');
  hideTrend('kpiConversionTrend');
  hideTrend('kpiWeeklyTrend');
  hideTrend('kpiPendingTrend');
}

// --- Charts ---
function initCharts() {
  if (typeof Chart === 'undefined') {
    console.warn("Chart.js not loaded");
    return;
  }

  Chart.defaults.color = '#EEEEFF';
  Chart.defaults.font.family = 'Inter, sans-serif';
  Chart.defaults.scale.grid.color = 'rgba(255,255,255,0.06)';
  Chart.defaults.plugins.tooltip.backgroundColor = '#1D222B';
  Chart.defaults.plugins.tooltip.titleColor = '#fff';
  Chart.defaults.plugins.tooltip.bodyColor = '#ccc';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;

  createOutcomeChart();
  createWeeklyChart();
  createPriorityChart();

  createOutcomeTimeChart();
}

function updateCharts() {
  if (state.charts.outcome) {
    const data = getOutcomeData();
    state.charts.outcome.data.datasets[0].data = data;
    state.charts.outcome.update();
  }
  if (state.charts.weekly) {
    const data = getWeeklyData();
    state.charts.weekly.data.datasets[0].data = data;
    state.charts.weekly.update();
  }
  if (state.charts.priority) {
    const counts = getPriorityData();
    state.charts.priority.data.datasets[0].data = [counts.urgent, counts.high, counts.medium, counts.low];
    state.charts.priority.update();
  }
  if (state.charts.outcomeTime) {
    const timeline = getOutcomeTimeData();
    state.charts.outcomeTime.data.labels = timeline.labels;
    state.charts.outcomeTime.data.datasets.forEach((dataset, index) => {
      dataset.data = timeline.datasets[index];
    });
    state.charts.outcomeTime.update();
  }
}

function getOutcomeData() {
  const counts = { 'interested': 0, 'not-quite-interested': 0, 'not-interested': 0 };
  state.calls.forEach(c => {
    if (counts[c.outcome] !== undefined) counts[c.outcome]++;
  });
  return [counts['interested'], counts['not-quite-interested'], counts['not-interested']];
}

function getWeeklyData() {
  const days = [0,0,0,0,0,0,0]; // Mon-Sun
  const now = new Date();
  const dayOfWeek = now.getDay(); 
  const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const startOfWeek = new Date(now.setDate(diffToMonday));
  startOfWeek.setHours(0,0,0,0);

  state.calls.forEach(c => {
    const d = new Date(c.dateTime);
    if (d >= startOfWeek) {
      let idx = d.getDay() - 1; 
      if (idx === -1) idx = 6;
      if (idx >= 0 && idx < 7) days[idx]++;
    }
  });
  return days;
}

function getPriorityData() {
  const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
  state.calls.forEach(c => { if(counts[c.priority] !== undefined) counts[c.priority]++; });
  return counts;
}

function createOutcomeChart() {
  const ctx = document.getElementById('outcomeChart');
  if (!ctx) return;
  if (state.charts.outcome) state.charts.outcome.destroy();

  state.charts.outcome = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Interested', 'Not Quite Interested', 'Not Interested'],
      datasets: [{
        data: getOutcomeData(),
        backgroundColor: ['#58C299', '#FFB946', '#718096'],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
      }
    }
  });
}

function createWeeklyChart() {
  const ctx = document.getElementById('weeklyChart');
  if (!ctx) return;
  if (state.charts.weekly) state.charts.weekly.destroy();

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(88, 194, 153, 1)');
  gradient.addColorStop(1, 'rgba(88, 194, 153, 0.2)');

  state.charts.weekly = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        label: 'Calls',
        data: getWeeklyData(),
        backgroundColor: gradient,
        borderRadius: 6,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
        x: { grid: { display: false } }
      }
    }
  });
}

function createPriorityChart() {
  const ctx = document.getElementById('priorityChart');
  if (!ctx) return;
  if (state.charts.priority) state.charts.priority.destroy();

  const counts = getPriorityData();

  state.charts.priority = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Urgent', 'High', 'Medium', 'Low'],
      datasets: [{
        data: [counts.urgent, counts.high, counts.medium, counts.low],
        backgroundColor: ['#58C299', '#4A5568', '#718096', '#A0AEC0'],
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}



function createOutcomeTimeChart() {
  const ctx = document.getElementById('outcomeTimeChart');
  if (!ctx) return;
  if (state.charts.outcomeTime) state.charts.outcomeTime.destroy();

  const timeline = getOutcomeTimeData();
  state.charts.outcomeTime = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: timeline.labels,
      datasets: [
        { label: 'Interested', data: timeline.datasets[0], backgroundColor: '#58C299', stack: 'Stack 0' },
        { label: 'Not Quite Interested', data: timeline.datasets[1], backgroundColor: '#FFB946', stack: 'Stack 0' },
        { label: 'Not Interested', data: timeline.datasets[2], backgroundColor: '#718096', stack: 'Stack 0' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
}

function getOutcomeTimeData() {
  const labels = [];
  const datasets = [[], [], []];
  const outcomeIndexes = {
    'interested': 0,
    'not-quite-interested': 1,
    'not-interested': 2
  };
  const currentWeek = new Date();
  const day = currentWeek.getDay();
  currentWeek.setDate(currentWeek.getDate() - day + (day === 0 ? -6 : 1));
  currentWeek.setHours(0, 0, 0, 0);

  for (let offset = 3; offset >= 0; offset--) {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - offset * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    labels.push(start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    const counts = [0, 0, 0];

    state.calls.forEach(call => {
      const calledAt = new Date(call.dateTime);
      const outcomeIndex = outcomeIndexes[call.outcome];
      if (calledAt >= start && calledAt < end && outcomeIndex !== undefined) {
        counts[outcomeIndex]++;
      }
    });

    counts.forEach((count, index) => datasets[index].push(count));
  }

  return { labels, datasets };
}

// --- Table Rendering ---

function getInitials(name) {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

function getPriorityClass(p) {
  switch(p) {
    case 'urgent': return 'priority-badge urgent';
    case 'high': return 'priority-badge high';
    case 'medium': return 'priority-badge medium';
    case 'low': return 'priority-badge low';
    default: return 'priority-badge';
  }
}

function getOutcomeClass(o) {
  switch(o) {
    case 'interested': return 'status-badge interested';
    case 'not-quite-interested':
    case 'follow-up': return 'status-badge not-quite-interested';
    case 'not-interested':
    case 'rejected':
    case 'no-answer': return 'status-badge not-interested';
    default: return 'status-badge';
  }
}

function formatOutcomeText(o) {
  switch(o) {
    case 'interested': return 'Interested';
    case 'not-quite-interested':
    case 'follow-up': return 'Not Quite Interested';
    case 'not-interested':
    case 'rejected':
    case 'no-answer': return 'Not Interested';
    default: return o || '—';
  }
}

function createCallRowHTML(call, isRecent = false) {
  const initials = getInitials(call.companyName);
  
  return `
    <tr data-id="${call.id}">
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#262B37; display:flex; align-items:center; justify-content:center; font-weight:bold; color:#fff;">
            ${escapeHtml(initials)}
          </div>
          <div>
            <div style="font-weight:600; color:#fff;">${escapeHtml(call.companyName)}</div>
            <div style="font-size:12px; color:#8892b0;">${escapeHtml(call.contactPerson || '—')}</div>
          </div>
        </div>
      </td>
      <td>${escapeHtml(call.phone || '—')}</td>
      <td>${escapeHtml(formatDateTime(call.dateTime))}</td>
      <td><span class="${getPriorityClass(call.priority)}">${escapeHtml(call.priority)}</span></td>
      <td><span class="${getOutcomeClass(call.outcome)}">${escapeHtml(formatOutcomeText(call.outcome))}</span></td>
      <td title="${escapeHtml(call.report)}">${escapeHtml(call.report ? call.report.substring(0, 40) + (call.report.length > 40 ? '...' : '') : '-')}</td>
      <td>
        <div class="actions" style="display:flex; gap:8px;">
          <button class="btn-icon btn-view" title="View Details" data-action="view" data-id="${call.id}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </button>
          <button class="btn-icon btn-edit" title="Edit" data-action="edit" data-id="${call.id}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
          </button>
          <button class="btn-icon btn-delete" title="Delete" data-action="delete" data-id="${call.id}">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

function renderRecentCalls() {
  const tbody = document.getElementById('recentCallsBody');
  if (!tbody) return;
  
  const recent = [...state.calls].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)).slice(0, 5);
  
  if (recent.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 36px 20px; color: var(--text-muted); font-size: 0.9rem;">No call logs recorded yet. Click <strong style="color:var(--accent-primary);">+ New Call</strong> to add your first call.</td></tr>';
    return;
  }

  tbody.innerHTML = recent.map(c => createCallRowHTML(c, true)).join('');
}

function getFilteredCalls() {
  return state.calls.filter(call => {
    // Priority filter
    if (state.filters.priority !== 'all' && call.priority !== state.filters.priority) return false;
    
    // Outcome filter
    if (state.filters.outcome !== 'all' && call.outcome !== state.filters.outcome) return false;
    
    // Date filter
    if (state.filters.date !== 'all') {
      if (state.filters.date === 'today' && !isToday(call.dateTime)) return false;
      if (state.filters.date === 'week' && !isThisWeek(call.dateTime)) return false;
      if (state.filters.date === 'month') {
        const d = new Date(call.dateTime);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
      }
    }
    
    // Search filter
    if (state.filters.search) {
      const q = state.filters.search.toLowerCase();
      const match = (
        (call.companyName && call.companyName.toLowerCase().includes(q)) ||
        (call.contactPerson && call.contactPerson.toLowerCase().includes(q)) ||
        (call.callNotes && call.callNotes.toLowerCase().includes(q))
      );
      if (!match) return false;
    }
    
    return true;
  });
}

function sortCalls(calls) {
  return calls.sort((a, b) => {
    let valA = a[state.sortBy];
    let valB = b[state.sortBy];
    
    if (state.sortBy === 'dateTime') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    
    if (valA < valB) return state.sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return state.sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

function renderCallLog() {
  const tbody = document.getElementById('callLogBody');
  if (!tbody) return;

  const filtered = getFilteredCalls();
  const sorted = sortCalls(filtered);
  
  // Pagination
  const total = sorted.length;
  const totalPages = Math.ceil(total / state.callLogPerPage) || 1;
  if (state.callLogPage > totalPages) state.callLogPage = totalPages;
  
  const start = (state.callLogPage - 1) * state.callLogPerPage;
  const paginated = sorted.slice(start, start + state.callLogPerPage);

  if (paginated.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 36px 20px; color: var(--text-muted); font-size: 0.9rem;">No matching call logs found. Click <strong style="color:var(--accent-primary);">+ New Call</strong> to add your first call.</td></tr>';
  } else {
    tbody.innerHTML = paginated.map(c => createCallRowHTML(c, false)).join('');
  }

  updatePagination(total, state.callLogPage, state.callLogPerPage);
}

function updatePagination(total, current, perPage) {
  const infoEls = [
    document.getElementById('callLogInfo'),
    document.getElementById('callLogPaginationInfo')
  ].filter(Boolean);
  const pageNumbersEl = document.getElementById('pageNumbers');
  
  const start = total === 0 ? 0 : (current - 1) * perPage + 1;
  const end = Math.min(current * perPage, total);
  infoEls.forEach(el => {
    el.textContent = `Showing ${start} to ${end} of ${total} entries`;
  });
  
  if (pageNumbersEl) {
    const totalPages = Math.ceil(total / perPage) || 1;
    let html = '';
    
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 || 
        i === totalPages || 
        (i >= current - 1 && i <= current + 1)
      ) {
        html += `<button class="page-btn ${i === current ? 'active' : ''}" data-page="${i}">${i}</button>`;
      } else if (i === current - 2 || i === current + 2) {
        html += `<span style="padding: 0 8px; color: #8892b0;">...</span>`;
      }
    }
    
    pageNumbersEl.innerHTML = html;
  }
  
  const prevBtn = document.getElementById('prevPage');
  const nextBtn = document.getElementById('nextPage');
  if (prevBtn) prevBtn.disabled = current <= 1;
  if (nextBtn) nextBtn.disabled = current >= Math.ceil(total / perPage);
}

// --- Event Listeners & Interactions ---

function setupEventListeners() {
  // Add Call Button
  const addBtn = document.getElementById('addCallBtn');
  if (addBtn) addBtn.addEventListener('click', openAddModal);

  // Modals
  document.getElementById('closeModal')?.addEventListener('click', closeModals);
  document.getElementById('cancelModal')?.addEventListener('click', closeModals);
  document.getElementById('closeDetail')?.addEventListener('click', closeModals);
  document.getElementById('closeConfirm')?.addEventListener('click', closeModals);
  document.getElementById('cancelConfirm')?.addEventListener('click', closeModals);
  document.getElementById('confirmDelete')?.addEventListener('click', confirmDeleteCall);
  
  // Close on outside click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModals();
    }
  });
  
  // Close on ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModals();
  });

  // Form Submit
  const form = document.getElementById('callForm');
  if (form) form.addEventListener('submit', saveCall);

  // Table Actions using Event Delegation
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    
    const action = btn.getAttribute('data-action');
    const id = btn.getAttribute('data-id');
    
    if (action === 'view') viewCallDetail(id);
    else if (action === 'edit') openEditModal(id);
    else if (action === 'delete') deleteCall(id);
  });
  
  // Pagination clicks
  document.body.addEventListener('click', (e) => {
    const pageBtn = e.target.closest('button[data-page]');
    if (pageBtn) {
      state.callLogPage = parseInt(pageBtn.getAttribute('data-page'), 10);
      renderCallLog();
    }
  });

  document.body.addEventListener('click', (e) => {
    const heading = e.target.closest('.sortable[data-sort]');
    if (!heading) return;
    const nextSort = heading.getAttribute('data-sort');
    if (state.sortBy === nextSort) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortBy = nextSort;
      state.sortDir = 'asc';
    }
    state.callLogPage = 1;
    renderCallLog();
  });
  
  document.getElementById('prevPage')?.addEventListener('click', () => {
    if (state.callLogPage > 1) {
      state.callLogPage--;
      renderCallLog();
    }
  });
  
  document.getElementById('nextPage')?.addEventListener('click', () => {
    const totalPages = Math.ceil(getFilteredCalls().length / state.callLogPerPage);
    if (state.callLogPage < totalPages) {
      state.callLogPage++;
      renderCallLog();
    }
  });
}

function setupFilters() {
  const handleFilter = () => {
    state.filters.priority = document.getElementById('filterPriority')?.value || 'all';
    state.filters.outcome = document.getElementById('filterOutcome')?.value || 'all';
    state.filters.date = document.getElementById('filterDate')?.value || 'all';
    state.callLogPage = 1;
    handleFilterChange();
  };

  document.getElementById('filterPriority')?.addEventListener('change', handleFilter);
  document.getElementById('filterOutcome')?.addEventListener('change', handleFilter);
  document.getElementById('filterDate')?.addEventListener('change', handleFilter);

  const searchInput = document.getElementById('callLogSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      state.filters.search = e.target.value;
      state.callLogPage = 1;
      handleFilterChange();
    }, 300));
  }
  
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', debounce((e) => {
      if (e.target.value) {
        state.filters.search = e.target.value;
        if (state.currentView !== 'calllog') switchView('calllog');
        if (searchInput) searchInput.value = e.target.value;
        state.callLogPage = 1;
        handleFilterChange();
      } else {
        state.filters.search = '';
        if (searchInput) searchInput.value = '';
        handleFilterChange();
      }
    }, 300));
  }
}

function handleFilterChange() {
  renderCallLog();
}

// --- CRUD Operations ---

function openAddModal() {
  state.editingCallId = null;
  const form = document.getElementById('callForm');
  if (form) form.reset();
  
  const title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Add New Call';
  
  const modal = document.getElementById('callModal');
  if (modal) modal.classList.add('active');
}

function openEditModal(id) {
  const call = state.calls.find(c => c.id === id);
  if (!call) return;
  
  state.editingCallId = id;
  
  const title = document.getElementById('modalTitle');
  if (title) title.textContent = 'Edit Call';
  
  // Populate form
  if (document.getElementById('companyName')) document.getElementById('companyName').value = call.companyName || '';
  if (document.getElementById('contactPerson')) document.getElementById('contactPerson').value = (call.contactPerson && call.contactPerson !== '—') ? call.contactPerson : '';
  if (document.getElementById('phone')) document.getElementById('phone').value = (call.phone && call.phone !== '—') ? call.phone : '';
  if (document.getElementById('priority')) document.getElementById('priority').value = call.priority || 'medium';
  if (document.getElementById('outcome')) document.getElementById('outcome').value = call.outcome || 'interested';
  if (document.getElementById('report')) document.getElementById('report').value = call.report || call.callNotes || '';
  if (document.getElementById('businessDetails')) document.getElementById('businessDetails').value = call.businessDetails || '';
  
  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.remove('active');
  
  const callModal = document.getElementById('callModal');
  if (callModal) callModal.classList.add('active');
}

async function saveCall(e) {
  e.preventDefault();
  if (!supabaseClient || !state.currentUser) {
    showToast('Please sign in before saving a call.', 'error');
    return;
  }
  
  const companyVal = document.getElementById('companyName')?.value?.trim();
  const reportVal = document.getElementById('report')?.value?.trim();
  const phoneVal = document.getElementById('phone')?.value?.trim();
  const businessVal = document.getElementById('businessDetails')?.value?.trim();

  if (!companyVal) {
    showToast('Company Name is required', 'error');
    return;
  }

  const formData = {
    companyName: companyVal,
    contactPerson: document.getElementById('contactPerson')?.value?.trim() || '—',
    phone: phoneVal || '—',
    dateTime: state.editingCallId
      ? state.calls.find(c => c.id === state.editingCallId)?.dateTime
      : new Date().toISOString(),
    priority: document.getElementById('priority')?.value || 'medium',
    outcome: document.getElementById('outcome')?.value || 'interested',
    report: reportVal || 'No report summary provided',
    callNotes: reportVal || '',
    email: '',
    businessDetails: businessVal || ''
  };
  
  const saveButton = document.getElementById('saveCallBtn');
  saveButton.disabled = true;

  try {
    if (state.editingCallId) {
      const { data, error } = await supabaseClient
        .from('calls')
        .update(toDatabaseCall(formData))
        .eq('id', state.editingCallId)
        .eq('user_id', state.currentUser.id)
        .select()
        .single();
      if (error) throw error;

      const idx = state.calls.findIndex(c => c.id === state.editingCallId);
      if (idx !== -1) state.calls[idx] = fromDatabaseCall(data);
      showToast('Call log updated successfully!', 'success');
    } else {
      const { data, error } = await supabaseClient
        .from('calls')
        .insert(toDatabaseCall(formData))
        .select()
        .single();
      if (error) throw error;

      const newCall = fromDatabaseCall(data);
      state.calls.unshift(newCall);
      showToast(`Logged call for "${newCall.companyName}" successfully!`, 'success');
    }

    closeModals();
    renderAll();
  } catch (error) {
    showToast(`Could not save call: ${error.message}`, 'error');
  } finally {
    saveButton.disabled = false;
  }
}

function deleteCall(id) {
  state.pendingDeleteId = id;
  document.getElementById('detailModal')?.classList.remove('active');
  document.getElementById('confirmModal')?.classList.add('active');
}

async function confirmDeleteCall() {
  const id = state.pendingDeleteId;
  if (!id || !supabaseClient || !state.currentUser) return;

  const confirmButton = document.getElementById('confirmDelete');
  confirmButton.disabled = true;
  try {
    const { error } = await supabaseClient
      .from('calls')
      .delete()
      .eq('id', id)
      .eq('user_id', state.currentUser.id);
    if (error) throw error;

    state.calls = state.calls.filter(call => call.id !== id);
    showToast('Call deleted', 'success');
    closeModals();
    renderAll();
  } catch (error) {
    showToast(`Could not delete call: ${error.message}`, 'error');
  } finally {
    confirmButton.disabled = false;
  }
}

function viewCallDetail(id) {
  const call = state.calls.find(c => c.id === id);
  if (!call) return;
  
  const setText = (elId, text) => {
    const el = document.getElementById(elId);
    if (el) el.textContent = text || '-';
  };
  
  setText('detailCompany', call.companyName);
  setText('detailContact', call.contactPerson);
  setText('detailPhone', call.phone);
  setText('detailEmail', call.email);
  setText('detailDateTime', formatDateTime(call.dateTime));
  
  const pEl = document.getElementById('detailPriority');
  if (pEl) {
    pEl.textContent = call.priority;
    pEl.className = `badge ${getPriorityClass(call.priority)}`;
  }
  
  const oEl = document.getElementById('detailOutcome');
  if (oEl) {
    oEl.textContent = formatOutcomeText(call.outcome);
    oEl.className = `badge ${getOutcomeClass(call.outcome)}`;
  }
  
  setText('detailNotes', call.callNotes);
  setText('detailBusiness', call.businessDetails);
  setText('detailReport', call.report);
  
  const editBtn = document.getElementById('editFromDetail');
  if (editBtn) {
    editBtn.onclick = () => openEditModal(id);
  }
  
  const delBtn = document.getElementById('deleteFromDetail');
  if (delBtn) {
    delBtn.onclick = () => deleteCall(id);
  }
  
  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.add('active');
}

function closeModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
  state.editingCallId = null;
  state.pendingDeleteId = null;
}

function updateAnalyticsKPIs() {
  const totalEl = document.getElementById('analyticsTotalCalls');
  if (totalEl) totalEl.textContent = state.calls.length;

  const interested = state.calls.filter(c => c.outcome === 'interested').length;
  const successEl = document.getElementById('analyticsSuccessRate');
  if (successEl) successEl.textContent = state.calls.length > 0 ? ((interested / state.calls.length) * 100).toFixed(1) + '%' : '0%';

  // Avg calls per day
  const dates = [...new Set(state.calls.map(c => new Date(c.dateTime).toDateString()))];
  const avgEl = document.getElementById('analyticsAvgPerDay');
  if (avgEl) avgEl.textContent = dates.length > 0 ? (state.calls.length / dates.length).toFixed(1) : '0';

  // Most common priority
  const pCounts = { urgent: 0, high: 0, medium: 0, low: 0 };
  state.calls.forEach(c => { if (pCounts[c.priority] !== undefined) pCounts[c.priority]++; });
  const topP = Object.entries(pCounts).sort((a, b) => b[1] - a[1])[0];
  const topEl = document.getElementById('analyticsTopPriority');
  if (topEl) {
    topEl.textContent = state.calls.length && topP
      ? topP[0].charAt(0).toUpperCase() + topP[0].slice(1)
      : '—';
  }
}

// Start app when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
