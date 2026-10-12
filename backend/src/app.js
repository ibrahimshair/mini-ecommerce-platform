const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const {
  securityHeaders,
  sanitizeInput,
  globalRateLimiter,
} = require("./middleware/security.middleware");

const app = express();

// Disable technology disclosure header
app.disable("x-powered-by");

// 1. Security Headers (OWASP Hardening)
app.use(securityHeaders);

// 2. CORS Policy
app.use(
  cors({
    origin: config.clientUrl || "*",
    credentials: true,
  })
);

// HTTP Request Logger
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

// 3. Body parsers with payload limit defense
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// 4. Input Sanitization (XSS and Prototype Pollution defense)
app.use(sanitizeInput);

// Root welcome endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mini E-Commerce API is running",
    environment: config.nodeEnv,
    documentation: "/api",
  });
});

// 5. API Routes with Global Rate Limiting
app.use("/api", globalRateLimiter, apiRoutes);

// Fallback 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;