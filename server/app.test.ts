import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { IssueStore } from './store.js';

const ADMIN = 'test-admin-key';
const validIssue = {
  title: 'Open manhole on main road',
  description: 'Manhole cover missing near the school gate, children at risk every morning.',
  location: { address: 'Avinashi Road, Coimbatore', lat: 11.02, lng: 77.0 },
};

let store: IssueStore;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  store = new IssueStore();
  app = createApp({ store, adminKey: ADMIN });
});

describe('POST /api/issues', () => {
  it('creates an issue with AI triage, priority and department', async () => {
    const res = await request(app).post('/api/issues').send(validIssue).expect(201);
    expect(res.body.id).toMatch(/^CR-[0-9A-F]{8}$/);
    expect(res.body).toMatchObject({
      status: 'Reported',
      category: 'Drainage & Sewage',
      priority: 'Critical',
      department: 'Water Supply & Sewerage Board',
    });
    expect(res.body.analysis.source).toBe('rules');
    expect(res.body.timeline).toHaveLength(1);
  });

  it('rejects invalid input with field-level errors', async () => {
    const res = await request(app).post('/api/issues').send({ title: 'x', description: '', location: {} }).expect(400);
    expect(res.body.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(['title', 'description', 'location.address']),
    );
  });

  it('rejects non-image data URLs', async () => {
    await request(app)
      .post('/api/issues')
      .send({ ...validIssue, image: 'data:text/html;base64,PHNjcmlwdD4=' })
      .expect(400);
  });

  it('accepts a small PNG photo and hides it from list responses', async () => {
    const image = 'data:image/png;base64,iVBORw0KGgo=';
    const created = await request(app).post('/api/issues').send({ ...validIssue, image }).expect(201);
    const list = await request(app).get('/api/issues').expect(200);
    expect(list.body[0].image).toBeUndefined();
    expect(list.body[0].hasImage).toBe(true);
    const detail = await request(app).get(`/api/issues/${created.body.id}`).expect(200);
    expect(detail.body.image).toBe(image);
  });

  it('rejects malformed JSON bodies', async () => {
    await request(app).post('/api/issues').set('content-type', 'application/json').send('{bad').expect(400);
  });
});

describe('tracking', () => {
  it('lists issues sorted by priority and filters by status and search', async () => {
    await request(app).post('/api/issues').send({ ...validIssue, title: 'Strange noise every evening', description: 'A strange humming noise is heard near the corner every evening.' });
    await request(app).post('/api/issues').send(validIssue);
    const all = await request(app).get('/api/issues').expect(200);
    expect(all.body.map((i: { priority: string }) => i.priority)).toEqual(['Critical', 'Low']);
    const search = await request(app).get('/api/issues').query({ q: 'noise' }).expect(200);
    expect(search.body).toHaveLength(1);
    const resolved = await request(app).get('/api/issues').query({ status: 'Resolved' }).expect(200);
    expect(resolved.body).toHaveLength(0);
    await request(app).get('/api/issues').query({ status: 'Bogus' }).expect(400);
  });

  it('returns 404 for unknown issues and routes', async () => {
    await request(app).get('/api/issues/CR-NOPE').expect(404);
    await request(app).get('/api/unknown').expect(404);
  });

  it('reports aggregate stats', async () => {
    await request(app).post('/api/issues').send(validIssue);
    const res = await request(app).get('/api/stats').expect(200);
    expect(res.body).toMatchObject({ total: 1, byStatus: { Reported: 1 }, byPriority: { Critical: 1 } });
  });
});

describe('admin', () => {
  it('requires the admin key for mutations', async () => {
    const { body } = await request(app).post('/api/issues').send(validIssue);
    await request(app).patch(`/api/issues/${body.id}`).send({ status: 'Resolved' }).expect(401);
    await request(app).patch(`/api/issues/${body.id}`).set('x-admin-key', 'wrong').send({ status: 'Resolved' }).expect(401);
    await request(app).delete(`/api/issues/${body.id}`).expect(401);
    await request(app).get('/api/admin/verify').set('x-admin-key', ADMIN).expect(200);
  });

  it('moves an issue through the workflow and records a timeline', async () => {
    const { body } = await request(app).post('/api/issues').send(validIssue);
    const progress = await request(app)
      .patch(`/api/issues/${body.id}`)
      .set('x-admin-key', ADMIN)
      .send({ status: 'In Progress', note: 'Crew dispatched' })
      .expect(200);
    expect(progress.body.status).toBe('In Progress');
    const done = await request(app)
      .patch(`/api/issues/${body.id}`)
      .set('x-admin-key', ADMIN)
      .send({ status: 'Resolved', department: 'Public Works Department' })
      .expect(200);
    expect(done.body.department).toBe('Public Works Department');
    expect(done.body.timeline.map((t: { status: string }) => t.status)).toEqual(['Reported', 'In Progress', 'Resolved']);
  });

  it('validates admin updates and deletes issues', async () => {
    const { body } = await request(app).post('/api/issues').send(validIssue);
    await request(app).patch(`/api/issues/${body.id}`).set('x-admin-key', ADMIN).send({}).expect(400);
    await request(app).patch(`/api/issues/${body.id}`).set('x-admin-key', ADMIN).send({ status: 'Done' }).expect(400);
    await request(app).patch('/api/issues/CR-NOPE').set('x-admin-key', ADMIN).send({ status: 'Resolved' }).expect(404);
    await request(app).delete(`/api/issues/${body.id}`).set('x-admin-key', ADMIN).expect(204);
    await request(app).delete(`/api/issues/${body.id}`).set('x-admin-key', ADMIN).expect(404);
  });
});

describe('security headers', () => {
  it('sets a CSP and hides the framework', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.body.ai).toBe('rules');
  });
});
