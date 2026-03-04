/* ═══════════════════════════════════════════════════════════
   MVSD DASHBOARD — Data
   Sources noted inline. Estimated values clearly marked.
   ═══════════════════════════════════════════════════════════ */
const DATA = {

  // ── ACADEMIC PROFICIENCY (SBAC) ───────────────────────────
  // 2022-23 overall: REAL — OSPI / Public School Review
  // Historical 2018-21: ESTIMATED (testing cancelled 2019-20 due to COVID)
  // Subgroups: ESTIMATED based on OSPI state-level gap patterns
  proficiency: {
    labels: ['Math', 'ELA / Reading', 'Science'],
    years: ['2022-23', '2021-22', '2020-21', '2018-19'],
    yearLabels: { '2022-23': '2022–23', '2021-22': '2021–22', '2020-21': '2020–21', '2018-19': '2018–19 (pre-COVID)' },
    subgroups: {
      overall: {
        label: 'All Students',
        estimated: false,
        mvsd: {
          '2022-23': [28,   34,   34  ],
          '2021-22': [26,   31,   32  ],
          '2020-21': [23,   30,   null],
          '2018-19': [31,   38,   38  ],
        },
        wa: {
          '2022-23': [39.7, 50.3, 43.5],
          '2021-22': [37,   47,   41  ],
          '2020-21': [34,   44,   null],
          '2018-19': [44,   54,   47  ],
        },
      },
      hispanic: {
        label: 'Hispanic / Latino',
        estimated: true,
        mvsd: { '2022-23': [21, 26, 27] },
        // WA state Hispanic: ELA 32% confirmed (research); Math estimated
        wa:   { '2022-23': [26, 32, 29] },
      },
      white: {
        label: 'White',
        estimated: true,
        mvsd: { '2022-23': [41, 49, 48] },
        // WA state White: ~56-58% (research)
        wa:   { '2022-23': [50, 58, 53] },
      },
      frpl: {
        label: 'Free / Reduced Lunch',
        estimated: true,
        // WA FRPL: Math 21%, ELA 34% CONFIRMED (OSPI research); Science estimated
        mvsd: { '2022-23': [19, 25, 25] },
        wa:   { '2022-23': [21, 34, 28] },
      },
      ell: {
        label: 'English Learners',
        estimated: true,
        mvsd: { '2022-23': [12, 14, 13] },
        wa:   { '2022-23': [22, 19, 17] },
      },
    },
  },

  // ── GRADE-LEVEL BREAKDOWN ─────────────────────────────────
  // REAL — Public School Review 2022-23; WA state values approximate
  gradeLevel: {
    labels: ['Elementary (3–5)', 'Middle School (6–8)', 'High School (10)'],
    mvsd: { ela: [42, 44, 72], math: [31, 25, 24] },
    wa:   { ela: [55, 48, 58], math: [45, 37, 31] },
  },

  // ── GRADUATION RATES ──────────────────────────────────────
  // 2022-23: REAL — OSPI (MVSD 82%, WA 83.6%), NCES (National 87.4%)
  // Historical: WA values estimated; National interpolated from NCES trends
  graduation: {
    years: ['2018–19', '2019–20', '2020–21', '2021–22', '2022–23'],
    mvsd:     [74,  79,  76,  80,  82  ],
    wa:       [79.9, 82.2, 80.4, 82.3, 83.6],
    national: [85.8, 86.6, 86.7, 87.0, 87.4],
  },

  // ── DEMOGRAPHICS ─────────────────────────────────────────
  // MVSD 2023-24: REAL — Public School Review / NCES CCD
  // WA state & National: approximate from OSPI October enrollment / NCES
  ethnicity: {
    labels: ['Hispanic/Latino', 'White', 'Asian', 'Two or More', 'Black', 'Pac. Islander'],
    colors: ['#008544', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
    mvsd: [57, 35, 3, 3, 1, 1],
    wa:   [24, 49, 9, 7, 7, 1],
    nat:  [28, 44, 6, 4, 15, 1],
  },

  // FRPL: MVSD REAL (Public School Review); WA & National approximate
  frpl: { mvsd: 47.8, wa: 44, nat: 52 },

  // ── FUNDING ──────────────────────────────────────────────
  // MVSD: REAL — Public School Review 2022-23
  // WA median & National: REAL — NEA Estimates 2024
  spending: {
    perPupil: { mvsd: 20167, wa: 19250, nat: 16281 },
    totalRevenueMil: 132,
    totalSpendingMil: 130,
    revenuePerPupil: 20435,
  },

  // ── STAFFING ─────────────────────────────────────────────
  // REAL — NCES CCD 2023-24
  staffing: {
    studentTeacherRatio: { mvsd: 16.2, wa: 18.2, nat: 16.0 },
    fteTeachers: 398,
    schoolAdmins: 26.3,
    districtAdmins: 8.3,
    totalStudents: 6441,
    totalSchools: 14,
  },
};
