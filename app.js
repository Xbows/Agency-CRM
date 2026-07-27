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
  charts: {}
};

// --- Sample Data Generation ---
function generateSampleData() {
  const sampleCompanies = [
    { name: 'TechNova Solutions', contact: 'Sarah Jenkins', email: 'sarah.j@technova.io', phone: '+1 (555) 123-4567' },
    { name: 'CloudPeak Systems', contact: 'Michael Chang', email: 'm.chang@cloudpeak.net', phone: '+1 (555) 234-5678' },
    { name: 'DataForge Analytics', contact: 'Elena Rodriguez', email: 'elena@dataforge.co', phone: '+1 (555) 345-6789' },
    { name: 'Nexus Digital', contact: 'David Kim', email: 'dkim@nexusdigital.com', phone: '+1 (555) 456-7890' },
    { name: 'Quantum Frameworks', contact: 'Rachel Adams', email: 'radams@quantumfw.com', phone: '+1 (555) 567-8901' },
    { name: 'ByteShift Labs', contact: 'Marcus Johnson', email: 'mjohnson@byteshift.io', phone: '+1 (555) 678-9012' },
    { name: 'Apex Innovations', contact: 'Amanda Smith', email: 'asmith@apexinv.com', phone: '+1 (555) 789-0123' },
    { name: 'Starlight Media', contact: 'Tom Wilson', email: 'twilson@starlight.net', phone: '+1 (555) 890-1234' },
    { name: 'Crescent Cyber', contact: 'Lisa Wong', email: 'lwong@crescentcyber.com', phone: '+1 (555) 901-2345' },
    { name: 'OmniSphere Tech', contact: 'James Brown', email: 'jbrown@omnisphere.io', phone: '+1 (555) 012-3456' },
    { name: 'Pioneer Software', contact: 'Emily Davis', email: 'edavis@pioneer.dev', phone: '+1 (555) 111-2222' },
    { name: 'Vanguard Networks', contact: 'Daniel Miller', email: 'dmiller@vanguard.net', phone: '+1 (555) 222-3333' },
    { name: 'Horizon Cloud', contact: 'Sophia Taylor', email: 'staylor@horizon.cloud', phone: '+1 (555) 333-4444' },
    { name: 'Zenith Solutions', contact: 'Matthew Anderson', email: 'manderson@zenith.co', phone: '+1 (555) 444-5555' },
    { name: 'Stratos Data', contact: 'Olivia Thomas', email: 'othomas@stratos.io', phone: '+1 (555) 555-6666' }
  ];

  const outcomes = [
    { value: 'interested', weight: 15 },
    { value: 'rejected', weight: 35 },
    { value: 'follow-up', weight: 30 },
    { value: 'no-answer', weight: 20 }
  ];

  const priorities = [
    { value: 'urgent', weight: 20 },
    { value: 'high', weight: 25 },
    { value: 'medium', weight: 35 },
    { value: 'low', weight: 20 }
  ];

  const notes = [
    "Contact was busy, asked to call back next week.",
    "Presented our new enterprise tier. Seemed interested in the ROI.",
    "Not a priority for them this quarter. Budget frozen.",
    "Left a voicemail detailing our Q3 promotion.",
    "Gatekeeper blocked the call. Need to find a direct line.",
    "Great conversation about their current pain points. Scheduled a demo.",
    "They are currently using a competitor but unhappy with support.",
    "Wrong number on file. Need to research correct contact info."
  ];

  const getWeightedRandom = (arr) => {
    const totalWeight = arr.reduce((sum, item) => sum + item.weight, 0);
    let randomNum = Math.random() * totalWeight;
    for (let i = 0; i < arr.length; i++) {
      randomNum -= arr[i].weight;
      if (randomNum <= 0) return arr[i].value;
    }
    return arr[arr.length - 1].value;
  };

  const calls = [];
  const now = new Date('2026-07-27T13:17:32+03:00'); 

  for (let i = 0; i < 30; i++) {
    const company = sampleCompanies[Math.floor(Math.random() * sampleCompanies.length)];
    
    // Distribute dates mostly recent
    const daysAgo = Math.floor(Math.pow(Math.random(), 2) * 30); 
    const callDate = new Date(now);
    callDate.setDate(now.getDate() - daysAgo);
    callDate.setHours(9 + Math.floor(Math.random() * 8)); 
    callDate.setMinutes(Math.floor(Math.random() * 60));

    calls.push({
      id: generateId(),
      companyName: company.name,
      contactPerson: company.contact,
      phone: company.phone,
      email: company.email,
      dateTime: callDate.toISOString(),
      priority: getWeightedRandom(priorities),
      outcome: getWeightedRandom(outcomes),
      callNotes: notes[Math.floor(Math.random() * notes.length)],
      businessDetails: `${company.name} is a mid-sized enterprise focusing on B2B solutions.`,
      report: `Call concluded with outcome: ${getWeightedRandom(outcomes)}. Action items updated.`,
      createdAt: new Date(callDate.getTime() - 1000000).toISOString()
    });
  }
  
  // Sort by date descending
  calls.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  
  return calls;
}

// --- Utilities ---
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  const now = new Date('2026-07-27T13:17:32+03:00');
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

// --- Initialization ---
function initApp() {
  loadData();
  setupNavigation();
  setupSidebarToggle();
  setupFilters();
  setupEventListeners();
  
  // Initial renders
  updateKPIs();
  initCharts();
  renderRecentCalls();
  renderCallLog();
}

function loadData() {
  // Clear any existing stored data and initialize clean empty state
  state.calls = [];
  saveData();
}

function saveData() {
  localStorage.setItem('coldCallTrackerData', JSON.stringify(state.calls));
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
    refreshBtn.addEventListener('click', () => {
      updateKPIs();
      updateCharts();
      renderRecentCalls();
      renderCallLog();
      showToast('Data refreshed', 'info');
    });
  }
}

