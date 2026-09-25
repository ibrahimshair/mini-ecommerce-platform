const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
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

// HTTP Request Logger
if (config.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

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

module.exports = app;