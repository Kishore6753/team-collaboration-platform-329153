const { pool } = require('./pool');

/**
 * Executes a SQL query with parameters using the shared pg pool.
 * Adds consistent error context for easier debugging.
 *
 * @param {string} text SQL text with $1..$n placeholders
 * @param {any[]} params Parameters array
 * @param {{ op?: string }} ctx Optional context (operation name)
 */
async function query(text, params = [], ctx = {}) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    const op = ctx.op || 'db.query';
    err.message = `[${op}] ${err.message}`;
    throw err;
  }
}

module.exports = { query };
