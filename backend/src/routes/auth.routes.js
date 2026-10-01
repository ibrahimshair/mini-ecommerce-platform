const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { validateRegister, validateLogin } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// User Registration endpoint
router.post("/register", validateRegister, AuthController.register);

// User Login endpoint with JWT generation
router.post("/login", validateLogin, AuthController.login);

// Protected: Get current authenticated user profile
router.get("/me", authenticate, AuthController.getMe);

module.exports = router;

