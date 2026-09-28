const express = require("express");
const healthRoutes = require("./health.routes");
const productRoutes = require("./product.routes");

const router = express.Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Mount Product & Catalog endpoints
router.use("/products", productRoutes);

// API Root summary
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mini E-Commerce API Root - Version 1.0",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      categories: "/api/products/categories",
      auth: "/api/auth (Upcoming in Milestone 3)",
      cart: "/api/cart (Upcoming in Milestone 4)",
      orders: "/api/orders (Upcoming in Milestone 5)",
    },
  });
});

module.exports = router;
