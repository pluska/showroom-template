import { drizzle } from 'drizzle-orm/d1';
import { getRequestContext } from '@cloudflare/next-on-pages';
import * as schema from './schema';

export function getDb() {
  const env = getRequestContext().env as any;
  if (!env || !env.DB) {
    throw new Error('Cloudflare D1 environment binding "DB" is not available. Make sure you are running within a Cloudflare Pages context or with `next-on-pages` locally.');
  }
  return drizzle(env.DB, { schema });
}
