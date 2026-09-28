const express = require("express");
const CategoryController = require("../controllers/category.controller");

const router = express.Router();

router.get("/:slug/products", CategoryController.getCategoryProducts);
router.get("/:slug", CategoryController.getCategoryBySlug);
router.get("/", CategoryController.getCategories);
router.post("/", CategoryController.createCategory);
router.put("/:id", CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

module.exports = router;
