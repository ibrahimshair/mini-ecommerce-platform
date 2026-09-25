const config = require("../config");
const { successResponse } = require("../utils/apiResponse");

/**
 * Health Controller
 * Reports system status, memory usage, uptime, and runtime environment.
 */
const getHealth = (req, res, next) => {
  try {
    const memoryUsage = process.memoryUsage();

    const healthData = {
      service: "Mini E-Commerce Backend API",
      status: "UP",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      environment: config.nodeEnv,
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
      message: "System is healthy and operational",
      data: healthData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
};
