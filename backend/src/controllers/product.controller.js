const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } = require("../utils/dummyData");

/**
 * Controller handling product listings, single product details and category queries.
 */
const ProductController = {
  /**
   * GET /api/products
   */
  async getProducts(req, res, next) {
    try {
      const { category, minPrice, maxPrice, search, inStock, sortBy, sortOrder } = req.query;

      try {
        const products = await Product.findAll({
          categorySlug: category,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          search,
          inStock: inStock === "true",
          sortBy,
          sortOrder,
        });

        if (products && products.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: "Products retrieved successfully from database",
            data: products,
            meta: { total: products.length, source: "database" },
          });
        }
      } catch (dbErr) {
        // Fallback to in-memory dataset when DB connection is pending
      }

      // Filter fallback dataset
      let filtered = [...FALLBACK_PRODUCTS];

      if (category && category !== "all" && category !== "Tümü") {
        filtered = filtered.filter(
          (p) =>
            p.categorySlug === category.toLowerCase() ||
            p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (maxPrice) {
        filtered = filtered.filter((p) => p.price <= Number(maxPrice));
      }

      if (minPrice) {
        filtered = filtered.filter((p) => p.price >= Number(minPrice));
      }

      if (inStock === "true") {
        filtered = filtered.filter((p) => p.stock > 0);
      }

      if (search && search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }

      if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === "rating-desc") filtered.sort((a, b) => b.rating - a.rating);

      return successResponse(res, {
        statusCode: 200,
        message: "Products retrieved successfully",
        data: filtered,
        meta: { total: filtered.length, source: "application-memory" },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      try {
        const product = await Product.findById(id);
        if (product) {
          return successResponse(res, {
            statusCode: 200,
            message: "Product details retrieved",
            data: product,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id || p.slug === id);
      if (!fallback) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Product not found",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Product details retrieved",
        data: fallback,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/products/categories
   */
  async getCategories(req, res, next) {
    try {
      try {
        const categories = await Category.findAll();
        if (categories && categories.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: "Categories retrieved from database",
            data: categories,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Categories retrieved",
        data: FALLBACK_CATEGORIES,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ProductController;
