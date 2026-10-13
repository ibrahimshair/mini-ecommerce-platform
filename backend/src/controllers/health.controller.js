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

const { getSecurityAuditReport } = require("../middleware/security.middleware");

/**
 * Security Health Controller
 * Reports active OWASP security headers, rate limiting, and sanitization configurations.
 */
const getSecurityHealth = (req, res, next) => {
  try {
    const report = getSecurityAuditReport();
    return successResponse(res, {
      statusCode: 200,
      message: "API security hardening policies are active and operational",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resilience Health Controller
 * Reports active resilience policies, retry parameters, and standardized error schemas.
 */
const getResilienceHealth = (req, res, next) => {
  try {
    const resilienceReport = {
      service: "Mini E-Commerce Resilience & Error Handling",
      status: "OPERATIONAL",
      timestamp: new Date().toISOString(),
      errorBoundary: {
        enabled: true,
        fallbackView: "Custom Turkish UI",
        recoveryActions: ["retry", "reload", "home"],
      },
      clientRetryPolicy: {
        defaultRetries: 2,
        baseBackoffMs: 500,
        backoffStrategy: "exponential_with_jitter",
        retryableStatuses: [502, 503, 504],
        clientErrorSafeguard: true,
      },
      networkMonitoring: {
        offlineDetection: true,
        autoReconnectionSync: true,
      },
      standardizedErrorFormat: {
        fields: ["success", "message", "statusCode", "path", "timestamp"],
      },
    };

    return successResponse(res, {
      statusCode: 200,
      message: "Resilience policies and error handling are active and operational",
      data: resilienceReport,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHealth,
  getSecurityHealth,
  getResilienceHealth,
};
