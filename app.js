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

// ─── BUS HTML GENERATOR ───────────────────────────────────
function buildBusHTML(greenCount) {
  // 10 dots in a 2×5 grid, filled row by row (left-then-right, top to bottom)
  const dotRows = Array.from({ length: 5 }, (_, row) => {
    const d0 = row * 2, d1 = row * 2 + 1;
    return `<div class="bus-dot-row">` +
      `<div class="bus-dot ${d0 < greenCount ? 'green' : 'white'}"></div>` +
      `<div class="bus-dot ${d1 < greenCount ? 'green' : 'white'}"></div>` +
      `</div>`;
  }).join('');

  const winCol = `<div class="bus-wins-col">${Array(5).fill('<div class="bus-win"></div>').join('')}</div>`;

  return `<div class="bus-wrap">
    <div class="bus-mirror bus-mirror-l"></div>
    <div class="bus-mirror bus-mirror-r"></div>
    <div class="bus-body">
      <div class="bus-roof-cap"></div>
      <div class="bus-vents"><div class="bus-vent"></div><div class="bus-vent"></div></div>
      <div class="bus-windshields"><div class="bus-ws"></div><div class="bus-ws"></div></div>
      <div class="bus-mid">${winCol}<div class="bus-dots-grid">${dotRows}</div>${winCol}</div>
      <div class="bus-lights-row"><div class="bus-light"></div><div class="bus-light"></div></div>
      <div class="bus-bumper"><div class="bus-latch"></div></div>
    </div>
  </div>`;
}

// ─── TARGET LINE PLUGINS ──────────────────────────────────
// Vertical dashed line for horizontal bar charts (indexAxis:'y')
function makeVTargetLine(value, label) {
  return {
    id: 'vTargetLine',
    afterDraw(chart) {
      const { ctx, chartArea, scales } = chart;
      const x = scales.x.getPixelForValue(value);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x, chartArea.top);
      ctx.lineTo(x, chartArea.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255,255,255,0.36)';
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label || `${value}%`, x, chartArea.top - 3);
      ctx.restore();
    },
  };
}

