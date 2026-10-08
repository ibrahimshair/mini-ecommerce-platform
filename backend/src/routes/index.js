const express = require("express");
const healthRoutes = require("./health.routes");
const productRoutes = require("./product.routes");
const categoryRoutes = require("./category.routes");
const authRoutes = require("./auth.routes");
const cartRoutes = require("./cart.routes");
const orderRoutes = require("./order.routes");

const router = express.Router();

// Mount Health Check endpoint
router.use("/health", healthRoutes);

// Mount Product & Catalog endpoints
router.use("/products", productRoutes);

// Mount Category endpoints
router.use("/categories", categoryRoutes);

// Mount Authentication endpoints
router.use("/auth", authRoutes);

// Mount Shopping Cart endpoints
router.use("/cart", cartRoutes);

// Mount Orders endpoints
router.use("/orders", orderRoutes);

// API Root summary
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Mini E-Commerce API Root - Version 1.0",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      categories: "/api/categories",
      auth: "/api/auth",
      cart: "/api/cart",
      orders: "/api/orders",
    },
  });
});

module.exports = router;
