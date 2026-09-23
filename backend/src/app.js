const express = require("express");
const cors = require("cors");
const config = require("./config");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mini E-Commerce API is running",
    environment: config.nodeEnv,
    documentation: "/api",
  });
});

// API Routes
app.use("/api", apiRoutes);

// Fallback 404 & Central Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`[Backend] Server is running on port ${config.port} (${config.nodeEnv})`);
    console.log(`[Backend] API Health endpoint: http://localhost:${config.port}/api/health`);
  });
}

module.exports = app;