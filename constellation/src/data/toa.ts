// Theory of Action — four concentric rings from learner outward

export interface ToaLayer {
  key: string;
  label: string;
  shortLabel: string;
  radius: number;
  color: string;
  opacity: number;
  when: string;
}

export const TOA_LAYERS: ToaLayer[] = [
  {
    key: 'learner',
    label: 'Learner',
    shortLabel: 'Learner',
    radius: 75,
    color: '#008544',
    opacity: 0.18,
    when: 'Students develop academic identity, belonging, and mastery — I Belong · I Dream · I Achieve',
  },
  {
    key: 'educator',
    label: 'Educators',
    shortLabel: 'Educators',
    radius: 130,
    color: '#06b6d4',
    opacity: 0.13,
    when: 'Then educators implement culturally responsive, evidence-based instructional practices aligned to student identity and grade-level standards.',
  },
  {
    key: 'school',
    label: 'School Leaders',
    shortLabel: 'School Leaders',
    radius: 185,
    color: '#3b82f6',
    opacity: 0.10,
    when: 'Then school leaders create the conditions — coaching, scheduling, data use — for educators to deliver high-quality instruction every day.',
  },
  {
    key: 'district',
    label: 'District Leaders',
    shortLabel: 'District',
    radius: 240,
    color: '#7c3aed',
    opacity: 0.08,
    when: 'When district leaders model culturally relevant leadership, provide aligned resources, and hold the system accountable to equitable outcomes for every student.',
  },
];

export const MISSION =
  'Somos Mount Vernon! Together we empower each other to Belong, Dream and Achieve.';

export const STUDENT_IDENTITY = ['I Belong', 'I Dream', 'I Achieve'];
