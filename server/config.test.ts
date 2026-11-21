import { describe, expect, it } from 'vitest';
import { loadConfig } from './config.js';

describe('loadConfig', () => {
  it('uses safe development defaults', () => {
    expect(loadConfig({})).toMatchObject({
      port: 8080,
      isProduction: false,
      adminKey: 'civic-admin',
      aiEnabled: false,
    });
  });

  it('locks admin in production when the key is missing or weak', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).adminKey).toBe('');
    expect(loadConfig({ NODE_ENV: 'production', ADMIN_KEY: 'short' }).adminKey).toBe('');
    expect(loadConfig({ NODE_ENV: 'production', ADMIN_KEY: 'a-strong-key-123' }).adminKey).toBe(
      'a-strong-key-123',
    );
  });

  it('parses port and data file, rejecting invalid ports', () => {
    expect(loadConfig({ PORT: '3000', DATA_FILE: '/tmp/x.json', GEMINI_API_KEY: 'k' })).toMatchObject({
      port: 3000,
      dataFile: '/tmp/x.json',
      aiEnabled: true,
    });
    expect(loadConfig({ PORT: 'abc' }).port).toBe(8080);
  });
});
