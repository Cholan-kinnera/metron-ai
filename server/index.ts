import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { seedDemoData } from './seed.js';
import { IssueStore } from './store.js';

const config = loadConfig();
if (!config.adminKey) {
  console.error('[server] ADMIN_KEY missing or too short; admin endpoints are disabled.');
}

const store = new IssueStore(config.dataFile);
await store.load();
await seedDemoData(store);

const clientDir = fileURLToPath(new URL('../dist', import.meta.url));
createApp({ store, adminKey: config.adminKey, clientDir }).listen(config.port, () => {
  console.log(
    `Metron AI listening on http://localhost:${config.port} (AI: ${config.aiEnabled ? 'Gemini' : 'rules fallback'})`,
  );
});
