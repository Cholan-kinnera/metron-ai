import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeAnalytics } from './analytics.js';
import { classifyByRules } from './classifier.js';
import { seedDemoData } from './seed.js';
import { IssueStore } from './store.js';

describe('IssueStore persistence', () => {
  it('persists to disk and reloads', async () => {
    const file = join(await mkdtemp(join(tmpdir(), 'civic-')), 'issues.json');
    const store = new IssueStore(file);
    await seedDemoData(store);
    expect(store.size).toBe(5);
    expect(JSON.parse(await readFile(file, 'utf8'))).toHaveLength(5);

    const reloaded = new IssueStore(file);
    await reloaded.load();
    expect(computeAnalytics(reloaded.all()).byStatus).toEqual({ Reported: 2, 'In Progress': 2, Resolved: 1 });
    await seedDemoData(reloaded);
    expect(reloaded.size).toBe(5);
  });

  it('does not add a timeline entry when nothing changes status', async () => {
    const store = new IssueStore();
    const issue = await store.create({ title: 'Test', description: 'Test issue', location: { address: 'Here' } }, classifyByRules('test'));
    await store.update(issue.id, { priority: 'High' });
    expect(store.get(issue.id)?.timeline).toHaveLength(1);
    expect(store.get(issue.id)?.priority).toBe('High');
  });
});
