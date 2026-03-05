/* ═══════════════════════════════════════════════════════════
   MVSD Dashboard — App Logic
   Tabs · Counters · Chart.js charts · Controls
   ═══════════════════════════════════════════════════════════ */

// ─── CHART.JS DEFAULTS ───────────────────────────────────
Chart.defaults.color = '#4a6a52';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.animation.duration = 900;
Chart.defaults.animation.easing = 'easeOutQuart';

const C = {
  mvsd:    '#008544',
  mvsdBrt: '#00c060',
  mvsdDim: 'rgba(0,192,96,0.18)',
  wa:      '#3b82f6',
  waDim:   'rgba(59,130,246,0.18)',
  nat:     '#f59e0b',
  natDim:  'rgba(245,158,11,0.15)',
  grid:    'rgba(255,255,255,0.06)',
  text:    '#9ab8a2',
};

// ─── GLOW PLUGIN ─────────────────────────────────────────
const glowPlugin = {
  id: 'glow',
  beforeDatasetsDraw(chart) {
    chart.ctx.save();
    chart.ctx.shadowBlur  = 16;
    chart.ctx.shadowColor = C.mvsdDim;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  },
};

// ─── STATE ───────────────────────────────────────────────
const state = {
  tab:      'academic',
  year:     '2022-23',
  subgroup: 'overall',
  showWA:   true,
  showNat:  true,
  subject:  'ela',
};

// ─── CHART REGISTRY ──────────────────────────────────────
const charts = {};

// ─── COUNTER ANIMATION ───────────────────────────────────
function countUp(el, target, opts = {}) {
  const { duration = 1100, delay = 0, prefix = '', suffix = '', format = 'int' } = opts;
  setTimeout(() => {
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min((now - t0) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      const v = e * target;
      let display;
      if (format === 'currency') display = prefix + Math.round(v).toLocaleString() + suffix;
      else if (format === 'decimal') display = prefix + v.toFixed(1) + suffix;
      else display = prefix + Math.round(v).toLocaleString() + suffix;
      el.textContent = display;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, delay);
}

function runCounters(container) {
  container.querySelectorAll('[data-count]').forEach((el, i) => {
    countUp(el, parseFloat(el.dataset.count), {
      delay:   i * 100,
      prefix:  el.dataset.prefix  || '',
      suffix:  el.dataset.suffix  || '',
      format:  el.dataset.format  || 'int',
    });
  });
}

// ─── FRPL BARS ANIMATION ─────────────────────────────────
function animateFrplBars() {
  document.querySelectorAll('.frpl-fill[data-width]').forEach((el, i) => {
    setTimeout(() => {
      el.style.width = el.dataset.width + '%';
    }, 200 + i * 120);
  });
}

// ─── STAGGER CARDS ───────────────────────────────────────
function staggerCards(panel) {
  panel.querySelectorAll('.animate-in').forEach((card, i) => {
    card.style.animationDelay = (i * 0.07) + 's';
    card.style.opacity = '';
  });
}

// ─── TAB INDICATOR ───────────────────────────────────────
function positionIndicator(btn) {
  const nav = document.querySelector('.tab-nav');
  const ind = document.querySelector('.tab-indicator');
  if (!ind || !btn) return;
  const navRect = nav.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  ind.style.left  = (btnRect.left - navRect.left + nav.scrollLeft) + 'px';
  ind.style.width = btnRect.width + 'px';
}

// ─── SWITCH TAB ──────────────────────────────────────────
function switchTab(tabId) {
  state.tab = tabId;

  document.querySelectorAll('.tab-btn').forEach(b => {
    const active = b.dataset.tab === tabId;
    b.classList.toggle('active', active);
    if (active) positionIndicator(b);
  });

  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === `tab-${tabId}`);
  });

  const panel = document.getElementById(`tab-${tabId}`);
  staggerCards(panel);
  runCounters(panel);

  if (tabId === 'academic')     { buildOrUpdateAcademicCharts(); }
  if (tabId === 'demographics') { buildDemographicsCharts(); animateFrplBars(); }
  if (tabId === 'funding')      { buildFundingCharts(); }
  if (tabId === 'staffing')     { buildStaffingCharts(); }
  if (tabId === 'strategic')    { buildStrategicTab(); staggerCards(panel); }
}

