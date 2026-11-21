/** Domain enums shared by the API, the AI classifier and the client (zod-free so the browser bundle stays small). */
export const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Streetlights & Electricity',
  'Water Supply & Leakage',
  'Drainage & Sewage',
  'Public Safety',
  'Parks & Public Spaces',
  'Other',
] as const;

export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;

export const STATUSES = ['Reported', 'In Progress', 'Resolved'] as const;

export const DEPARTMENTS = [
  'Public Works Department',
  'Sanitation & Solid Waste Management',
  'Electricity Board',
  'Water Supply & Sewerage Board',
  'Police & Public Safety',
  'Parks & Horticulture',
  'Municipal General Administration',
] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type Department = (typeof DEPARTMENTS)[number];


/** Service-level target (hours to resolve) for each priority. */
export const SLA_HOURS: Record<Priority, number> = { Critical: 24, High: 72, Medium: 168, Low: 336 };

const HOUR_MS = 3_600_000;

/**
 * SLA state of an issue. Resolved issues are judged at the moment they were resolved,
 * so a late fix stays recorded as a breach.
 *
 * @param issue - Fields needed to evaluate the SLA.
 * @param nowMs - Current time in epoch ms (injected to keep this pure and testable).
 */
export function slaState(
  issue: { priority: Priority; status: Status; createdAt: string; timeline: { status: Status; at: string }[] },
  nowMs: number,
): { dueAt: string; hoursLeft: number; breached: boolean; label: string } {
  const dueMs = Date.parse(issue.createdAt) + SLA_HOURS[issue.priority] * HOUR_MS;
  const resolvedAt = issue.status === 'Resolved' ? issue.timeline.findLast((t) => t.status === 'Resolved')?.at : undefined;
  const referenceMs = resolvedAt ? Date.parse(resolvedAt) : nowMs;
  const hoursLeft = Math.round((dueMs - referenceMs) / HOUR_MS);
  const breached = referenceMs > dueMs;
  const label = resolvedAt
    ? breached
      ? 'Resolved after SLA'
      : 'Resolved within SLA'
    : breached
      ? `Overdue by ${Math.abs(hoursLeft)}h`
      : `Due in ${hoursLeft}h`;
  return { dueAt: new Date(dueMs).toISOString(), hoursLeft, breached, label };
}
