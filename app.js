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

  rows.push(['MVSD #320 — District Performance Dashboard']);
  rows.push(['Generated', new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })]);
  rows.push([]);

  rows.push(['KEY METRICS']);
  rows.push(['Metric', 'MVSD #320', 'WA State', 'National']);
  rows.push(['Student Enrollment (2023–24)', D.staffing.totalStudents, '', '']);
  rows.push(['Number of Schools', D.staffing.totalSchools, '', '']);
  rows.push(['FTE Teachers (2023–24)', D.staffing.fteTeachers, '', '']);
  rows.push(['Student–Teacher Ratio', D.staffing.studentTeacherRatio.mvsd + ':1', D.staffing.studentTeacherRatio.wa + ':1', D.staffing.studentTeacherRatio.nat + ':1']);
  rows.push(['Per-Pupil Spending (2022–23)', '$' + D.spending.perPupil.mvsd.toLocaleString(), '$' + D.spending.perPupil.wa.toLocaleString(), '$' + D.spending.perPupil.nat.toLocaleString()]);
  rows.push(['FRPL Eligibility', D.frpl.mvsd + '%', '~' + D.frpl.wa + '%', '~' + D.frpl.nat + '%']);
  rows.push([]);

  rows.push(['ACADEMIC PROFICIENCY — SBAC (% Meeting or Exceeding Standard)']);
  rows.push(['Subgroup', 'Year', 'MVSD Math %', 'MVSD ELA %', 'MVSD Science %', 'WA Math %', 'WA ELA %', 'WA Science %', 'Values Estimated?']);
  for (const [, sg] of Object.entries(D.proficiency.subgroups)) {
    for (const yr of D.proficiency.years) {
      if (!sg.mvsd[yr]) continue;
      const mv = sg.mvsd[yr];
      const wa = sg.wa[yr] || [];
      rows.push([sg.label, yr, mv[0], mv[1], mv[2] ?? 'N/A', wa[0] ?? '', wa[1] ?? '', wa[2] ?? '', sg.estimated ? 'Yes' : 'No']);
    }
  }
  rows.push([]);

  rows.push(['GRADE-LEVEL PROFICIENCY — 2022–23']);
  rows.push(['Level', 'MVSD ELA %', 'MVSD Math %', 'WA ELA % (approx)', 'WA Math % (approx)']);
  D.gradeLevel.labels.forEach((lbl, i) => {
    rows.push([lbl, D.gradeLevel.mvsd.ela[i], D.gradeLevel.mvsd.math[i], D.gradeLevel.wa.ela[i], D.gradeLevel.wa.math[i]]);
  });
  rows.push([]);

  rows.push(['GRADUATION RATES — 4-Year ACGR']);
  rows.push(['Year', 'MVSD %', 'WA State %', 'National %']);
  D.graduation.years.forEach((yr, i) => {
    rows.push([yr, D.graduation.mvsd[i], D.graduation.wa[i], D.graduation.national[i]]);
  });
  rows.push([]);

  rows.push(['DEMOGRAPHICS — Racial & Ethnic Enrollment']);
  rows.push(['Group', 'MVSD %', 'WA State %', 'National %']);
  D.ethnicity.labels.forEach((lbl, i) => {
    rows.push([lbl, D.ethnicity.mvsd[i], D.ethnicity.wa[i], D.ethnicity.nat[i]]);
  });
  rows.push([]);

  rows.push(['DATA SOURCES']);
  rows.push(['WA State Report Card (OSPI)', 'https://washingtonstatereportcard.ospi.k12.wa.us/']);
  rows.push(['NCES Common Core of Data',    'https://nces.ed.gov/ccd/']);
  rows.push(['Public School Review',         'https://www.publicschoolreview.com/']);
  rows.push(['NEA Rankings & Estimates 2024','https://www.nea.org/resource-library/rankings-estimates-state-state-education-data']);
  rows.push(['NCES Fast Facts: Graduation',  'https://nces.ed.gov/fastfacts/display.asp?id=805']);

  const csv = rows.map(row =>
    row.map(cell => {
      const s = String(cell ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s;
    }).join(',')
  ).join('\n');

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
