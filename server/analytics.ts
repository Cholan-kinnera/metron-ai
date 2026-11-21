import { DEPARTMENTS, slaState, type Department } from './domain.js';
import type { Issue } from './schema.js';

const HOUR_MS = 3_600_000;

export interface Analytics {
  total: number;
  open: number;
  criticalOpen: number;
  overdue: number;
  resolutionRate: number;
  medianResolutionHours: number | null;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  byDepartment: { department: Department; open: number; resolved: number }[];
  aiShare: number;
}

/** Median of a list, rounded to one decimal; null when empty. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const value = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(value * 10) / 10;
}

/**
 * Aggregates dashboard KPIs: workload, SLA breaches, resolution speed and per-department progress.
 *
 * @param issues - All issues.
 * @param nowMs - Current time in epoch ms (injected for deterministic tests).
 */
export function computeAnalytics(issues: Issue[], nowMs: number = Date.now()): Analytics {
  const countBy = (key: 'status' | 'category' | 'priority') =>
    issues.reduce<Record<string, number>>((acc, i) => {
      acc[i[key]] = (acc[i[key]] ?? 0) + 1;
      return acc;
    }, {});
  const open = issues.filter((i) => i.status !== 'Resolved');
  const resolved = issues.length - open.length;
  const durations = issues.flatMap((i) => {
    const at = i.status === 'Resolved' ? i.timeline.findLast((t) => t.status === 'Resolved')?.at : undefined;
    return at ? [(Date.parse(at) - Date.parse(i.createdAt)) / HOUR_MS] : [];
  });

  return {
    total: issues.length,
    open: open.length,
    criticalOpen: open.filter((i) => i.priority === 'Critical').length,
    overdue: open.filter((i) => slaState(i, nowMs).breached).length,
    resolutionRate: issues.length ? Math.round((resolved / issues.length) * 100) : 0,
    medianResolutionHours: median(durations),
    byStatus: countBy('status'),
    byCategory: countBy('category'),
    byPriority: countBy('priority'),
    byDepartment: DEPARTMENTS.map((department) => {
      const owned = issues.filter((i) => i.department === department);
      const done = owned.filter((i) => i.status === 'Resolved').length;
      return { department, open: owned.length - done, resolved: done };
    }),
    aiShare: issues.length ? Math.round((issues.filter((i) => i.analysis.source === 'gemini').length / issues.length) * 100) : 0,
  };
}
