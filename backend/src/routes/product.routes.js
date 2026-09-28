const express = require("express");
const ProductController = require("../controllers/product.controller");

const router = express.Router();

router.get("/categories", ProductController.getCategories);
router.get("/:id", ProductController.getProductById);
router.get("/", ProductController.getProducts);

module.exports = router;
