const config = require("../config");

/**
 * 404 Not Found Middleware
 * Provides standardized JSON response for non-existent routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Resource not found on endpoint: ${req.originalUrl}`,
    statusCode: 404,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Global Error Handler Middleware
 * Normalizes all uncaught server exceptions into structured JSON responses
 */
const errorHandler = (err, req, res, next) => {
  // If response headers have already been sent to client, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    typeof err.statusCode === "number"
      ? err.statusCode
      : typeof err.status === "number"
      ? err.status
      : 500;

  const message = err.message || "Internal Server Error";

  if (config.nodeEnv !== "test") {
    console.error(`[Global Error] ${statusCode} - ${message} (${req.method} ${req.originalUrl})`);
    if (config.nodeEnv === "development" && err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(config.nodeEnv === "development" && { stack: err.stack }),
  });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
