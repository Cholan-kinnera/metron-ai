import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Analysis, CreateIssueInput, Issue, ListQuery, UpdateIssueInput } from './schema.js';
import { PRIORITIES } from './schema.js';

const PRIORITY_RANK = Object.fromEntries(PRIORITIES.map((p, i) => [p, i])) as Record<
  Issue['priority'],
  number
>;

/**
 * In-memory issue repository with optional JSON-file persistence.
 * ponytail: single-process store; move to Firestore when running multiple instances.
 */
export class IssueStore {
  private readonly issues = new Map<string, Issue>();
  private saving: Promise<void> = Promise.resolve();

  constructor(private readonly file?: string) {}

  async load(): Promise<void> {
    if (!this.file) return;
    try {
      const rows = JSON.parse(await readFile(this.file, 'utf8')) as Issue[];
      rows.forEach((row) => this.issues.set(row.id, row));
    } catch {
      // First run or unreadable file: start empty.
    }
  }

  /** Serialises writes so concurrent requests never interleave file output. */
  private persist(): Promise<void> {
    if (!this.file) return Promise.resolve();
    const file = this.file;
    const snapshot = JSON.stringify([...this.issues.values()]);
    this.saving = this.saving
      .then(async () => {
        await mkdir(dirname(file), { recursive: true });
        await writeFile(file, snapshot);
      })
      .catch((error: Error) => console.error('[store] persist failed:', error.message));
    return this.saving;
  }

  get size(): number {
    return this.issues.size;
  }

  async create(input: CreateIssueInput, analysis: Analysis): Promise<Issue> {
    const now = new Date().toISOString();
    const issue: Issue = {
      id: `CR-${randomUUID().slice(0, 8).toUpperCase()}`,
      title: input.title,
      description: input.description,
      location: input.location,
      reportedCategory: input.category,
      image: input.image,
      category: analysis.category,
      priority: analysis.priority,
      department: analysis.department,
      status: 'Reported',
      analysis,
      timeline: [{ status: 'Reported', at: now, note: `Routed to ${analysis.department}` }],
      createdAt: now,
      updatedAt: now,
    };
    this.issues.set(issue.id, issue);
    await this.persist();
    return issue;
  }

  get(id: string): Issue | undefined {
    return this.issues.get(id);
  }

  /** Filters, then sorts by priority (most urgent first) and recency. */
  list(query: ListQuery = {}): Issue[] {
    const q = query.q?.toLowerCase();
    return [...this.issues.values()]
      .filter(
        (i) =>
          (!query.status || i.status === query.status) &&
          (!query.category || i.category === query.category) &&
          (!query.priority || i.priority === query.priority) &&
          (!q || `${i.id} ${i.title} ${i.location.address}`.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || b.createdAt.localeCompare(a.createdAt),
      );
  }

  async update(id: string, patch: UpdateIssueInput): Promise<Issue | undefined> {
    const issue = this.issues.get(id);
    if (!issue) return undefined;
    const now = new Date().toISOString();
    const statusChanged = patch.status && patch.status !== issue.status;
    Object.assign(issue, {
      status: patch.status ?? issue.status,
      priority: patch.priority ?? issue.priority,
      department: patch.department ?? issue.department,
      updatedAt: now,
    });
    if (statusChanged || patch.note) issue.timeline.push({ status: issue.status, at: now, note: patch.note });
    await this.persist();
    return issue;
  }

  async remove(id: string): Promise<boolean> {
    const removed = this.issues.delete(id);
    if (removed) await this.persist();
    return removed;
  }

  /** All issues in insertion order. */
  all(): Issue[] {
    return [...this.issues.values()];
  }
}
