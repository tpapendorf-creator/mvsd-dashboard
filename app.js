/* ═══════════════════════════════════════════════════════════
   MVSD District Dashboard — Chart.js Initialization
   All data sourced from OSPI, NCES, and Public School Review
   ═══════════════════════════════════════════════════════════ */

// ─── CHART DEFAULTS ──────────────────────────────────────
Chart.defaults.color = '#5a7a62';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
Chart.defaults.font.size = 12;

// ─── COLORS ───────────────────────────────────────────────
const C = {
  mvsd:    '#008544',
  mvsdBrt: '#00b05a',
  wa:      '#3b82f6',
  nat:     '#f59e0b',
  grid:    'rgba(255,255,255,0.06)',
};

// ─── DATA ─────────────────────────────────────────────────
// Sources: OSPI 2022-23 State Report Card, NCES CCD 2023-24,
//          Public School Review 2022-23, NEA Estimates 2024
const DATA = {
  // Smarter Balanced Assessment proficiency (% meeting/exceeding standard)
  proficiency: {
    labels: ['Math', 'ELA / Reading', 'Science'],
    mvsd:  [28, 34, 34],          // OSPI / Public School Review 2022-23
    wa:    [39.7, 50.3, 43.5],    // OSPI official statewide 2022-23
  },

  // 4-year ACGR graduation rates
  graduation: {
    mvsd:     82,    // OSPI 2022-23
    wa:       83.6,  // OSPI 2022-23 (record high)
    national: 87.4,  // NCES 2022-23
  },

  // Racial/ethnic enrollment — MVSD 2023-24
  ethnicity: {
    labels: ['Hispanic / Latino', 'White', 'Asian', 'Two or More Races', 'Black', 'Pacific Islander'],
    values: [57, 35, 3, 3, 1, 1],
    colors: ['#008544', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
  },

  // Per-pupil expenditure (current spending)
  spending: {
    labels: ['MVSD #320', 'WA State Median', 'National Average'],
    values: [20167, 19250, 16281],
    colors: [C.mvsd, C.wa, C.nat],
  },
};

// ─── 1. PROFICIENCY CHART (grouped horizontal bars) ───────
function buildProficiencyChart() {
  const ctx = document.getElementById('proficiencyChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DATA.proficiency.labels,
      datasets: [
        {
          label: 'MVSD #320',
          data: DATA.proficiency.mvsd,
          backgroundColor: C.mvsd,
          borderRadius: 4,
          barPercentage: 0.65,
        },
        {
          label: 'WA State',
          data: DATA.proficiency.wa,
          backgroundColor: C.wa,
          borderRadius: 4,
          barPercentage: 0.65,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'start',
          labels: {
            color: '#b2ccb8',
            font: { size: 11, weight: '600' },
            usePointStyle: true,
            pointStyleWidth: 10,
            padding: 16,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.x}%`,
          },
        },
      },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: C.grid },
          ticks: {
            color: '#5a7a62',
            callback: v => v + '%',
            stepSize: 20,
          },
          border: { color: 'transparent' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#b2ccb8', font: { size: 12, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

// ─── 2. ETHNICITY DONUT ───────────────────────────────────
function buildEthnicityChart() {
  const ctx = document.getElementById('ethnicityChart');
  if (!ctx) return;

  const { labels, values, colors } = DATA.ethnicity;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: '#0e1910',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
          },
        },
      },
    },
  });

  // Build custom legend
  const legendEl = document.getElementById('ethnicityLegend');
  if (!legendEl) return;
  legendEl.innerHTML = labels.map((lbl, i) => `
    <div class="dl-item">
      <span class="dl-swatch" style="background:${colors[i]}"></span>
      <span class="dl-label">${lbl}</span>
      <span class="dl-pct">${values[i]}%</span>
    </div>
  `).join('');
}

// ─── 3. SPENDING CHART (horizontal bars) ─────────────────
function buildSpendingChart() {
  const ctx = document.getElementById('spendingChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: DATA.spending.labels,
      datasets: [{
        data: DATA.spending.values,
        backgroundColor: DATA.spending.colors,
        borderRadius: 5,
        barPercentage: 0.55,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` $${ctx.parsed.x.toLocaleString()} per student`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          grid: { color: C.grid },
          ticks: {
            color: '#5a7a62',
            callback: v => '$' + (v / 1000).toFixed(0) + 'k',
          },
          border: { color: 'transparent' },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#b2ccb8', font: { size: 12, weight: '600' } },
          border: { color: 'transparent' },
        },
      },
    },
  });
}

// ─── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildProficiencyChart();
  buildEthnicityChart();
  buildSpendingChart();
});
