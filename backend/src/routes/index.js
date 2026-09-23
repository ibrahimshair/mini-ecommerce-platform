const express = require("express");
const healthRoutes = require("./health.routes");

const router = express.Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Placeholder for future endpoints (Auth, Products, Cart, Orders)
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mini E-Commerce API Root - Version 1.0",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth (Upcoming in Milestone 3)",
      products: "/api/products (Upcoming in Milestone 4)",
      cart: "/api/cart (Upcoming in Milestone 4)",
      orders: "/api/orders (Upcoming in Milestone 5)",
    },
  });
});

module.exports = router;