// ─── PROFICIENCY CHART ───────────────────────────────────
function getProficiencyDatasets() {
  const sg   = DATA.proficiency.subgroups[state.subgroup];
  const yr   = state.year;
  const yrs  = DATA.proficiency.years;

  // Fall back to most recent year if selected year has no subgroup data
  const yearKey = (sg.mvsd[yr] ? yr : '2022-23');
  const mvsdVals = sg.mvsd[yearKey] || [null, null, null];
  const waVals   = sg.wa[yearKey]   || [null, null, null];

  const sets = [{
    label: `MVSD #320${sg.estimated ? ' (est.)' : ''}`,
    data: mvsdVals,
    backgroundColor: C.mvsd,
    borderColor:     C.mvsdBrt,
    borderWidth: 1,
    borderRadius: 5,
    barPercentage: 0.65,
  }];

  if (state.showWA) {
    sets.push({
      label: `WA State${sg.estimated ? ' (est.)' : ''}`,
      data: waVals,
      backgroundColor: C.wa,
      borderColor:     C.wa,
      borderWidth: 1,
      borderRadius: 5,
      barPercentage: 0.65,
    });
  }

  return sets;
}

function buildProficiencyChart() {
  const ctx = document.getElementById('proficiencyChart');
  if (!ctx) return;
  if (charts.proficiency) { charts.proficiency.destroy(); }

  charts.proficiency = new Chart(ctx, {
    type: 'bar',
    plugins: [glowPlugin],
    data: {
      labels: DATA.proficiency.labels,
      datasets: getProficiencyDatasets(),
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: C.text, font: { size: 11, weight: '600' }, usePointStyle: true, padding: 16 },
        },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.x ?? '—'}%` },
        },
      },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => v + '%', stepSize: 20 },
          border: { color: 'transparent' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 12, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

function updateProficiencyChart() {
  if (!charts.proficiency) { buildProficiencyChart(); return; }
  charts.proficiency.data.datasets = getProficiencyDatasets();
  charts.proficiency.update();

  // Update title and note
  const sg = DATA.proficiency.subgroups[state.subgroup];
  const yr = DATA.proficiency.yearLabels[state.year] || state.year;
  document.getElementById('proficiency-title').textContent =
    `Proficiency — ${sg.label} · ${yr}`;

  const noteEl = document.getElementById('proficiency-note');
  if (state.subgroup !== 'overall') {
    noteEl.textContent = 'National SBAC comparison not available. WA state subgroup values estimated from OSPI patterns.';
  } else if (state.year === '2019-20') {
    noteEl.textContent = '2019–20: Statewide testing cancelled due to COVID-19 — no data available.';
  } else {
    noteEl.textContent = '';
  }

  const badge = document.getElementById('estimated-badge');
  badge.style.display = sg.estimated ? 'flex' : 'none';
}

// ─── GRADE-LEVEL CHART ────────────────────────────────────
function buildGradeLevelChart() {
  const ctx = document.getElementById('gradeLevelChart');
  if (!ctx) return;
  if (charts.gradeLevel) { charts.gradeLevel.destroy(); }

  const subj = state.subject;
  const mvsdData = DATA.gradeLevel.mvsd[subj];
  const waData   = DATA.gradeLevel.wa[subj];

  charts.gradeLevel = new Chart(ctx, {
    type: 'bar',
    plugins: [glowPlugin],
    data: {
      labels: DATA.gradeLevel.labels,
      datasets: [
        {
          label: 'MVSD #320',
          data: mvsdData,
          backgroundColor: C.mvsd,
          borderRadius: 5,
          barPercentage: 0.6,
        },
        {
          label: 'WA State (approx.)',
          data: waData,
          backgroundColor: C.wa,
          borderRadius: 5,
          barPercentage: 0.6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text, font: { size: 11, weight: '600' }, usePointStyle: true, padding: 14 } },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}%` },
        },
      },
      scales: {
        y: {
          min: 0, max: 80,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => v + '%' },
          border: { color: 'transparent' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 11, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

// ─── GRADUATION TREND CHART ───────────────────────────────
function buildGradTrendChart() {
  const ctx = document.getElementById('gradTrendChart');
  if (!ctx) return;
  if (charts.gradTrend) { charts.gradTrend.destroy(); }

  const { years, mvsd, wa, national } = DATA.graduation;

  const makeGradient = (ctx2d, color) => {
    const g = ctx2d.createLinearGradient(0, 0, 0, 180);
    g.addColorStop(0, color.replace(')', ',0.3)').replace('rgb', 'rgba'));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    return g;
  };

  charts.gradTrend = new Chart(ctx, {
    type: 'line',
    plugins: [glowPlugin],
    data: {
      labels: years,
      datasets: [
        {
          label: 'MVSD #320',
          data: mvsd,
          borderColor: C.mvsdBrt,
          backgroundColor: (context) => {
            const { chart } = context;
            return makeGradient(chart.ctx, '#00c060');
          },
          borderWidth: 2.5,
          pointBackgroundColor: C.mvsdBrt,
          pointRadius: 5,
          pointHoverRadius: 7,
          fill: true,
          tension: 0.35,
        },
        {
          label: 'WA State',
          data: state.showWA ? wa : [],
          borderColor: C.wa,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointBackgroundColor: C.wa,
          pointRadius: 4,
          fill: false,
          tension: 0.35,
          borderDash: [4, 3],
        },
        {
          label: 'National',
          data: state.showNat ? national : [],
          borderColor: C.nat,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointBackgroundColor: C.nat,
          pointRadius: 4,
          fill: false,
          tension: 0.35,
          borderDash: [4, 3],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text, font: { size: 11, weight: '600' }, usePointStyle: true, padding: 16 } },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}%` },
        },
      },
      scales: {
        y: {
          min: 60, max: 95,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => v + '%' },
          border: { color: 'transparent' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 11, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

function buildOrUpdateAcademicCharts() {
  updateProficiencyChart();
  buildGradeLevelChart();
  buildGradTrendChart();
}

// ─── ETHNICITY CHART ──────────────────────────────────────
function buildEthnicityChart() {
  const ctx = document.getElementById('ethnicityChart');
  if (!ctx) return;
  if (charts.ethnicity) { charts.ethnicity.destroy(); }

  const { labels, colors, mvsd } = DATA.ethnicity;
  charts.ethnicity = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: mvsd, backgroundColor: colors, borderColor: '#0c1410', borderWidth: 3, hoverOffset: 8 }],
    },
    options: {
      cutout: '62%',
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.label}: ${c.parsed}%` },
        },
      },
    },
  });

  const leg = document.getElementById('ethnicityLegend');
  if (leg) {
    leg.innerHTML = labels.map((l, i) => `
      <div class="dl-item">
        <span class="dl-swatch" style="background:${colors[i]}"></span>
        <span class="dl-label">${l}</span>
        <span class="dl-pct">${mvsd[i]}%</span>
      </div>`).join('');
  }
}

