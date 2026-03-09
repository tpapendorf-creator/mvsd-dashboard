// ─── Types ────────────────────────────────────────────────────────────────────

export type GoalAreaKey = 'belonging' | 'foundations' | 'mastery' | 'future';

export interface BarChart {
  type: 'bar';
  title: string;
  labels: string[];
  values: number[];
  colors?: string[];
  target?: number;
  targetLabel?: string;
  unit?: string;
  horizontal?: boolean;
}

export interface StackedBarChart {
  type: 'stacked-bar';
  title: string;
  labels: string[];
  datasets: { label: string; values: number[]; color: string }[];
  unit?: string;
}

export interface TimelineChart {
  type: 'timeline';
  title: string;
  labels: string[];
  datasets: { label: string; values: (number | null)[]; color: string; dashed?: boolean }[];
  unit?: string;
}

export type ChartDef = BarChart | StackedBarChart | TimelineChart;

export interface Practice {
  level: 'educator' | 'school' | 'system';
  text: string;
}

export interface Goal {
  id: string;
  title: string;
  shortTitle: string;
  areaKey: GoalAreaKey;
  areaLabel: string;
  areaColor: string;
  nodeColor: string;
  emoji: string;
  description: string;
  // SVG position in 1000×680 viewBox, center at (500,340)
  cx: number;
  cy: number;
  // Primary progress metric
  currentPct: number;
  targetPct: number;
  currentLabel: string;
  targetLabel: string;
  progressUnit: string;
  // Optional baseline
  baselinePct?: number;
  baselineLabel?: string;
  // Callout stat
  callout?: { value: string; label: string };
  charts: ChartDef[];
  practices: Practice[];
}

// ─── Colour palette ───────────────────────────────────────────────────────────

export const AREA_COLOR: Record<GoalAreaKey, string> = {
  belonging:   '#7c3aed', // violet
  foundations: '#008544', // MVSD green
  mastery:     '#2563eb', // blue
  future:      '#d97706', // amber
};

// ─── Connection edges between nodes (by goal index) ──────────────────────────

export const EDGES: [number, number][] = [
  [0, 1], // Attendance ↔ IRLA (belonging drives literacy)
  [0, 6], // Attendance ↔ Graduation (belonging → future)
  [1, 2], // IRLA ↔ Grade 6 (literacy continuum)
  [2, 3], // Grade 6 ↔ MS Math (grade-level mastery)
  [3, 4], // MS Math ↔ 9th Grade (math pathway)
  [4, 5], // 9th Grade ↔ Biliteracy (high-school success)
  [5, 6], // Biliteracy ↔ Graduation (future ready)
  [6, 0], // Graduation ↔ Attendance (cycle)
  [1, 4], // IRLA ↔ 9th Grade (literacy → HS)
  [3, 6], // MS Math ↔ Graduation (math → future)
];

// ─── Goal data ────────────────────────────────────────────────────────────────
// Node positions: radius 270 from center (500,340), evenly spaced 360/7° steps,
// starting at –90° (top), clockwise.
// Positions (rounded): 0:(500,70) 1:(711,172) 2:(763,400) 3:(617,583)
//                       4:(383,583) 5:(237,400) 6:(289,172)

