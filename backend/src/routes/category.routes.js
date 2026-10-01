const express = require("express");
const CategoryController = require("../controllers/category.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/:slug/products", CategoryController.getCategoryProducts);
router.get("/:slug", CategoryController.getCategoryBySlug);
router.get("/", CategoryController.getCategories);
router.post("/", authenticate, authorizeRoles("admin"), CategoryController.createCategory);
router.put("/:id", authenticate, authorizeRoles("admin"), CategoryController.updateCategory);
router.delete("/:id", authenticate, authorizeRoles("admin"), CategoryController.deleteCategory);

module.exports = router;
