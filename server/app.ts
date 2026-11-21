import { timingSafeEqual } from 'node:crypto';
import { existsSync } from 'node:fs';
import compression from 'compression';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ZodError } from 'zod';
import { computeAnalytics } from './analytics.js';
import { analyzeIssue } from './gemini.js';
import { createIssueSchema, listQuerySchema, updateIssueSchema, type Issue } from './schema.js';
import type { IssueStore } from './store.js';

interface AppOptions {
  store: IssueStore;
  adminKey: string;
  clientDir?: string;
}

/** Constant-time comparison so the admin key cannot be guessed via timing. */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Public view omits the raw photo from list responses to keep payloads small. */
const summary = ({ image, ...rest }: Issue) => ({ ...rest, hasImage: Boolean(image) });

export function createApp({ store, adminKey, clientDir }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'data:', 'blob:'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'frame-src': ['https://www.google.com', 'https://maps.google.com'],
        },
      },
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '3mb' }));

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const key = req.get('x-admin-key') ?? '';
    if (!adminKey || !safeEqual(key, adminKey)) return void res.status(401).json({ error: 'Admin key required' });
    next();
  };

  const api = express.Router();
  api.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false }));
  const submitLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false });

  api.get('/health', (_req, res) => {
    res.json({ ok: true, ai: process.env.GEMINI_API_KEY ? 'gemini' : 'rules' });
  });

  api.post('/issues', submitLimit, async (req, res) => {
    const input = createIssueSchema.parse(req.body);
    const analysis = await analyzeIssue({ ...input, address: input.location.address });
    res.status(201).json(await store.create(input, analysis));
  });

  api.get('/issues', (req, res) => {
    res.json(store.list(listQuerySchema.parse(req.query)).map(summary));
  });

  api.get('/issues/:id', (req, res) => {
    const issue = store.get(String(req.params.id));
    if (!issue) return void res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  });

  api.get('/stats', (_req, res) => {
    res.json(computeAnalytics(store.all()));
  });

  api.get('/admin/verify', requireAdmin, (_req, res) => {
    res.json({ ok: true });
  });

  api.patch('/issues/:id', requireAdmin, async (req, res) => {
    const issue = await store.update(String(req.params.id), updateIssueSchema.parse(req.body));
    if (!issue) return void res.status(404).json({ error: 'Issue not found' });
    res.json(issue);
  });

  api.delete('/issues/:id', requireAdmin, async (req, res) => {
    if (!(await store.remove(String(req.params.id)))) return void res.status(404).json({ error: 'Issue not found' });
    res.status(204).end();
  });

  api.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use('/api', api);

  if (clientDir && existsSync(clientDir)) {
    app.use(express.static(clientDir, { maxAge: '1y', immutable: true, index: false }));
    app.get('/{*splat}', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile('index.html', { root: clientDir });
    });
  }

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      return void res.status(400).json({ error: 'Validation failed', details: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) });
    }
    if (error instanceof SyntaxError || (error as { type?: string }).type === 'entity.too.large') {
      return void res.status(400).json({ error: 'Invalid or oversized request body' });
    }
    console.error('[server]', error);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