// ─── DEMOGRAPHIC COMPARISON CHART ────────────────────────
function buildDemoCompareChart() {
  const ctx = document.getElementById('demoCompareChart');
  if (!ctx) return;
  if (charts.demoCompare) { charts.demoCompare.destroy(); }

  const { labels, mvsd, wa, nat } = DATA.ethnicity;
  charts.demoCompare = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'MVSD #320', data: mvsd, backgroundColor: C.mvsd, borderRadius: 4, barPercentage: 0.7 },
        { label: 'WA State',  data: wa,   backgroundColor: C.wa,   borderRadius: 4, barPercentage: 0.7 },
        { label: 'National',  data: nat,  backgroundColor: C.nat,  borderRadius: 4, barPercentage: 0.7 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: C.text, font: { size: 11, weight: '600' }, usePointStyle: true, padding: 14 } },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.dataset.label}: ${c.parsed.y}%` },
        },
      },
      scales: {
        y: {
          min: 0, max: 65,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => v + '%' },
          border: { color: 'transparent' },
        },
        x: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 10, weight: '600' }, maxRotation: 30 },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

function buildDemographicsCharts() {
  buildEthnicityChart();
  buildDemoCompareChart();
}

// ─── SPENDING CHART ───────────────────────────────────────
function buildFundingCharts() {
  const ctx = document.getElementById('spendingChart');
  if (!ctx) return;
  if (charts.spending) { charts.spending.destroy(); }

  const { mvsd, wa, nat } = DATA.spending.perPupil;
  charts.spending = new Chart(ctx, {
    type: 'bar',
    plugins: [glowPlugin],
    data: {
      labels: ['MVSD #320', 'WA State Median', 'National Average'],
      datasets: [{
        data: [mvsd, wa, nat],
        backgroundColor: [C.mvsd, C.wa, C.nat],
        borderRadius: 6,
        barPercentage: 0.5,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` $${c.parsed.x.toLocaleString()} per student` },
        },
      },
      scales: {
        x: {
          min: 0,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => '$' + (v / 1000).toFixed(0) + 'k' },
          border: { color: 'transparent' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 12, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

// ─── STAFFING RATIO CHART ────────────────────────────────
function buildStaffingCharts() {
  const ctx = document.getElementById('ratioChart');
  if (!ctx) return;
  if (charts.ratio) { charts.ratio.destroy(); }

  const { mvsd, wa, nat } = DATA.staffing.studentTeacherRatio;
  charts.ratio = new Chart(ctx, {
    type: 'bar',
    plugins: [glowPlugin],
    data: {
      labels: ['MVSD #320', 'WA State Avg', 'National Avg'],
      datasets: [{
        data: [mvsd, wa, nat],
        backgroundColor: [C.mvsd, C.wa, C.nat],
        borderRadius: 6,
        barPercentage: 0.5,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0c1410',
          borderColor: 'rgba(0,133,68,0.3)',
          borderWidth: 1,
          callbacks: { label: c => ` ${c.parsed.x}:1 ratio` },
        },
      },
      scales: {
        x: {
          min: 0, max: 22,
          grid: { color: C.grid },
          ticks: { color: '#4a6a52', callback: v => v + ':1' },
          border: { color: 'transparent' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#9ab8a2', font: { size: 12, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

// ─── BUS SVG GENERATOR ───────────────────────────────────
function buildBusSVG(greenCount, idx) {
  // Unique ID prefix so multiple SVGs don't conflict
  const p = `b${idx}`;

  // 10 dot positions: 2 columns × 5 rows, filled left-then-right each row, top to bottom
  const positions = [
    [50,83],[90,83],
    [50,113],[90,113],
    [50,143],[90,143],
    [50,173],[90,173],
    [50,203],[90,203],
  ];

  const dots = positions.map(([cx, cy], i) => {
    if (i < greenCount) {
      return `<circle cx="${cx}" cy="${cy}" r="12" fill="#008544"/>`;
    } else {
      return `<circle cx="${cx}" cy="${cy}" r="12" fill="#F0F0F0" stroke="rgba(0,0,0,0.1)" stroke-width="0.8"/>`;
    }
  }).join('');

  return `<svg viewBox="0 0 140 260" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <filter id="${p}sh" x="-30%" y="-10%" width="160%" height="130%">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.20"/>
    </filter>
    <linearGradient id="${p}bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#C47800"/>
      <stop offset="16%"  stop-color="#FFB500"/>
      <stop offset="50%"  stop-color="#FFC835"/>
      <stop offset="84%"  stop-color="#FFB500"/>
      <stop offset="100%" stop-color="#C47800"/>
    </linearGradient>
    <linearGradient id="${p}edge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#000" stop-opacity="0.12"/>
      <stop offset="30%"  stop-color="#000" stop-opacity="0"/>
      <stop offset="70%"  stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.12"/>
    </linearGradient>
  </defs>

  <!-- Drop shadow -->
  <rect x="10" y="14" width="120" height="238" rx="13" fill="#000" opacity="0.16" filter="url(#${p}sh)"/>

  <!-- Main bus body -->
  <rect x="8" y="8" width="124" height="244" rx="13" fill="url(#${p}bg)"/>

  <!-- Edge shading for 3-D depth -->
  <rect x="8" y="8" width="124" height="244" rx="13" fill="url(#${p}edge)"/>

  <!-- Roof cap / top trim strip -->
  <rect x="8" y="8" width="124" height="13" rx="13" fill="#A86800" opacity="0.60"/>

  <!-- Vent marks above windshield -->
  <rect x="27" y="19" width="22" height="4" rx="1.5" fill="#7A4A00" opacity="0.55"/>
  <rect x="91" y="19" width="22" height="4" rx="1.5" fill="#7A4A00" opacity="0.55"/>

  <!-- Windshield left pane -->
  <rect x="17" y="26" width="46" height="34" rx="4" fill="#1C1C1C"/>
  <!-- Windshield right pane -->
  <rect x="77" y="26" width="46" height="34" rx="4" fill="#1C1C1C"/>
  <!-- Windshield sheen (subtle reflection) -->
  <rect x="21" y="29" width="12" height="7" rx="2" fill="#fff" opacity="0.05"/>
  <rect x="81" y="29" width="12" height="7" rx="2" fill="#fff" opacity="0.05"/>

  <!-- Left side window panels (5 stacked) -->
  <rect x="8" y="68"  width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="8" y="96"  width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="8" y="124" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="8" y="152" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="8" y="180" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>

  <!-- Right side window panels (5 stacked) -->
  <rect x="117" y="68"  width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="117" y="96"  width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="117" y="124" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="117" y="152" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>
  <rect x="117" y="180" width="15" height="22" rx="2" fill="#1C1C1C" opacity="0.78"/>

  <!-- Left mirror -->
  <rect x="0"   y="42" width="9" height="13" rx="3" fill="#B87400"/>
  <!-- Right mirror -->
  <rect x="131" y="42" width="9" height="13" rx="3" fill="#B87400"/>

  <!-- Tail lights -->
  <rect x="12"  y="226" width="20" height="14" rx="3" fill="#A13E3D" opacity="0.90"/>
  <rect x="108" y="226" width="20" height="14" rx="3" fill="#A13E3D" opacity="0.90"/>

  <!-- Bumper strip -->
  <rect x="8" y="240" width="124" height="12" rx="8" fill="#1C1C1C" opacity="0.85"/>

  <!-- Center latch -->
  <circle cx="70" cy="249" r="3.5" fill="#1C1C1C" opacity="0.50"/>

  <!-- Performance dots -->
  ${dots}
