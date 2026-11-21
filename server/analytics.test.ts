import { describe, expect, it } from 'vitest';
import { computeAnalytics, median } from './analytics.js';
import { classifyByRules } from './classifier.js';
import { slaState } from './domain.js';
import { applySafetyFloor } from './gemini.js';
import type { Issue } from './schema.js';

const T0 = Date.parse('2026-01-01T00:00:00Z');
const at = (hours: number) => new Date(T0 + hours * 3_600_000).toISOString();

function issue(overrides: Partial<Issue>): Issue {
  const analysis = classifyByRules('pothole on road');
  return {
    id: 'CR-1',
    title: 't',
    description: 'd',
    location: { address: 'x' },
    category: analysis.category,
    priority: 'Critical',
    department: analysis.department,
    status: 'Reported',
    analysis,
    timeline: [{ status: 'Reported', at: at(0) }],
    createdAt: at(0),
    updatedAt: at(0),
    ...overrides,
  };
}

describe('slaState', () => {
  it('counts down for open issues and flags breaches', () => {
    expect(slaState(issue({}), T0 + 4 * 3_600_000)).toMatchObject({
      hoursLeft: 20,
      breached: false,
      label: 'Due in 20h',
    });
    expect(slaState(issue({}), T0 + 30 * 3_600_000)).toMatchObject({
      breached: true,
      label: 'Overdue by 6h',
    });
  });

  it('judges resolved issues at resolution time', () => {
    const late = issue({
      status: 'Resolved',
      timeline: [
        { status: 'Reported', at: at(0) },
        { status: 'Resolved', at: at(30) },
      ],
    });
    expect(slaState(late, T0 + 999 * 3_600_000).label).toBe('Resolved after SLA');
    const onTime = issue({ status: 'Resolved', timeline: [{ status: 'Resolved', at: at(5) }] });
    expect(slaState(onTime, T0 + 999 * 3_600_000).label).toBe('Resolved within SLA');
  });
});

describe('computeAnalytics', () => {
  it('aggregates KPIs, SLA breaches and department progress', () => {
    const issues = [
      issue({ id: 'a' }),
      issue({ id: 'b', status: 'Resolved', timeline: [{ status: 'Resolved', at: at(4) }] }),
      issue({ id: 'c', priority: 'Low', status: 'In Progress' }),
    ];
    const a = computeAnalytics(issues, T0 + 48 * 3_600_000);
    expect(a).toMatchObject({
      total: 3,
      open: 2,
      criticalOpen: 1,
      overdue: 1,
      resolutionRate: 33,
      medianResolutionHours: 4,
      aiShare: 0,
    });
    expect(a.byDepartment.find((d) => d.department === 'Public Works Department')).toEqual({
      department: 'Public Works Department',
      open: 2,
      resolved: 1,
    });
  });

  it('handles an empty dataset', () => {
    expect(computeAnalytics([], T0)).toMatchObject({
      total: 0,
      resolutionRate: 0,
      medianResolutionHours: null,
    });
  });

  it('computes medians for odd and even lists', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
});

describe('applySafetyFloor', () => {
  it('never lets the model downgrade a detected hazard', () => {
    const rules = classifyByRules('live wire sparking on the road');
    const ai = { ...rules, priority: 'Low' as const, source: 'gemini' as const };
    expect(applySafetyFloor(ai, rules).priority).toBe('Critical');
    expect(applySafetyFloor({ ...ai, priority: 'Critical' }, { ...rules, priority: 'Low' }).priority).toBe(
      'Critical',
    );
    expect(applySafetyFloor({ ...ai, priority: 'Low' }, { ...rules, priority: 'High' }).priority).toBe('Low');
  });
});
