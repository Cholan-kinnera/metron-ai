import { CATEGORIES, type Analysis, type Category, type Department, type Priority } from './schema.js';

/** Default routing from issue category to the responsible department. */
export const DEPARTMENT_FOR: Record<Category, Department> = {
  'Roads & Potholes': 'Public Works Department',
  'Garbage & Sanitation': 'Sanitation & Solid Waste Management',
  'Streetlights & Electricity': 'Electricity Board',
  'Water Supply & Leakage': 'Water Supply & Sewerage Board',
  'Drainage & Sewage': 'Water Supply & Sewerage Board',
  'Public Safety': 'Police & Public Safety',
  'Parks & Public Spaces': 'Parks & Horticulture',
  Other: 'Municipal General Administration',
};

const KEYWORDS: Record<Exclude<Category, 'Other'>, string[]> = {
  'Roads & Potholes': [
    'pothole',
    'road',
    'crack',
    'asphalt',
    'speed breaker',
    'footpath',
    'pavement',
    'traffic signal',
  ],
  'Garbage & Sanitation': ['garbage', 'trash', 'waste', 'dustbin', 'bin', 'litter', 'dump', 'stink', 'smell'],
  'Streetlights & Electricity': [
    'streetlight',
    'street light',
    'lamp',
    'electric',
    'wire',
    'power',
    'transformer',
    'dark',
  ],
  'Water Supply & Leakage': ['water', 'leak', 'pipe', 'tap', 'supply', 'burst'],
  'Drainage & Sewage': ['drain', 'sewage', 'sewer', 'manhole', 'flood', 'clog', 'overflow'],
  'Public Safety': ['unsafe', 'danger', 'accident', 'crime', 'harass', 'stray', 'fire', 'collapse'],
  'Parks & Public Spaces': ['park', 'tree', 'playground', 'bench', 'garden', 'public toilet'],
};

const CRITICAL = [
  'live wire',
  'electrocut',
  'fire',
  'collapse',
  'accident',
  'injur',
  'gas leak',
  'open manhole',
  'sparking',
];
const HIGH = [
  'urgent',
  'danger',
  'children',
  'school',
  'hospital',
  'burst',
  'flood',
  'overflow',
  'days',
  'week',
  'disease',
];

/**
 * Deterministic keyword classifier. Used when Gemini is unavailable so the
 * platform keeps triaging complaints instead of failing the citizen's report.
 */
export function classifyByRules(text: string, hint?: Category): Analysis {
  const lower = text.toLowerCase();
  let best: Category = hint ?? 'Other';
  let bestScore = 0;
  for (const category of CATEGORIES) {
    if (category === 'Other') continue;
    const score = KEYWORDS[category].reduce((sum, k) => sum + lower.split(k).length - 1, 0);
    if (score > bestScore) {
      best = category;
      bestScore = score;
    }
  }
  const priority: Priority = CRITICAL.some((k) => lower.includes(k))
    ? 'Critical'
    : HIGH.some((k) => lower.includes(k))
      ? 'High'
      : bestScore > 0
        ? 'Medium'
        : 'Low';
  return {
    category: best,
    priority,
    department: DEPARTMENT_FOR[best],
    summary: text.slice(0, 160),
    reasoning:
      bestScore > 0
        ? `Matched ${bestScore} keyword(s) for ${best}.`
        : 'No strong keyword match; routed by reported category.',
    confidence: Math.min(0.4 + bestScore * 0.15, 0.85),
    source: 'rules',
  };
}