// ─── STRATEGIC TAB ────────────────────────────────────────
function buildStrategicTab() {
  const container = document.getElementById('strat-content');
  if (!container || container.dataset.built) return;

  const goals = [
    { area: 'Attendance',               target: '90%'  },
    { area: 'TTK–5 Proficiency',        target: '90%'  },
    { area: 'Literacy Growth (Gr. 6)',  target: '90%'  },
    { area: 'Middle School Mastery',    target: '90%'  },
    { area: '9th Grade On-Track',       target: '90%'  },
    { area: 'FAFSA / WASFA',            target: '100%' },
    { area: 'Belonging & Engagement',   target: '100%' },
  ];

  const goalChips = goals.map(g => `
    <div class="strat-goal-chip ${g.target === '100%' ? 'goal-chip-gold' : ''}">
      <div class="strat-goal-target">${g.target}</div>
      <div class="strat-goal-area">${g.area}</div>
    </div>`).join('');

  const busLegend = (greenLabel, whiteLabel) => `
    <div class="strat-bus-legend">
      <span class="strat-leg-item"><span class="strat-leg-dot dot-green"></span>${greenLabel}</span>
      <span class="strat-leg-item"><span class="strat-leg-dot dot-white"></span>${whiteLabel}</span>
      <span class="strat-leg-note">Each dot = 10% of students</span>
    </div>`;

  container.innerHTML = `

    <!-- ── PLAN HEADER ───────────────────────────────── -->
    <div class="strat-plan-header card animate-in">
      <div class="strat-plan-badge">6-YEAR STRATEGIC PLAN · ADOPTED 2025 · TARGET 2031</div>
      <h2 class="strat-plan-title">Mount Vernon School District Strategic Initiatives</h2>
      <div class="strat-progress-row">
        <span class="strat-prog-lbl">Start</span>
        <div class="strat-progbar-wrap">
          <div class="strat-progbar" style="width:8.33%"></div>
          <div class="strat-progbar-label">Year 0.5 of 6 · Presented Feb 18, 2026</div>
        </div>
        <span class="strat-prog-lbl">2031</span>
      </div>
    </div>

    <!-- ── GOALS OVERVIEW ───────────────────────────── -->
    <div class="strat-goals-wrap animate-in">
      <div class="strat-section-label">DISTRICT TARGETS BY 2031 — "9 IN 10" STANDARD</div>
      <div class="strat-goals-grid">${goalChips}</div>
    </div>

    <!-- ── ATTENDANCE ───────────────────────────────── -->
    <div class="strat-section card animate-in">
      <div class="strat-sec-head">
        <div class="strat-sec-badge">01</div>
        <div>
          <div class="strat-sec-title">Attendance</div>
          <div class="strat-sec-desc">9 in 10 students will attend school 90% of the time · <strong>Target: 90% by 2031</strong> · Source: Homeroom</div>
        </div>
      </div>
      <div class="strat-sec-body">
        <div class="strat-bus-col">
          ${buildBusHTML(7)}
          <div class="strat-bus-pct">65%</div>
          <div class="strat-bus-sub">Districtwide · All Students<br>2025–26</div>
          ${busLegend('Attending ≥90%', 'Below threshold')}
        </div>
        <div class="strat-charts-col">
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">By Student Group · Districtwide</div>
            <div class="chart-wrap" style="height:150px"><canvas id="strat-attend-groups"></canvas></div>
          </div>
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">By Program / Service Type · Districtwide</div>
            <div class="chart-wrap" style="height:150px"><canvas id="strat-attend-prog"></canvas></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── EARLY LITERACY ───────────────────────────── -->
    <div class="strat-section card animate-in">
      <div class="strat-sec-head">
        <div class="strat-sec-badge">02</div>
        <div>
          <div class="strat-sec-title">Early Literacy (IRLA)</div>
          <div class="strat-sec-desc">9 in 10 students will be at and above proficiency in reading at the end of each grade level · <strong>Target: 90% by 2031</strong> · Source: SchoolPace (ARC)</div>
        </div>
      </div>
      <div class="strat-sec-body">
        <div class="strat-bus-col">
          ${buildBusHTML(5)}
          <div class="strat-bus-pct">52%</div>
          <div class="strat-bus-sub">At/Above Proficiency<br>Jan 2026</div>
          <div class="strat-bus-delta">↑ +27.7 pts since Oct 2023</div>
          ${busLegend('At/Above grade level', 'Below grade level')}
        </div>
        <div class="strat-charts-col">
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">IRLA Proficiency Growth — All Students</div>
            <div class="chart-wrap" style="height:130px"><canvas id="strat-irla-trend"></canvas></div>
          </div>
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">Current Proficiency by Group · Jan 2026</div>
            <div class="chart-wrap" style="height:130px"><canvas id="strat-irla-groups"></canvas></div>
          </div>
        </div>
      </div>

      <!-- IRLA Cohort 3-year tracking -->
      <div class="strat-subsec">
        <div class="strat-subsec-label">3-YEAR COHORT GROWTH · PROFICIENT · AT RISK · EMERGENCY</div>
        <div class="strat-cohort-grid">
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">Class of 2033 · 3rd → 5th Grade · 341 students</div>
            <div class="chart-wrap" style="height:160px"><canvas id="strat-cohort-2033"></canvas></div>
          </div>
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">Class of 2034 · 2nd → 4th Grade · 359 students</div>
            <div class="chart-wrap" style="height:160px"><canvas id="strat-cohort-2034"></canvas></div>
          </div>
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">Class of 2035 · 1st → 3rd Grade · 337 students</div>
            <div class="chart-wrap" style="height:160px"><canvas id="strat-cohort-2035"></canvas></div>
          </div>
        </div>
        <div class="strat-cohort-legend">
          <span class="strat-cohort-leg"><span class="strat-cohort-dot" style="background:#008544"></span>Proficient</span>
          <span class="strat-cohort-leg"><span class="strat-cohort-dot" style="background:#f59e0b"></span>At Risk</span>
          <span class="strat-cohort-leg"><span class="strat-cohort-dot" style="background:#ef4444"></span>Emergency</span>
        </div>
      </div>

      <!-- Grade 6 Literacy Growth sub-section -->
      <div class="strat-subsec">
        <div class="strat-subsec-label">GRADE 6 LITERACY GROWTH · STUDENTS ENTERING BELOW GRADE LEVEL · SOURCE: STAR ASSESSMENTS</div>
        <div class="strat-sec-body">
          <div class="strat-bus-col">
            ${buildBusHTML(4)}
            <div class="strat-bus-pct">38%</div>
            <div class="strat-bus-sub">Demonstrated high growth<br>271 students · 2025–26</div>
            ${busLegend('High growth', 'Low growth')}
          </div>
          <div class="strat-charts-col">
            <div class="strat-chart-block">
              <div class="strat-chart-lbl">High Growth Rate by School</div>
              <div class="chart-wrap" style="height:130px"><canvas id="strat-grade6-growth"></canvas></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── MIDDLE SCHOOL MASTERY ──────────────────────── -->
    <div class="strat-section card animate-in">
      <div class="strat-sec-head">
        <div class="strat-sec-badge">03</div>
        <div>
          <div class="strat-sec-title">Middle School Mastery</div>
          <div class="strat-sec-desc">9 in 10 middle school students will demonstrate mastery of learning standards in all classes · <strong>Target: 90% by 2031</strong> · Source: Star Assessments</div>
        </div>
      </div>
      <div class="strat-sec-body">
        <div class="strat-bus-col">
          ${buildBusHTML(5)}
          <div class="strat-bus-pct">48%</div>
          <div class="strat-bus-sub">At/Above Benchmark<br>Star Math · Winter 25–26</div>
          ${busLegend('At/Above benchmark', 'Watch / Intervention')}
        </div>
        <div class="strat-charts-col">
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">Star Math Benchmark Distribution — Grades 6–8 · Districtwide</div>
            <div class="chart-wrap" style="height:200px"><canvas id="strat-ms-math"></canvas></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 9TH GRADE ON-TRACK ────────────────────────── -->
    <div class="strat-section card animate-in">
      <div class="strat-sec-head">
        <div class="strat-sec-badge">04</div>
        <div>
          <div class="strat-sec-title">9th Grade On-Track</div>
          <div class="strat-sec-desc">9 in 10 9th graders will be on track to graduate with 6 credits earned at the end of 9th grade · <strong>Target: 90% by 2031</strong> · Source: Homeroom</div>
        </div>
      </div>
      <div class="strat-sec-body">
        <div class="strat-bus-col">
          ${buildBusHTML(8)}
          <div class="strat-bus-pct">80%</div>
          <div class="strat-bus-sub">With 3+ credits after<br>Semester 1 · 2025–26</div>
          ${busLegend('On track', 'Not yet on track')}
        </div>
        <div class="strat-charts-col">
          <div class="strat-chart-block">
            <div class="strat-chart-lbl">On-Track Rate by Student Group · Semester 1 2025–26</div>
            <div class="chart-wrap" style="height:155px"><canvas id="strat-ninth-groups"></canvas></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── HIGHLIGHTS ROW ────────────────────────────── -->
    <div class="strat-highlights animate-in">

      <div class="strat-hl-card card">
        <div class="strat-hl-icon">★</div>
        <div class="strat-hl-big">69</div>
        <div class="strat-hl-label">Seal of Biliteracy</div>
        <div class="strat-hl-sub">Graduates · Class of 2025</div>
        <div class="strat-hl-desc">Students who demonstrated proficiency in English and at least one additional language upon graduation</div>
      </div>

      <div class="strat-pilot-card card">
        <div class="strat-sec-head" style="margin-bottom:18px">
          <div class="strat-sec-badge">05</div>
          <div>
            <div class="strat-sec-title">Elementary Math Curriculum Pilot</div>
            <div class="strat-sec-desc">6 schools · Grades K–5 · Pilot Window 1: Nov 10 – Feb 6 · Window 2: Feb 10 – Apr 24</div>
          </div>
        </div>
        <div class="strat-pilot-body">
          <div class="strat-pilot-pie-col">
            <div class="strat-chart-lbl">Pilot Team (58 members)</div>
            <div style="width:160px;height:160px;flex-shrink:0"><canvas id="strat-pilot-pie"></canvas></div>
            <div id="strat-pilot-legend" class="strat-pilot-legend"></div>
          </div>
          <div class="strat-pilot-pd-col">
            <div class="strat-pd-heading">PROFESSIONAL DEVELOPMENT</div>
            <div class="strat-pd-item">
              <span class="strat-pd-date">Oct 2024</span>
              <span class="strat-pd-text">Equity in Elementary Math Keynote — Rolanda Baldwin (UnboundEd)</span>
            </div>
            <div class="strat-pd-item">
              <span class="strat-pd-date">Oct 2025</span>
              <span class="strat-pd-text">Figuring Out Fluency in Math — Dr. Jennifer Bay Williams</span>
            </div>
            <div class="strat-pd-item">
              <span class="strat-pd-date">Oct 2025</span>
              <span class="strat-pd-text">Multilingual Mindsets and Practices in Mathematics — WCEPS Coaches</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Initialize all charts after HTML is in DOM
  initStratAttendGroups();
  initStratAttendProg();
  initStratIrlaTrend();
  initStratIrlaGroups();
  initStratIrlaCohorts();
  initStratGrade6Growth();
  initStratMSMath();
  initStratNinthGroups();
  initStratPilotPie();

  container.dataset.built = '1';
}

// ─── STRATEGIC CHART HELPERS ──────────────────────────────
function stratHBar(canvasId, labels, data, colors) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors || data.map(() => C.mvsd),
        borderRadius: 3,
        barThickness: 14,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.raw}%` } },
      },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: C.grid },
          ticks: { color: C.text, font: { size: 10 }, callback: v => v + '%' },
        },
        y: {
          grid: { display: false },
          ticks: { color: C.text, font: { size: 10 } },
        },
      },
    },
    plugins: [glowPlugin, makeVTargetLine(90, 'Goal: 90%')],
  });
}

