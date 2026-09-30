const express = require("express");
const AuthController = require("../controllers/auth.controller");
const { validateRegister } = require("../middleware/validate");

const router = express.Router();

// User Registration endpoint
router.post("/register", validateRegister, AuthController.register);

// Placeholder for Day 9: User Login & JWT
router.post("/login", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Login ve JWT token üretimi 9. Gün görevinde aktifleşecektir.",
  });
});

module.exports = router;
