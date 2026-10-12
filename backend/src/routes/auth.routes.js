const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { validateRegister, validateLogin } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");
const { authRateLimiter } = require("../middleware/security.middleware");

const router = express.Router();

// User Registration endpoint (Protected by auth rate limiter)
router.post("/register", authRateLimiter, validateRegister, AuthController.register);

// User Login endpoint with JWT generation (Protected by brute-force limiter)
router.post("/login", authRateLimiter, validateLogin, AuthController.login);

// Protected: Get current authenticated user profile
router.get("/me", authenticate, AuthController.getMe);

// Protected: Update user profile and change password
router.put("/me", authenticate, AuthController.updateMe);

module.exports = router;