</svg>`;
}

// ─── STRATEGIC TAB ────────────────────────────────────────
function buildStrategicTab() {
  const grid = document.getElementById('bus-grid');
  if (!grid || grid.dataset.built) return;

  const busMetrics = [
    {
      label:     'Graduation Rate',
      pct:       82,
      green:     8,   // 82% → 8 in 10
      caption:   '8 in 10 students graduate on time',
      benchmark: 'WA State: 83.6%',
      above:     false,
      source:    '4-Year ACGR · OSPI 2022–23',
    },
    {
      label:     'ELA / Reading',
      pct:       72,
      green:     7,   // 72% → 7 in 10
      caption:   '7 in 10 students meet ELA standard',
      benchmark: 'WA State: 58% ↑ +14 pts above state',
      above:     true,
      source:    'SBAC Grade 10 · OSPI 2022–23',
    },
    {
      label:     'Mathematics',
      pct:       24,
      green:     2,   // 24% → 2 in 10
      caption:   '2 in 10 students meet Math standard',
      benchmark: 'WA State: 31%',
      above:     false,
      source:    'SBAC Grade 10 · OSPI 2022–23',
    },
  ];

  grid.innerHTML = busMetrics.map((d, i) => `
    <div class="bus-card animate-in" style="animation-delay:${i * 0.14}s">
      <div class="bus-svg-wrap">${buildBusSVG(d.green, i)}</div>
      <div class="bus-info">
        <div class="bus-label">${d.label}</div>
        <div class="bus-pct ${d.green <= 3 ? 'pct-warn' : ''}">${d.pct}%</div>
        <div class="bus-caption">${d.caption}</div>
        <div class="bus-benchmark ${d.above ? 'bench-above' : 'bench-below'}">${d.benchmark}</div>
        <div class="bus-source">${d.source}</div>
      </div>
    </div>`).join('');

  grid.dataset.built = '1';
}

// ─── DOWNLOAD CHART AS PNG ───────────────────────────────
function downloadChart(chartKey, filename) {
  const chart = charts[chartKey];
  if (!chart) return;
  const src = chart.canvas;
  const tmp = document.createElement('canvas');
  tmp.width  = src.width;
  tmp.height = src.height;
  const ctx2 = tmp.getContext('2d');
  ctx2.fillStyle = '#0c1410';
  ctx2.fillRect(0, 0, tmp.width, tmp.height);
  ctx2.drawImage(src, 0, 0);
  const a = document.createElement('a');
  a.href     = tmp.toDataURL('image/png');
  a.download = filename + '.png';
  a.click();
}

// ─── EXPORT ALL DATA AS CSV ──────────────────────────────
function exportCSV() {
  const D    = DATA;
  const rows = [];
  const hr   = () => rows.push(['════════════════════════════════════════════════════════════════════']);

  // Title block
  rows.push(['MVSD #320 — District Performance Dashboard']);
  rows.push(['Mount Vernon School District', 'Skagit County, Washington State']);
  rows.push(['Generated:', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
  rows.push(['Data years:', '2022-23 and 2023-24 school years']);
  rows.push(['']);

  // ── Key Metrics Summary ───────────────────────────────
  hr();
  rows.push(['SECTION 1: KEY METRICS SUMMARY']);
  hr();
  rows.push(['Metric', 'MVSD #320', 'WA State', 'National', 'Notes']);
  rows.push(['']);
  rows.push(['ENROLLMENT & SCHOOLS (2023-24)']);
  rows.push(['Total Students Enrolled',  D.staffing.totalStudents, '', '', 'Source: NCES CCD']);
  rows.push(['Number of Schools',         D.staffing.totalSchools,  '', '', 'Source: NCES CCD']);
  rows.push(['FTE Classroom Teachers',    D.staffing.fteTeachers,   '', '', 'Full-time equivalent']);
  rows.push(['']);
  rows.push(['STUDENT-TEACHER RATIO']);
  rows.push(['Students per Teacher', D.staffing.studentTeacherRatio.mvsd + ':1', D.staffing.studentTeacherRatio.wa + ':1', D.staffing.studentTeacherRatio.nat + ':1', 'Lower = better']);
  rows.push(['']);
  rows.push(['FUNDING (2022-23)']);
  rows.push(['Per-Pupil Expenditure',   '$' + D.spending.perPupil.mvsd.toLocaleString(), '$' + D.spending.perPupil.wa.toLocaleString(), '$' + D.spending.perPupil.nat.toLocaleString(), 'Annual current spending per student']);
  rows.push(['Total District Revenue',  '$132M', '', '', 'All revenue sources']);
  rows.push(['Total District Spending',  '$130M', '', '', 'Current expenditures']);
  rows.push(['']);
  rows.push(['DEMOGRAPHICS']);
  rows.push(['FRPL Eligibility',         D.frpl.mvsd + '%', '~' + D.frpl.wa + '%', '~' + D.frpl.nat + '%', 'Free & Reduced-Price Lunch (economic indicator)']);
  rows.push(['Hispanic/Latino Students', '57%',  '24%',  '28%',  'MVSD is significantly above WA state average']);
  rows.push(['']);
  rows.push(['GRADUATION RATE (2022-23)']);
  rows.push(['4-Year ACGR',             '82%',   '83.6%', '87.4%', 'Adjusted Cohort Graduation Rate (nationally comparable)']);
  rows.push(['']);

  // ── Academic Proficiency ──────────────────────────────
  hr();
  rows.push(['SECTION 2: ACADEMIC PROFICIENCY — SBAC']);
  rows.push(['Smarter Balanced Assessment (% of students Meeting or Exceeding Standard)']);
  rows.push(['NOTE: WA SBAC scores are NOT directly comparable to national NAEP scores']);
  hr();
  rows.push(['']);
  rows.push(['Subgroup', 'Year', 'MVSD Math %', 'MVSD ELA %', 'MVSD Science %', 'WA Math %', 'WA ELA %', 'WA Science %', 'Data Type']);
  for (const [, sg] of Object.entries(D.proficiency.subgroups)) {
    rows.push(['']);
    rows.push([`--- ${sg.label.toUpperCase()} ---`]);
    for (const yr of D.proficiency.years) {
      if (!sg.mvsd[yr]) continue;
      const mv  = sg.mvsd[yr];
      const wa  = sg.wa[yr] || [];
      const tag = sg.estimated ? 'Estimated' : 'Confirmed (OSPI)';
      rows.push([sg.label, yr, mv[0], mv[1], mv[2] ?? 'N/A', wa[0] ?? '', wa[1] ?? '', wa[2] ?? '', tag]);
    }
  }
  rows.push(['']);

  // ── Grade-Level ───────────────────────────────────────
  hr();
  rows.push(['SECTION 3: PROFICIENCY BY GRADE LEVEL — 2022-23']);
  rows.push(['Source: Public School Review 2022-23 | WA state values approximate']);
  hr();
  rows.push(['']);
  rows.push(['School Level', 'MVSD ELA %', 'MVSD Math %', 'WA ELA % (approx)', 'WA Math % (approx)']);
  D.gradeLevel.labels.forEach((lbl, i) => {
    rows.push([lbl, D.gradeLevel.mvsd.ela[i] + '%', D.gradeLevel.mvsd.math[i] + '%', D.gradeLevel.wa.ela[i] + '%', D.gradeLevel.wa.math[i] + '%']);
  });
  rows.push(['']);

  // ── Graduation ────────────────────────────────────────
  hr();
  rows.push(['SECTION 4: GRADUATION RATES — 5-YEAR TREND']);
  rows.push(['4-Year Adjusted Cohort Graduation Rate (ACGR) — nationally comparable']);
  rows.push(['NOTE: 2019-20 data not shown; statewide testing cancelled due to COVID-19']);
  hr();
  rows.push(['']);
  rows.push(['School Year', 'MVSD %', 'WA State %', 'National %']);
  D.graduation.years.forEach((yr, i) => {
    rows.push([yr, D.graduation.mvsd[i] + '%', D.graduation.wa[i] + '%', D.graduation.national[i] + '%']);
  });
  rows.push(['', '', '', '', 'MVSD gained +11 percentage points from 2018-19 to 2022-23']);
  rows.push(['']);

  // ── Demographics ──────────────────────────────────────
  hr();
  rows.push(['SECTION 5: DEMOGRAPHICS — RACIAL & ETHNIC ENROLLMENT']);
  rows.push(['Source: NCES CCD 2023-24 | WA and National values approximate']);
  hr();
  rows.push(['']);
  rows.push(['Racial/Ethnic Group', 'MVSD %', 'WA State %', 'National %']);
  D.ethnicity.labels.forEach((lbl, i) => {
    rows.push([lbl, D.ethnicity.mvsd[i] + '%', D.ethnicity.wa[i] + '%', D.ethnicity.nat[i] + '%']);
  });
  rows.push(['']);

  // ── Sources ───────────────────────────────────────────
  hr();
  rows.push(['SECTION 6: DATA SOURCES']);
  hr();
  rows.push(['']);
  rows.push(['Source', 'URL', 'Data Used']);
  rows.push(['WA State Report Card (OSPI)',   'https://washingtonstatereportcard.ospi.k12.wa.us/', 'SBAC proficiency by district, subgroup, year']);
  rows.push(['OSPI Graduation Statistics',    'https://ospi.k12.wa.us/',                           '4-year ACGR by district (2022-23)']);
  rows.push(['NCES Common Core of Data (CCD)','https://nces.ed.gov/ccd/',                          'Enrollment, staffing, school count (2023-24)']);
  rows.push(['NCES Fast Facts: Graduation',   'https://nces.ed.gov/fastfacts/display.asp?id=805',  'National graduation rate benchmarks']);
  rows.push(['Public School Review',          'https://www.publicschoolreview.com/',               'Per-pupil spending, grade-level proficiency, FRPL']);
  rows.push(['NEA Rankings & Estimates 2024', 'https://www.nea.org/resource-library/rankings-estimates-state-state-education-data', 'WA state and national per-pupil spending medians']);

  // Serialize
  const esc = cell => {
    const s = String(cell ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? '"' + s.replace(/"/g, '""') + '"'
      : s;
  };
  const csv = '\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'MVSD-Dashboard-Data.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── CONTROL HANDLERS ────────────────────────────────────
function bindControls() {
  document.getElementById('ctrl-year').addEventListener('change', e => {
    state.year = e.target.value;
    updateProficiencyChart();
  });

  document.getElementById('ctrl-subgroup').addEventListener('change', e => {
    state.subgroup = e.target.value;
    updateProficiencyChart();
  });

  document.getElementById('toggle-wa').addEventListener('click', function () {
    state.showWA = !state.showWA;
    this.classList.toggle('active', state.showWA);
    updateProficiencyChart();
    if (charts.gradTrend) { buildGradTrendChart(); }
  });

  document.getElementById('toggle-nat').addEventListener('click', function () {
    state.showNat = !state.showNat;
    this.classList.toggle('active', state.showNat);
    if (charts.gradTrend) { buildGradTrendChart(); }
  });

  document.querySelectorAll('.subj-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      state.subject = this.dataset.subject;
      document.querySelectorAll('.subj-btn').forEach(b => b.classList.toggle('active', b === this));
      buildGradeLevelChart();
    });
  });

  // Chart download buttons
  const chartFilenames = {
    proficiency: 'MVSD-Proficiency',
    gradeLevel:  'MVSD-Grade-Level',
    gradTrend:   'MVSD-Graduation-Trend',
    ethnicity:   'MVSD-Ethnicity',
    demoCompare: 'MVSD-Demographics',
    spending:    'MVSD-Per-Pupil-Spending',
    ratio:       'MVSD-Student-Teacher-Ratio',
  };
  document.querySelectorAll('.dl-chart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.chart;
      downloadChart(key, chartFilenames[key] || key);
    });
  });

  document.getElementById('export-csv').addEventListener('click', exportCSV);
}

// ─── TAB HANDLERS ────────────────────────────────────────
function bindTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ─── INIT ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindTabs();
  bindControls();

  // Position indicator on first active tab
  const activeBtn = document.querySelector('.tab-btn.active');
  requestAnimationFrame(() => positionIndicator(activeBtn));
  window.addEventListener('resize', () => positionIndicator(document.querySelector('.tab-btn.active')));

  // Initialize first tab
  const firstPanel = document.getElementById('tab-academic');
  staggerCards(firstPanel);
  runCounters(document.querySelector('.site-header'));
  runCounters(firstPanel);
  buildOrUpdateAcademicCharts();
});
