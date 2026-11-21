import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { seedDemoData } from './seed.js';
import { IssueStore } from './store.js';

const port = Number(process.env.PORT ?? 8080);
const isProduction = process.env.NODE_ENV === 'production';
let adminKey = process.env.ADMIN_KEY ?? (isProduction ? '' : 'civic-admin');
if (isProduction && adminKey.length < 12) {
  // Fail closed: keep the public site up but lock every admin endpoint.
  console.error('[server] ADMIN_KEY missing or shorter than 12 characters; admin endpoints are disabled.');
  adminKey = '';
}

const store = new IssueStore(process.env.DATA_FILE ?? fileURLToPath(new URL('../data/issues.json', import.meta.url)));
await store.load();
await seedDemoData(store);

const clientDir = fileURLToPath(new URL('../dist', import.meta.url));
createApp({ store, adminKey, clientDir }).listen(port, () => {
  console.log(`Metron AI listening on http://localhost:${port} (AI: ${process.env.GEMINI_API_KEY ? 'Gemini' : 'rules fallback'})`);
});
