const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  const memoryUsage = process.memoryUsage();

  res.status(200).json({
    status: "UP",
    success: true,
    service: "Mini E-Commerce Backend API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: process.env.NODE_ENV || "development",
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      },
    },
  });
});

module.exports = router;
