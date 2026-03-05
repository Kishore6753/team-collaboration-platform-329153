const { Pool } = require('pg');

/**
 * Create a configured pg Pool using environment variables.
 *
 * Expected environment variables (provided via container .env):
 * - POSTGRES_URL
 * - POSTGRES_USER
 * - POSTGRES_PASSWORD
 * - POSTGRES_DB
 * - POSTGRES_PORT
 *
 * Note: do not hardcode credentials; deployment will provide the real values.
 */
function createPoolFromEnv() {
  const url = process.env.POSTGRES_URL;
  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const database = process.env.POSTGRES_DB;
  const port = process.env.POSTGRES_PORT ? Number(process.env.POSTGRES_PORT) : undefined;

  if (!url && (!user || !password || !database || !port)) {
    throw new Error(
      'Database configuration missing. Provide POSTGRES_URL or POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB/POSTGRES_PORT.'
    );
  }

  // If a full URL is provided, prefer it (allows managed providers / SSL settings).
  if (url) {
    return new Pool({ connectionString: url });
  }

  return new Pool({
    host: 'localhost',
    user,
    password,
    database,
    port,
  });
}

const pool = createPoolFromEnv();

module.exports = { pool, createPoolFromEnv };