export const goals: Goal[] = [
  // ── 0 ── Community of Belonging — Attendance ──────────────────────────────
  {
    id: 'attendance',
    title: 'Attendance & Community of Belonging',
    shortTitle: 'Attendance',
    areaKey: 'belonging',
    areaLabel: 'Community of Belonging',
    areaColor: '#7c3aed',
    nodeColor: '#7c3aed',
    emoji: '🏫',
    description:
      'Every student belongs at MVSD. Chronic absenteeism erodes learning and belonging. We are working to ensure that 90% of students meet our attendance targets — with focused support for our most-vulnerable populations.',
    cx: 500, cy: 70,
    currentPct: 65, targetPct: 90,
    currentLabel: 'Jan 2026',
    targetLabel: '2031 Goal',
    progressUnit: '% meeting attendance target',
    callout: { value: '6,441', label: 'students enrolled' },
    charts: [
      {
        type: 'bar',
        title: 'Attendance by Student Group',
        labels: ['All Students', 'TBIP', 'Students w/ Disabilities', 'Hispanic / Latino'],
        values: [65, 64, 62, 56],
        colors: ['#7c3aed', '#7c3aed', '#7c3aed', '#7c3aed'],
        target: 90,
        targetLabel: '90% Goal',
        unit: '%',
        horizontal: true,
      },
      {
        type: 'bar',
        title: 'Attendance by Program',
        labels: ['Gifted', 'Bilingual', 'Special Ed', 'Free/Reduced Lunch', 'Homeless'],
        values: [77, 64, 62, 61, 53],
        colors: ['#008544', '#7c3aed', '#2563eb', '#d97706', '#ef4444'],
        target: 90,
        targetLabel: '90% Goal',
        unit: '%',
        horizontal: true,
      },
    ],
    practices: [
      { level: 'system',   text: 'District-wide MTSS framework with tiered attendance intervention protocols' },
      { level: 'school',   text: 'Daily attendance monitoring with same-day outreach for unexcused absences' },
      { level: 'educator', text: 'Culturally welcoming classroom environments where every student is known by name' },
      { level: 'educator', text: 'Home-connection practices that honor family language and culture' },
    ],
  },

  // ── 1 ── Strong Foundations — IRLA Literacy ───────────────────────────────
  {
    id: 'irla',
    title: 'IRLA Early Literacy (TTK–5)',
    shortTitle: 'IRLA Literacy',
    areaKey: 'foundations',
    areaLabel: 'Strong Foundations TTK–5',
    areaColor: '#008544',
    nodeColor: '#00a855',
    emoji: '📚',
    description:
      'The Independent Reading Level Assessment (IRLA) anchors our K–5 literacy strategy. Since our Oct 2023 baseline we have more than doubled the percentage of students reading at or above grade level — a transformational gain on the path to 90% by 2031.',
    cx: 711, cy: 172,
    currentPct: 52.4, targetPct: 90,
    currentLabel: 'Jan 2026',
    targetLabel: '2031 Goal',
    progressUnit: '% at/above grade level (IRLA)',
    baselinePct: 24.7,
    baselineLabel: 'Oct 2023 Baseline',
    callout: { value: '+27.7 pts', label: 'gain since baseline' },
    charts: [
      {
        type: 'timeline',
        title: 'IRLA Proficiency Trend',
        labels: ['Oct 2023\n(Baseline)', 'Jan 2026\n(Current)', '2031\n(Target)'],
        datasets: [
          { label: 'MVSD', values: [24.7, 52.4, 90], color: '#008544' },
        ],
        unit: '%',
      },
      {
        type: 'bar',
        title: 'IRLA by Student Group (Jan 2026)',
        labels: ['All Students', 'Hispanic / Latino', 'TBIP', 'Students w/ Disabilities'],
        values: [52.4, 44, 34, 31],
        colors: ['#008544', '#008544', '#008544', '#008544'],
        target: 90,
        targetLabel: '90% Goal',
        unit: '%',
        horizontal: true,
      },
      {
        type: 'stacked-bar',
        title: 'Cohort 2033 — Student Progression',
        labels: ['3rd Gr\n23/24', '4th Gr\n24/25', '5th Gr\n25/26'],
        datasets: [
          { label: 'Proficient', values: [145, 164, 191], color: '#008544' },
          { label: 'At Risk',    values: [38,  63,  64 ], color: '#f59e0b' },
          { label: 'Emergency',  values: [158, 140, 112], color: '#ef4444' },
        ],
      },
      {
        type: 'stacked-bar',
        title: 'Cohort 2034 — Student Progression',
        labels: ['2nd Gr\n23/24', '3rd Gr\n24/25', '4th Gr\n25/26'],
        datasets: [
          { label: 'Proficient', values: [91,  198, 230], color: '#008544' },
          { label: 'At Risk',    values: [133, 55,  73 ], color: '#f59e0b' },
          { label: 'Emergency',  values: [135, 136, 86 ], color: '#ef4444' },
        ],
      },
      {
        type: 'stacked-bar',
        title: 'Cohort 2035 — Student Progression',
        labels: ['1st Gr\n23/24', '2nd Gr\n24/25', '3rd Gr\n25/26'],
        datasets: [
          { label: 'Proficient', values: [171, 149, 228], color: '#008544' },
          { label: 'At Risk',    values: [39,  104, 35 ], color: '#f59e0b' },
          { label: 'Emergency',  values: [127, 123, 113], color: '#ef4444' },
        ],
      },
    ],
    practices: [
      { level: 'system',   text: 'Districtwide IRLA implementation with aligned materials and coaching infrastructure' },
      { level: 'system',   text: 'IRLA data reviewed at every instructional leadership meeting' },
      { level: 'school',   text: 'School-based literacy coaches provide weekly classroom-embedded support' },
      { level: 'educator', text: 'Daily small-group reading instruction differentiated by IRLA level' },
      { level: 'educator', text: 'Independent reading conferences to advance individual reading identities' },
    ],
  },

  // ── 2 ── Strong Foundations — Grade 6 High Growth ─────────────────────────
  {
    id: 'grade6',
    title: 'Grade 6 High-Growth Literacy',
    shortTitle: 'Grade 6 Literacy',
    areaKey: 'foundations',
    areaLabel: 'Strong Foundations TTK–5',
    areaColor: '#008544',
    nodeColor: '#06b6d4',
    emoji: '📈',
    description:
      'In middle school, accelerating literacy growth is the bridge between elementary foundations and grade-level mastery. We track the percentage of 6th graders demonstrating high growth on reading assessments — a leading indicator of long-term academic success.',
    cx: 763, cy: 400,
    currentPct: 38, targetPct: 60,
    currentLabel: 'District Avg',
    targetLabel: 'Growth Goal',
    progressUnit: '% showing high growth (Grade 6)',
    callout: { value: '67%', label: 'Skagit Academy (highest)' },
    charts: [
      {
        type: 'bar',
        title: 'Grade 6 High-Growth Literacy by School',
        labels: ['Skagit\nAcademy', 'Mt Baker\nMiddle', 'District\nAverage', 'LaVenture\nMiddle'],
        values: [67, 47, 38, 30],
        colors: ['#008544', '#06b6d4', '#f59e0b', '#ef4444'],
        unit: '%',
        horizontal: false,
      },
    ],
    practices: [
      { level: 'system',   text: 'Aligned literacy scope and sequence bridging elementary IRLA into middle school' },
      { level: 'school',   text: 'School-level data teams analyze growth trajectories each quarter' },
      { level: 'educator', text: 'Text complexity scaffolding to accelerate below-grade readers toward grade level' },
      { level: 'educator', text: 'Writing-to-learn strategies embedded across content areas' },
    ],
  },

  // ── 3 ── Grade Level Mastery — MS Math ────────────────────────────────────
  {
    id: 'msmath',
    title: 'Middle School Math Benchmarks',
    shortTitle: 'MS Math',
    areaKey: 'mastery',
    areaLabel: 'Grade Level Mastery',
    areaColor: '#2563eb',
    nodeColor: '#3b82f6',
    emoji: '🔢',
    description:
      'STAR Math benchmark data tracks our middle school students across four performance tiers each trimester. Since fall 2023 we have steadily grown the percentage at or above benchmark — now at 48% — while shrinking our urgent intervention tier.',
    cx: 617, cy: 583,
    currentPct: 48.0, targetPct: 70,
    currentLabel: 'Spring 2026',
    targetLabel: '2031 Goal',
    progressUnit: '% at/above benchmark (STAR Math)',
    callout: { value: '48%', label: 'at/above benchmark (up from 40%)' },
    charts: [
      {
        type: 'stacked-bar',
        title: 'MS STAR Math Benchmarks — All Students',
        labels: ['Fall 2023', 'Winter 2024', 'Spring 2024'],
        datasets: [
          { label: 'At/Above Benchmark',   values: [39.9, 45.5, 48.0], color: '#008544' },
          { label: 'On Watch',             values: [15.2, 17.5, 15.8], color: '#3b82f6' },
          { label: 'Intervention',         values: [22.0, 21.5, 19.7], color: '#f59e0b' },
          { label: 'Urgent Intervention',  values: [22.9, 15.5, 16.5], color: '#ef4444' },
        ],
        unit: '%',
      },
    ],
    practices: [
      { level: 'system',   text: 'Math Pilot program with new curriculum under evaluation across middle schools' },
      { level: 'system',   text: 'STAR Math benchmark data drives placement and MTSS tier assignments' },
      { level: 'school',   text: 'Intervention blocks embedded in the schedule for Tiers 2 and 3 students' },
      { level: 'educator', text: 'Flexible grouping rotated quarterly based on STAR data' },
      { level: 'educator', text: 'High-leverage instructional routines that prioritize conceptual understanding' },
    ],
  },

  // ── 4 ── Grade Level Mastery — 9th Grade On Track ─────────────────────────
  {
    id: 'ninth',
    title: '9th Grade On Track to Graduate',
    shortTitle: '9th Grade',
    areaKey: 'mastery',
    areaLabel: 'Grade Level Mastery',
    areaColor: '#2563eb',
    nodeColor: '#8b5cf6',
    emoji: '🎯',
    description:
      '9th grade is the most pivotal year in a student's academic trajectory. Students who are on track — earning credits and passing core classes — are dramatically more likely to graduate. MVSD is at 79.9% overall, with a clear imperative to close gaps for our highest-need students.',
    cx: 383, cy: 583,
    currentPct: 79.9, targetPct: 90,
    currentLabel: 'Jan 2026',
    targetLabel: '2031 Goal',
    progressUnit: '% on track to graduate (9th Grade)',
    callout: { value: '79.9%', label: 'all 9th graders on track' },
    charts: [
      {
        type: 'bar',
        title: '9th Grade On Track by Student Group',
        labels: ['All Students', 'Hispanic / Latino', 'Students w/ Disabilities', 'TBIP'],
        values: [79.9, 79.5, 78.7, 75.0],
        colors: ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#8b5cf6'],
        target: 90,
        targetLabel: '90% Goal',
        unit: '%',
        horizontal: true,
      },
    ],
    practices: [
      { level: 'system',   text: 'Early-alert system flags students at risk by week 4 of the semester' },
      { level: 'system',   text: 'Credit-recovery pathways available through evening and online options' },
      { level: 'school',   text: 'Freshman Focus advisory programs with dedicated counselor check-ins' },
      { level: 'educator', text: 'Strong teacher-student relationships — every student connected to a caring adult' },
    ],
  },

  // ── 5 ── Navigating for the Future — Seal of Biliteracy ──────────────────
  {
    id: 'biliteracy',
    title: 'Seal of Biliteracy',
    shortTitle: 'Biliteracy',
    areaKey: 'future',
    areaLabel: 'Navigating for the Future',
    areaColor: '#d97706',
    nodeColor: '#f59e0b',
    emoji: '🌎',
    description:
      'With 57% of MVSD students identifying as Hispanic/Latino and a robust bilingual program, the Seal of Biliteracy is a powerful symbol of achievement and identity. We are expanding pathways so that more graduates can certify biliteracy — and carry that asset into college and careers.',
    cx: 237, cy: 400,
    currentPct: 18, targetPct: 35,
    currentLabel: 'Class of 2024',
    targetLabel: '2031 Goal',
    progressUnit: '% of graduates earning Seal of Biliteracy',
    callout: { value: '57%', label: 'of MVSD students are Hispanic / Latino' },
    charts: [
      {
        type: 'bar',
        title: 'Seal of Biliteracy — Graduates Earning Seal',
        labels: ['2021–22', '2022–23', '2023–24', '2031 Goal'],
        values: [12, 15, 18, 35],
        colors: ['#d97706', '#d97706', '#f59e0b', 'rgba(245,158,11,0.3)'],
        unit: '%',
        horizontal: false,
      },
    ],
    practices: [
      { level: 'system',   text: 'Dual-language program pathways from elementary through high school' },
      { level: 'system',   text: 'World Language course access expanded to meet Seal eligibility requirements' },
      { level: 'school',   text: 'Senior-year Seal preparation cohorts with dedicated coaching and testing support' },
      { level: 'educator', text: 'Affirming bilingual student identities as academic and cultural strengths' },
    ],
  },

  // ── 6 ── Navigating for the Future — Graduation Rate ─────────────────────
  {
    id: 'graduation',
    title: 'Graduation Rate',
    shortTitle: 'Graduation',
    areaKey: 'future',
    areaLabel: 'Navigating for the Future',
    areaColor: '#d97706',
    nodeColor: '#fb923c',
    emoji: '🎓',
    description:
      'Graduation is the culmination of our collective work. MVSD's four-year graduation rate has climbed from 74% in 2018–19 to 82% in 2022–23. Closing the remaining gap to our 90% goal means ensuring every student — regardless of background — crosses that stage.',
    cx: 289, cy: 172,
    currentPct: 82, targetPct: 90,
    currentLabel: '2022–23',
    targetLabel: '2031 Goal',
    progressUnit: '% 4-year graduation rate',
    callout: { value: '+8 pts', label: 'since 2018–19 (74% → 82%)' },
    charts: [
      {
        type: 'timeline',
        title: 'Graduation Rate Trend',
        labels: ['2018–19', '2019–20', '2020–21', '2021–22', '2022–23'],
        datasets: [
          { label: 'MVSD',     values: [74,   79,   76,   80,   82  ], color: '#008544' },
          { label: 'WA State', values: [79.9, 82.2, 80.4, 82.3, 83.6], color: '#3b82f6', dashed: true },
          { label: 'National', values: [85.8, 86.6, 86.7, 87.0, 87.4], color: '#7c3aed', dashed: true },
        ],
        unit: '%',
      },
    ],
    practices: [
      { level: 'system',   text: 'Districtwide graduation plan tracking for all students beginning in 8th grade' },
      { level: 'system',   text: 'Dropout prevention partnerships with community organizations' },
      { level: 'school',   text: 'Counselor caseload structured to prioritize students most at risk of not graduating' },
      { level: 'educator', text: 'Relationship-centered teaching that keeps students connected to school through adversity' },
    ],
  },
];
