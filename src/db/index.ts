import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import * as schema from './schema';

// Pool (WS) driver: supports transactions, unlike neon-http. createKid/updateKid
// both rely on db.transaction for atomic guardian+kid inserts.
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle({ client: pool, schema });
