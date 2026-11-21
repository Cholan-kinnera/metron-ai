import { fileURLToPath } from 'node:url';

/** Minimum admin key length accepted in production. */
export const MIN_ADMIN_KEY_LENGTH = 12;
const DEV_ADMIN_KEY = 'civic-admin';

export interface AppConfig {
  port: number;
  isProduction: boolean;
  /** Empty string means admin endpoints are locked (fail closed). */
  adminKey: string;
  dataFile: string;
  aiEnabled: boolean;
}

/**
 * Reads and validates all runtime configuration in one place.
 * Pure function of the environment so it can be unit tested.
 *
 * @param env - Environment variables (defaults to process.env).
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const isProduction = env.NODE_ENV === 'production';
  const port = Number.parseInt(env.PORT ?? '', 10);
  const rawKey = env.ADMIN_KEY ?? (isProduction ? '' : DEV_ADMIN_KEY);
  return {
    port: Number.isInteger(port) && port > 0 ? port : 8080,
    isProduction,
    adminKey: isProduction && rawKey.length < MIN_ADMIN_KEY_LENGTH ? '' : rawKey,
    dataFile: env.DATA_FILE ?? fileURLToPath(new URL('../data/issues.json', import.meta.url)),
    aiEnabled: Boolean(env.GEMINI_API_KEY),
  };
}
