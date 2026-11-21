import { z } from 'zod';

import { CATEGORIES, DEPARTMENTS, PRIORITIES, STATUSES, type Category, type Department, type Priority, type Status } from './domain.js';

export * from './domain.js';

/** Image payload limit (decoded bytes). */
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/;

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const locationSchema = z.object({
  address: trimmed(3, 200),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

export const createIssueSchema = z.object({
  title: trimmed(5, 120),
  description: trimmed(10, 2000),
  location: locationSchema,
  category: z.enum(CATEGORIES).optional(),
  image: z
    .string()
    .regex(IMAGE_DATA_URL, 'Image must be a PNG, JPEG or WebP data URL')
    .refine((v) => Math.floor((v.split(',')[1].length * 3) / 4) <= MAX_IMAGE_BYTES, 'Image must be 2 MB or smaller')
    .optional(),
});

export const updateIssueSchema = z
  .object({
    status: z.enum(STATUSES).optional(),
    priority: z.enum(PRIORITIES).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    note: trimmed(1, 500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  q: z.string().trim().max(100).optional(),
});

/** Structured output contract enforced on Gemini responses. */
export const analysisSchema = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  department: z.enum(DEPARTMENTS),
  summary: z.string().max(300),
  reasoning: z.string().max(500),
  confidence: z.number().min(0).max(1),
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
export type Analysis = z.infer<typeof analysisSchema> & { source: 'gemini' | 'rules' };

export interface TimelineEntry {
  status: Status;
  at: string;
  note?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  location: z.infer<typeof locationSchema>;
  reportedCategory?: Category;
  image?: string;
  category: Category;
  priority: Priority;
  department: Department;
  status: Status;
  analysis: Analysis;
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
}
