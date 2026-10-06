const express = require("express");
const ProductController = require("../controllers/product.controller");
const { validateCreateProduct, validateUpdateProduct } = require("../middleware/validate");

const router = express.Router();

// Public Product Catalog Endpoints
router.get("/categories", ProductController.getCategories);
router.get("/:id", ProductController.getProductById);
router.get("/", ProductController.getProducts);

// Product Management Endpoints (CRUD)
router.post("/", validateCreateProduct, ProductController.createProduct);
router.put("/:id", validateUpdateProduct, ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);
router.patch("/:id/stock", ProductController.updateStock);

module.exports = router;