function initStratAttendGroups() {
  stratHBar(
    'strat-attend-groups',
    ['All Students', 'TBIP', 'Students w/ Disabilities', 'Hispanic / Latino'],
    [65, 64, 62, 56]
  );
}

function initStratAttendProg() {
  stratHBar(
    'strat-attend-prog',
    ['Gifted', 'Bilingual', 'Special Education', 'Free / Reduced Lunch', 'Homeless'],
    [77, 64, 62, 61, 53],
    ['#3b82f6', C.mvsd, C.mvsd, C.mvsd, '#f59e0b']
  );
}

function initStratIrlaTrend() {
  const ctx = document.getElementById('strat-irla-trend');
  if (!ctx) return;
  charts['strat-irla-trend'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: [['Oct 2023', '(Baseline)'], ['Jan 2026', '(Current)'], ['2031', '(Target)']],
      datasets: [{
        data: [24.7, 52.4, 90],
        backgroundColor: ['#f59e0b', C.mvsd, 'rgba(0,133,68,0.22)'],
        borderColor:     ['transparent', 'transparent', C.mvsd],
        borderWidth:     [0, 0, 2],
        borderRadius: 4,
        barThickness: 44,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.raw}%` } },
      },
      scales: {
        y: {
          min: 0, max: 100,
          grid: { color: C.grid },
          ticks: { color: C.text, font: { size: 10 }, callback: v => v + '%' },
        },
        x: { grid: { display: false }, ticks: { color: C.text, font: { size: 10 } } },
      },
    },
    plugins: [glowPlugin],
  });
}

function initStratIrlaGroups() {
  stratHBar(
    'strat-irla-groups',
    ['Overall', 'Hispanic / Latino', 'TBIP', 'Students w/ Disabilities'],
    [52.4, 44, 34, 31],
    [C.mvsdBrt, C.mvsd, C.mvsd, C.mvsd]
  );
}

function initStratNinthGroups() {
  stratHBar(
    'strat-ninth-groups',
    ['All Students', 'Hispanic / Latino', 'Students w/ Disabilities', 'TBIP'],
    [79.9, 79.5, 78.7, 75.0]
  );
}

function initStratPilotPie() {
  const ctx = document.getElementById('strat-pilot-pie');
  if (!ctx) return;
  const data = [
    { label: 'Classroom Teachers', count: 22, color: C.mvsd },
    { label: 'Math Specialists',   count: 4,  color: '#3b82f6' },
    { label: 'Inst. Coaches',      count: 3,  color: '#8b5cf6' },
    { label: 'Resource Room',      count: 3,  color: '#06b6d4' },
    { label: 'Multilingual Spec.', count: 2,  color: '#f59e0b' },
    { label: 'Admin',              count: 2,  color: '#6b7280' },
  ];
  charts['strat-pilot-pie'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.map(d => d.label),
      datasets: [{
        data:            data.map(d => d.count),
        backgroundColor: data.map(d => d.color),
        borderWidth: 2,
        borderColor: '#0c1410',
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => ` ${c.label}: ${c.raw}` } },
      },
    },
  });
  const legend = document.getElementById('strat-pilot-legend');
  if (legend) {
    legend.innerHTML = data.map(d =>
      `<div class="strat-pilot-leg-row">
        <span class="strat-pilot-leg-dot" style="background:${d.color}"></span>
        <span>${d.label} <span class="strat-pilot-leg-n">(${d.count})</span></span>
      </div>`
    ).join('');
  }
}

// ─── IRLA COHORT STACKED BAR CHARTS ──────────────────────
function initStratIrlaCohorts() {
  const cohorts = [
    {
      id: 'strat-cohort-2033',
      labels: [['3rd Gr', '23/24'], ['4th Gr', '24/25'], ['5th Gr', '25/26']],
      proficient: [145, 164, 191],
      atRisk:     [38,  63,  64 ],
      emergency:  [158, 140, 112],
    },
    {
      id: 'strat-cohort-2034',
      labels: [['2nd Gr', '23/24'], ['3rd Gr', '24/25'], ['4th Gr', '25/26']],
      proficient: [91,  198, 230],
      atRisk:     [133, 55,  73 ],
      emergency:  [135, 136, 86 ],
    },
    {
      id: 'strat-cohort-2035',
      labels: [['1st Gr', '23/24'], ['2nd Gr', '24/25'], ['3rd Gr', '25/26']],
      proficient: [171, 149, 228],
      atRisk:     [39,  104, 35 ],
      emergency:  [127, 123, 113],
    },
  ];
  cohorts.forEach(c => {
    const ctx = document.getElementById(c.id);
    if (!ctx) return;
    charts[c.id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: c.labels,
        datasets: [
          { label: 'Proficient', data: c.proficient, backgroundColor: C.mvsd,    stack: 's', borderRadius: 0 },
          { label: 'At Risk',    data: c.atRisk,     backgroundColor: '#f59e0b', stack: 's', borderRadius: 0 },
          { label: 'Emergency',  data: c.emergency,  backgroundColor: '#ef4444', stack: 's', borderRadius: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: C.text, font: { size: 9 } } },
          y: { stacked: true, grid: { color: C.grid }, ticks: { color: C.text, font: { size: 9 } } },
        },
      },
      plugins: [glowPlugin],
    });
  });
}

// ─── GRADE 6 HIGH GROWTH CHART ───────────────────────────
function initStratGrade6Growth() {
  stratHBar(
    'strat-grade6-growth',
    ['Skagit Academy', 'Mt Baker Middle', 'District Avg', 'LaVenture Middle'],
    [67, 47, 38, 30],
    [C.mvsdBrt, C.mvsd, '#3b82f6', '#f59e0b']
  );
}

// ─── MIDDLE SCHOOL STAR MATH STACKED BAR ─────────────────
function initStratMSMath() {
  const ctx = document.getElementById('strat-ms-math');
  if (!ctx) return;
  charts['strat-ms-math'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Winter 23–24', 'Winter 24–25', 'Winter 25–26'],
      datasets: [
        { label: 'At/Above Benchmark', data: [39.9, 45.5, 48.0], backgroundColor: C.mvsd,    stack: 's' },
        { label: 'On Watch',           data: [15.2, 17.5, 15.8], backgroundColor: '#3b82f6', stack: 's' },
        { label: 'Intervention',       data: [22.0, 21.5, 19.7], backgroundColor: '#f59e0b', stack: 's' },
        { label: 'Urgent Intervention',data: [22.9, 15.5, 16.5], backgroundColor: '#ef4444', stack: 's' },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: C.text, font: { size: 10 }, boxWidth: 12, padding: 10 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: { label: c => ` ${c.dataset.label}: ${c.raw}%` },
        },
      },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: C.text, font: { size: 11 } } },
        y: {
          stacked: true,
          min: 0, max: 100,
          grid: { color: C.grid },
          ticks: { color: C.text, font: { size: 10 }, callback: v => v + '%' },
        },
      },
    },
    plugins: [glowPlugin],
  });
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
