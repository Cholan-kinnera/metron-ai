import type { Analytics } from '../../server/analytics';
import type { CreateIssueInput, Issue, ListQuery, UpdateIssueInput } from '../../server/schema';

export type IssueSummary = Omit<Issue, 'image'> & { hasImage: boolean };
export type Stats = Analytics;

/** Error carrying the server's validation message for display. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.details
      ?.map((d: { path: string; message: string }) => `${d.path}: ${d.message}`)
      .join('; ');
    throw new ApiError(detail || body.error || 'Request failed', res.status);
  }
  return body as T;
}

const admin = (key: string) => ({ 'x-admin-key': key });

/** Typed client for every Metron AI REST endpoint. */
export const api = {
  health: () => request<{ ok: boolean; ai: 'gemini' | 'rules' }>('/health'),
  stats: () => request<Stats>('/stats'),
  list: (query: ListQuery = {}) => {
    const params = new URLSearchParams(Object.entries(query).filter(([, v]) => v) as [string, string][]);
    return request<IssueSummary[]>(`/issues?${params}`);
  },
  get: (id: string) => request<Issue>(`/issues/${encodeURIComponent(id)}`),
  create: (input: CreateIssueInput) =>
    request<Issue>('/issues', { method: 'POST', body: JSON.stringify(input) }),
  verifyAdmin: (key: string) => request<{ ok: boolean }>('/admin/verify', { headers: admin(key) }),
  update: (id: string, patch: UpdateIssueInput, key: string) =>
    request<Issue>(`/issues/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
      headers: admin(key),
    }),
  remove: (id: string, key: string) =>
    request<void>(`/issues/${encodeURIComponent(id)}`, { method: 'DELETE', headers: admin(key) }),
};

/** Google Maps deep link for a reported location. */
export function mapsUrl(location: Issue['location']): string {
  const query =
    location.lat != null && location.lng != null ? `${location.lat},${location.lng}` : location.address;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Downscales a photo client-side so uploads stay small and fast. */
export async function compressImage(file: File, maxSide = 1280): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.8);
}

/** Human-friendly relative time, e.g. "3 hours ago". */
export const timeAgo = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (mins < 60) return rtf.format(-mins, 'minute');
  if (mins < 1440) return rtf.format(-Math.round(mins / 60), 'hour');
  return rtf.format(-Math.round(mins / 1440), 'day');
};
