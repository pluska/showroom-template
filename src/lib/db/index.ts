import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as schema from './schema';

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  if (!env || !(env as any).DB) {
    throw new Error('Cloudflare D1 environment binding "DB" is not available. Make sure you are running within a Cloudflare Workers context.');
  }
  return drizzle((env as any).DB, { schema });
}
