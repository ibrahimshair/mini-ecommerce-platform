const express = require("express");
const {
  getHealth,
  getSecurityHealth,
  getResilienceHealth,
} = require("../controllers/health.controller");

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Get system health and uptime status
 * @access  Public
 */
router.get("/", getHealth);

/**
 * @route   GET /api/health/security
 * @desc    Get API security hardening and audit report
 * @access  Public
 */
router.get("/security", getSecurityHealth);

/**
 * @route   GET /api/health/resilience
 * @desc    Get system resilience, retry policies and error handling schema
 * @access  Public
 */
router.get("/resilience", getResilienceHealth);

module.exports = router;
