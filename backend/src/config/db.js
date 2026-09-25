const config = require("./index");

/**
 * Database connection interface
 * (Prepared for PostgreSQL integration in upcoming database milestone)
 */
const dbConfig = {
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  maxConnections: 10,
  idleTimeoutMillis: 30000,
};

const testConnection = async () => {
  // Connection tester placeholder
  return {
    connected: false,
    message: "Database integration will be connected in Milestone 4/5",
    config: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
    },
  };
};

module.exports = {
  dbConfig,
  testConnection,
};
