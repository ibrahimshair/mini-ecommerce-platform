const config = require("../config");
const { testConnection } = require("../config/db");
const { successResponse } = require("../utils/apiResponse");

/**
 * Health Controller
 * Reports system status, memory usage, uptime, and database connection status.
 */
const getHealth = async (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();
    const dbStatus = await testConnection();

    const healthData = {
      service: "Mini E-Commerce Backend API",
      status: "UP",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: config.nodeEnv,
      database: {
        status: dbStatus.status,
        connected: dbStatus.connected,
        latency: dbStatus.latency,
        database: dbStatus.database || config.db.name,
        message: dbStatus.message,
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        },
      },
    };

    return successResponse(res, {
      statusCode: 200,
      message: dbStatus.connected
        ? "System and database are healthy and operational"
        : "System is operational (Database connection pending / fallback mode)",
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
