const { Pool } = require("pg");
const config = require("./index");

/**
 * PostgreSQL Connection Pool Configuration
 */
const dbConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

const pool = new Pool(dbConfig);

// Handle idle client errors
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err.message);
});

/**
 * Executes a parameterized query on the database pool.
 * @param {string} text - SQL Query statement
 * @param {Array} params - Array of parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === "development") {
    // optional query debug logging
  }
  return res;
};

/**
 * Verifies active database connection with a test ping.
 * @returns {Promise<{connected: boolean, message: string, serverTime?: string}>}
 */
const testConnection = async () => {
  try {
    const res = await pool.query("SELECT NOW() as now, current_database() as db_name");
    return {
      connected: true,
      message: "PostgreSQL database connection established successfully",
      database: res.rows[0].db_name,
      serverTime: res.rows[0].now,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      },
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection inactive: ${error.message}`,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      },
    };
  }
};

module.exports = {
  pool,
  query,
  dbConfig,
  testConnection,
};
