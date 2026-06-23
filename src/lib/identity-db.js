import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.AVALIAIDENTITY_DATABASE_URL;

if (!databaseUrl) {
  throw new Error('AVALIAIDENTITY_DATABASE_URL não configurada');
}

export const identitySql = neon(databaseUrl);