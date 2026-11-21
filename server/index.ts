import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { seedDemoData } from './seed.js';
import { IssueStore } from './store.js';

const port = Number(process.env.PORT ?? 8080);
const adminKey = process.env.ADMIN_KEY ?? 'civic-admin';
if (!process.env.ADMIN_KEY) console.warn('[server] ADMIN_KEY not set; using demo key "civic-admin".');

const store = new IssueStore(process.env.DATA_FILE ?? fileURLToPath(new URL('../data/issues.json', import.meta.url)));
await store.load();
await seedDemoData(store);

const clientDir = fileURLToPath(new URL('../dist', import.meta.url));
createApp({ store, adminKey, clientDir }).listen(port, () => {
  console.log(`CivicResolve listening on http://localhost:${port} (AI: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'rules fallback'})`);
});
