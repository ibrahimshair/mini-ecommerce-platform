const express = require("express");
const CartController = require("../controllers/cart.controller");
const { authenticateOptional } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * @route   GET /api/cart
 * @desc    Get current user's or guest's cart with calculated totals
 * @access  Public / Optional Auth
 */
router.get("/", authenticateOptional, CartController.getCart);

/**
 * @route   POST /api/cart/items
 * @desc    Add item to cart or increment quantity
 * @access  Public / Optional Auth
 */
router.post("/items", authenticateOptional, CartController.addItem);

/**
 * @route   PUT /api/cart/items/:id
 * @desc    Update item quantity in cart
 * @access  Public / Optional Auth
 */
router.put("/items/:id", authenticateOptional, CartController.updateItem);

/**
 * @route   DELETE /api/cart/items/:id
 * @desc    Remove item from cart
 * @access  Public / Optional Auth
 */
router.delete("/items/:id", authenticateOptional, CartController.removeItem);

/**
 * @route   DELETE /api/cart
 * @desc    Clear all items in cart
 * @access  Public / Optional Auth
 */
router.delete("/", authenticateOptional, CartController.clearCart);

/**
 * @route   POST /api/cart/validate
 * @desc    Validate cart against live product stock and return warnings
 * @access  Public / Optional Auth
 */
router.post("/validate", authenticateOptional, CartController.validateStock);

module.exports = router;
