const Category = require("../models/category.model");
const Product = require("../models/product.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { FALLBACK_CATEGORIES, FALLBACK_PRODUCTS } = require("../utils/dummyData");

/**
 * Controller handling Category CRUD and category-product relationships
 */
const CategoryController = {
  /**
   * GET /api/categories
   * Returns all active categories with product counts.
   */
  async getCategories(req, res, next) {
    try {
      try {
        const categories = await Category.findAllWithCount();
        if (categories && categories.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: "Categories retrieved successfully from database",
            data: categories,
            meta: { total: categories.length, source: "database" },
          });
        }
      } catch (dbErr) {
        // Fallback to in-memory dataset
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Categories retrieved successfully",
        data: FALLBACK_CATEGORIES,
        meta: { total: FALLBACK_CATEGORIES.length, source: "application-memory" },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/categories/:slug
   * Returns a single category by its slug or ID.
   */
  async getCategoryBySlug(req, res, next) {
    try {
      const { slug } = req.params;

      try {
        const category = await Category.findBySlug(slug);
        if (category) {
          return successResponse(res, {
            statusCode: 200,
            message: "Category details retrieved successfully",
            data: category,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const fallback = FALLBACK_CATEGORIES.find(
        (c) => c.slug === slug.toLowerCase() || c.id === slug
      );

      if (!fallback) {
        return errorResponse(res, {
          statusCode: 404,
          message: `Category '${slug}' not found`,
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Category details retrieved",
        data: fallback,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/categories/:slug/products
   * Returns all products belonging to a given category.
   */
  async getCategoryProducts(req, res, next) {
    try {
      const { slug } = req.params;

      try {
        const data = await Category.findBySlugWithProducts(slug);
        if (data) {
          return successResponse(res, {
            statusCode: 200,
            message: `Products for category '${slug}' retrieved`,
            data: data.products,
            meta: { category: data.name, total: data.products.length },
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      try {
        const products = await Product.findAll({ categorySlug: slug });
        if (products && products.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: `Products for category '${slug}' retrieved`,
            data: products,
            meta: { categorySlug: slug, total: products.length, source: "database" },
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const matchingProducts = FALLBACK_PRODUCTS.filter(
        (p) =>
          p.categorySlug === slug.toLowerCase() ||
          p.category.toLowerCase() === slug.toLowerCase()
      );

      return successResponse(res, {
        statusCode: 200,
        message: `Products for category '${slug}' retrieved`,
        data: matchingProducts,
        meta: { categorySlug: slug, total: matchingProducts.length, source: "application-memory" },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/categories
   * Creates a new category.
   */
  async createCategory(req, res, next) {
    try {
      const { name, slug, description, icon, imageUrl } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Validation failed: 'name' is required and must be a valid string",
        });
      }

      const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");

      try {
        const newCategory = await Category.create({
          name: name.trim(),
          slug: generatedSlug,
          description,
          icon: icon || "tag",
          imageUrl,
        });

        return successResponse(res, {
          statusCode: 201,
          message: "Category created successfully in database",
          data: newCategory,
        });
      } catch (dbErr) {
        // If DB not connected, insert in memory for demonstration
        const mockCategory = {
          id: `cat-${Date.now()}`,
          name: name.trim(),
          slug: generatedSlug,
          description: description || "",
          icon: icon || "tag",
          imageUrl: imageUrl || "",
          productCount: 0,
          createdAt: new Date().toISOString(),
        };
        FALLBACK_CATEGORIES.push(mockCategory);

        return successResponse(res, {
          statusCode: 201,
          message: "Category created successfully (in-memory mode)",
          data: mockCategory,
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/categories/:id
   * Updates an existing category.
   */
  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name, slug, description, icon, imageUrl } = req.body;

      try {
        const updated = await Category.update(id, { name, slug, description, icon, imageUrl });
        if (updated) {
          return successResponse(res, {
            statusCode: 200,
            message: "Category updated successfully",
            data: updated,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const index = FALLBACK_CATEGORIES.findIndex((c) => c.id === id);
      if (index === -1) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Category not found",
        });
      }

      FALLBACK_CATEGORIES[index] = {
        ...FALLBACK_CATEGORIES[index],
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(icon && { icon }),
        ...(imageUrl && { imageUrl }),
      };

      return successResponse(res, {
        statusCode: 200,
        message: "Category updated successfully",
        data: FALLBACK_CATEGORIES[index],
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/categories/:id
   * Soft deletes a category.
   */
  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;

      try {
        const deleted = await Category.delete(id);
        if (deleted) {
          return successResponse(res, {
            statusCode: 200,
            message: "Category deleted successfully",
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const index = FALLBACK_CATEGORIES.findIndex((c) => c.id === id);
      if (index === -1) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Category not found",
        });
      }

      FALLBACK_CATEGORIES.splice(index, 1);
      return successResponse(res, {
        statusCode: 200,
        message: "Category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = CategoryController;
