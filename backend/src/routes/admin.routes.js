const express = require("express");
const OrderController = require("../controllers/order.controller");
const ProductController = require("../controllers/product.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { validateCreateProduct, validateUpdateProduct } = require("../middleware/validate");

const router = express.Router();

// Apply Authentication and Admin Role check to all /api/admin routes
router.use(authenticate);
router.use(authorizeRoles("admin"));

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard KPI metrics (orders, revenue, products, stocks)
 */
router.get("/stats", OrderController.getAdminStats);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders across all customers with filter & search
 */
router.get("/orders", OrderController.getAllOrdersAdmin);

/**
 * @route   PATCH /api/admin/orders/:id/status
 * @desc    Update order status (pending, processing, shipped, delivered, cancelled)
 */
router.patch("/orders/:id/status", OrderController.updateOrderStatus);

/**
 * @route   GET /api/admin/products
 * @desc    Get all products for inventory management
 */
router.get("/products", ProductController.getProducts);

/**
 * @route   POST /api/admin/products
 * @desc    Create new catalog product
 */
router.post("/products", validateCreateProduct, ProductController.createProduct);

/**
 * @route   PUT /api/admin/products/:id
 * @desc    Update existing product details
 */
router.put("/products/:id", validateUpdateProduct, ProductController.updateProduct);

/**
 * @route   PATCH /api/admin/products/:id/stock
 * @desc    Update product stock quantity
 */
router.patch("/products/:id/stock", ProductController.updateStock);

/**
 * @route   DELETE /api/admin/products/:id
 * @desc    Delete product from catalog
 */
router.delete("/products/:id", ProductController.deleteProduct);

module.exports = router;
