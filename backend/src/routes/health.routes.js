const express = require("express");
const { getHealth } = require("../controllers/health.controller");

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Get system health and uptime status
 * @access  Public
 */
router.get("/", getHealth);

module.exports = router;