// --- KPIs ---
function isToday(dateStr) {
  const date = new Date(dateStr);
  const today = new Date('2026-07-27T13:17:32+03:00');
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

function isThisWeek(dateStr) {
  const date = new Date(dateStr);
  const now = new Date('2026-07-27T13:17:32+03:00');
  
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
    if (call.outcome === 'follow-up') pendingFollowups++;
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
  
  // Mock trends for demo (hide if no data)
  const mockTrend = (id, value, isPositive) => {
    const el = document.getElementById(id);
    if (el) {
      if (state.calls.length === 0) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
        el.textContent = `${isPositive ? '+' : '-'}${value}%`;
        el.className = `kpi-trend ${isPositive ? 'up' : 'down'}`;
      }
    }
  };
  
  mockTrend('kpiTotalTrend', 12, true);
  mockTrend('kpiConversionTrend', 2.4, true);
  mockTrend('kpiWeeklyTrend', 5, false);
  mockTrend('kpiPendingTrend', 8, true);
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
  createMonthlyTrendChart();
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
}

function getOutcomeData() {
  const counts = { 'interested': 0, 'rejected': 0, 'follow-up': 0, 'no-answer': 0 };
  state.calls.forEach(c => {
    if (counts[c.outcome] !== undefined) counts[c.outcome]++;
  });
  return [counts['interested'], counts['rejected'], counts['follow-up'], counts['no-answer']];
}

function getWeeklyData() {
  const days = [0,0,0,0,0,0,0]; // Mon-Sun
  const now = new Date('2026-07-27T13:17:32+03:00');
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
      labels: ['Interested', 'Rejected', 'Follow-up', 'No Answer'],
      datasets: [{
        data: getOutcomeData(),
        backgroundColor: ['#58C299', '#718096', '#4A5568', '#2D3748'],
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

function createMonthlyTrendChart() {
  const ctx = document.getElementById('monthlyTrendChart');
  if (!ctx) return;
  if (state.charts.monthly) state.charts.monthly.destroy();
  
  // Mock monthly data
  const data = [12, 19, 15, 25, 22, 30];
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(88, 194, 153, 0.5)');
  gradient.addColorStop(1, 'rgba(88, 194, 153, 0.0)');

  state.charts.monthly = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      datasets: [{
        label: 'Total Calls',
        data: data,
        borderColor: '#58C299',
        backgroundColor: gradient,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
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

  state.charts.outcomeTime = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['W1', 'W2', 'W3', 'W4'],
      datasets: [
        { label: 'Interested', data: [2, 3, 4, 5], backgroundColor: '#58C299', stack: 'Stack 0' },
        { label: 'Rejected', data: [5, 6, 5, 8], backgroundColor: '#4A5568', stack: 'Stack 0' },
        { label: 'Follow-up', data: [3, 4, 2, 4], backgroundColor: '#718096', stack: 'Stack 0' },
        { label: 'No Answer', data: [2, 1, 3, 2], backgroundColor: '#A0AEC0', stack: 'Stack 0' }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { x: { stacked: true }, y: { stacked: true } }
    }
  });
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
        const now = new Date('2026-07-27T13:17:32+03:00');
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
  const infoEl = document.getElementById('callLogInfo') || document.getElementById('callLogPaginationInfo');
  const pageNumbersEl = document.getElementById('pageNumbers');
  
  if (infoEl) {
    const start = total === 0 ? 0 : (current - 1) * perPage + 1;
    const end = Math.min(current * perPage, total);
    infoEl.textContent = `Showing ${start} to ${end} of ${total} entries`;
  }
  
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
    const pageBtn = e.target.closest('.page-btn');
    if (pageBtn) {
      state.callLogPage = parseInt(pageBtn.getAttribute('data-page'), 10);
      renderCallLog();
    }
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
  
  const dtInput = document.getElementById('callDateTime');
  if (dtInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0, 16);
  }
  
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

function saveCall(e) {
  e.preventDefault();
  
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
    dateTime: new Date().toISOString(), // Auto-scans date automatically!
    priority: document.getElementById('priority')?.value || 'medium',
    outcome: document.getElementById('outcome')?.value || 'interested',
    report: reportVal || 'No report summary provided',
    callNotes: reportVal || '',
    email: '',
    businessDetails: businessVal || ''
  };
  
  if (state.editingCallId) {
    // Update
    const idx = state.calls.findIndex(c => c.id === state.editingCallId);
    if (idx !== -1) {
      state.calls[idx] = { ...state.calls[idx], ...formData };
      showToast('Call log updated successfully!', 'success');
    }
  } else {
    // Add
    const newCall = {
      id: generateId(),
      ...formData,
      createdAt: new Date().toISOString()
    };
    state.calls.unshift(newCall);
    showToast(`Logged call for "${newCall.companyName}" successfully!`, 'success');
  }
  
  saveData();
  closeModals();
  
  updateKPIs();
  updateCharts();
  renderRecentCalls();
  renderCallLog();
}

function deleteCall(id) {
  if (confirm("Are you sure you want to delete this call record?")) {
    state.calls = state.calls.filter(c => c.id !== id);
    saveData();
    showToast('Call deleted', 'success');
    
    const detailModal = document.getElementById('detailModal');
    if (detailModal) detailModal.classList.remove('active');
    
    updateKPIs();
    updateCharts();
    renderRecentCalls();
    renderCallLog();
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
    oEl.textContent = call.outcome;
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
  if (topEl) topEl.textContent = topP ? topP[0].charAt(0).toUpperCase() + topP[0].slice(1) : '—';
}

// Start app when DOM loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
