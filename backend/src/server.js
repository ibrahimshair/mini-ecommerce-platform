const app = require("./app");
const config = require("./config");

const server = app.listen(config.port, () => {
  console.log(`[Backend] Server is running on port ${config.port} (${config.nodeEnv})`);
  console.log(`[Backend] API Health endpoint: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`[Backend] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("[Backend] HTTP server closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

module.exports = server;
