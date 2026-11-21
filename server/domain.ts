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

