const express = require("express");
const OrderController = require("../controllers/order.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");
const { validateCreateOrder } = require("../middleware/validate");

const router = express.Router();

/**
 * @route   GET /api/orders/admin/all
 * @desc    Retrieve all customer orders across system (Admin only)
 * @access  Private (Admin only)
 */
router.get("/admin/all", authenticate, authorizeRoles("admin"), OrderController.getAllOrdersAdmin);

/**
 * @route   GET /api/orders/admin/stats
 * @desc    Retrieve aggregate order and inventory statistics (Admin only)
 * @access  Private (Admin only)
 */
router.get("/admin/stats", authenticate, authorizeRoles("admin"), OrderController.getAdminStats);

/**
 * @route   POST /api/orders
 * @desc    Create a new order from user's shopping cart
 * @access  Private (Requires authentication)
 */
router.post("/", authenticate, validateCreateOrder, OrderController.createOrder);

/**
 * @route   GET /api/orders
 * @desc    Retrieve all orders placed by the current authenticated user
 * @access  Private (Requires authentication)
 */
router.get("/", authenticate, OrderController.getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Retrieve single order details by ID or order number
 * @access  Private (Requires authentication)
 */
router.get("/:id", authenticate, OrderController.getOrderById);

/**
 * @route   PATCH /api/orders/:id/cancel
 * @desc    Cancel an order and return reserved stocks
 * @access  Private (Requires authentication)
 */
router.patch("/:id/cancel", authenticate, OrderController.cancelOrder);

/**
 * @route   PATCH /api/orders/:id/status
 * @desc    Update order lifecycle status (Admin only)
 * @access  Private (Admin only)
 */
router.patch("/:id/status", authenticate, authorizeRoles("admin"), OrderController.updateOrderStatus);

module.exports = router;
