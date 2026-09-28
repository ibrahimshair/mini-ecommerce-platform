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
  if (config.nodeEnv === "development" && process.env.DEBUG_SQL === "true") {
    console.log(`[SQL Query] (${duration}ms): ${text.replace(/\s+/g, " ").trim()}`);
  }
  return res;
};

/**
 * Verifies active database connection with a test ping and reports latency & pool status.
 * @returns {Promise<{status: string, connected: boolean, latency: string, message: string}>}
 */
const testConnection = async () => {
  const start = Date.now();
  try {
    const res = await pool.query("SELECT NOW() as now, current_database() as db_name");
    const latency = Date.now() - start;
    return {
      status: "UP",
      connected: true,
      latency: `${latency}ms`,
      message: "PostgreSQL database connection established successfully",
      database: res.rows[0].db_name,
      serverTime: res.rows[0].now,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      },
    };
  } catch (error) {
    const latency = Date.now() - start;
    return {
      status: "DOWN",
      connected: false,
      latency: `${latency}ms`,
      message: `Database connection inactive: ${error.message || "Connection refused"}`,
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
