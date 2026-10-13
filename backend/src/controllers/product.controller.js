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
   * Enhanced with multi-criteria filtering, search, sorting, and pagination.
   */
  async getProducts(req, res, next) {
    try {
      const {
        category,
        minPrice,
        maxPrice,
        search,
        q,
        inStock,
        minRating,
        rating,
        isFeatured,
        sortBy,
        sortOrder,
      } = req.query;

      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = req.query.limit
        ? Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 12))
        : (req.query.page ? 12 : 50);
      const offset = (page - 1) * limit;

      const querySearch = (search || q || "").trim() || undefined;
      const minPriceVal = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : undefined;
      const maxPriceVal = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : undefined;
      const inStockOnly = inStock === "true" || inStock === "1" || inStock === true;
      const minRatingVal = minRating !== undefined && minRating !== ""
        ? Number(minRating)
        : (rating !== undefined && rating !== "" ? Number(rating) : undefined);
      const isFeaturedVal = isFeatured !== undefined
        ? (isFeatured === "true" || isFeatured === "1" || isFeatured === true)
        : undefined;

      try {
        const total = await Product.count({
          categorySlug: category,
          minPrice: minPriceVal,
          maxPrice: maxPriceVal,
          search: querySearch,
          inStock: inStockOnly,
          minRating: minRatingVal,
          isFeatured: isFeaturedVal,
        });

        const products = await Product.findAll({
          categorySlug: category,
          minPrice: minPriceVal,
          maxPrice: maxPriceVal,
          search: querySearch,
          inStock: inStockOnly,
          minRating: minRatingVal,
          isFeatured: isFeaturedVal,
          sortBy,
          sortOrder,
          limit,
          offset,
        });

        if (products !== null && products !== undefined) {
          const totalPages = Math.ceil(total / limit) || 1;
          const pagination = {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          };

          return successResponse(res, {
            statusCode: 200,
            message: "Products retrieved successfully from database",
            data: products,
            pagination,
            meta: {
              ...pagination,
              source: "database",
            },
            filtersApplied: {
              category: category || null,
              minPrice: minPriceVal !== undefined ? minPriceVal : null,
              maxPrice: maxPriceVal !== undefined ? maxPriceVal : null,
              search: querySearch || null,
              inStock: inStockOnly,
              minRating: minRatingVal !== undefined ? minRatingVal : null,
              sortBy: sortBy || "created_at",
            },
          });
        }
      } catch (dbErr) {
        // Fallback to in-memory dataset when DB connection is pending or fails
      }

      // Filter fallback dataset
      let filtered = [...FALLBACK_PRODUCTS];

      if (category && category !== "all" && category !== "Tümü") {
        filtered = filtered.filter(
          (p) =>
            (p.categorySlug && p.categorySlug.toLowerCase() === category.toLowerCase()) ||
            (p.category && p.category.toLowerCase() === category.toLowerCase())
        );
      }

      if (maxPriceVal !== undefined && !isNaN(maxPriceVal)) {
        filtered = filtered.filter((p) => p.price <= maxPriceVal);
      }

      if (minPriceVal !== undefined && !isNaN(minPriceVal)) {
        filtered = filtered.filter((p) => p.price >= minPriceVal);
      }

      if (inStockOnly) {
        filtered = filtered.filter((p) => p.stock > 0);
      }

      if (minRatingVal !== undefined && !isNaN(minRatingVal)) {
        filtered = filtered.filter((p) => (p.rating || 0) >= minRatingVal);
      }

      if (isFeaturedVal !== undefined) {
        filtered = filtered.filter((p) => Boolean(p.isFeatured) === isFeaturedVal);
      }

      if (querySearch) {
        const qStr = querySearch.toLowerCase();
        filtered = filtered.filter(
          (p) =>
            (p.name && p.name.toLowerCase().includes(qStr)) ||
            (p.description && p.description.toLowerCase().includes(qStr))
        );
      }

      if (sortBy === "price-asc" || (sortBy === "price" && sortOrder?.toUpperCase() === "ASC")) {
        filtered.sort((a, b) => a.price - b.price);
      } else if (sortBy === "price-desc" || (sortBy === "price" && sortOrder?.toUpperCase() === "DESC")) {
        filtered.sort((a, b) => b.price - a.price);
      } else if (sortBy === "rating-desc" || (sortBy === "rating" && sortOrder?.toUpperCase() === "DESC")) {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sortBy === "rating" && sortOrder?.toUpperCase() === "ASC") {
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      } else if (sortBy === "popular") {
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
      } else if (sortBy === "newest") {
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else if (sortBy === "name") {
        filtered.sort((a, b) => (sortOrder?.toUpperCase() === "DESC" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)));
      }

      const total = filtered.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const paginatedData = filtered.slice(offset, offset + limit);

      const pagination = {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };

      return successResponse(res, {
        statusCode: 200,
        message: "Products retrieved successfully",
        data: paginatedData,
        pagination,
        meta: {
          ...pagination,
          source: "application-memory",
        },
        filtersApplied: {
          category: category || null,
          minPrice: minPriceVal !== undefined ? minPriceVal : null,
          maxPrice: maxPriceVal !== undefined ? maxPriceVal : null,
          search: querySearch || null,
          inStock: inStockOnly,
          minRating: minRatingVal !== undefined ? minRatingVal : null,
          sortBy: sortBy || "created_at",
        },
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

  /**
   * POST /api/products
   * Creates a new product.
   */
  async createProduct(req, res, next) {
    try {
      const {
        name,
        price,
        stock = 0,
        categoryId,
        description = "",
        oldPrice = null,
        imageUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        isFeatured = false,
      } = req.body;

      // Generate URL slug
      const slug =
        req.body.slug ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "") + `-${Date.now().toString().slice(-4)}`;

      let newProduct = null;

      try {
        newProduct = await Product.create({
          categoryId: categoryId || null,
          name,
          slug,
          description,
          price,
          oldPrice,
          stock,
          imageUrl,
          isFeatured,
        });
      } catch (dbErr) {
        // Fallback to in-memory creation
        newProduct = {
          id: `prod-${Date.now()}`,
          name,
          slug,
          description,
          price: Number(price),
          oldPrice: oldPrice ? Number(oldPrice) : null,
          stock: Number(stock),
          rating: 5.0,
          reviewCount: 0,
          image: imageUrl,
          imageUrl,
          isFeatured: Boolean(isFeatured),
          categoryId: categoryId || "c1",
          category: "Genel",
          categorySlug: "genel",
          createdAt: new Date().toISOString(),
        };
        FALLBACK_PRODUCTS.unshift(newProduct);
      }

      return successResponse(res, {
        statusCode: 201,
        message: "Ürün başarıyla oluşturuldu.",
        data: newProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/products/:id
   * Updates an existing product.
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      let updatedProduct = null;

      try {
        updatedProduct = await Product.update(id, updateData);
      } catch (dbErr) {
        // Fallback check
        const index = FALLBACK_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
        if (index !== -1) {
          FALLBACK_PRODUCTS[index] = {
            ...FALLBACK_PRODUCTS[index],
            ...updateData,
            price: updateData.price !== undefined ? Number(updateData.price) : FALLBACK_PRODUCTS[index].price,
            stock: updateData.stock !== undefined ? Number(updateData.stock) : FALLBACK_PRODUCTS[index].stock,
          };
          updatedProduct = FALLBACK_PRODUCTS[index];
        }
      }

      if (!updatedProduct) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Güncellenecek ürün bulunamadı.",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Ürün başarıyla güncellendi.",
        data: updatedProduct,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/products/:id
   * Deletes (soft deletes) an existing product.
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      let deleted = false;

      try {
        const result = await Product.delete(id);
        if (result) deleted = true;
      } catch (dbErr) {
        const index = FALLBACK_PRODUCTS.findIndex((p) => p.id === id || p.slug === id);
        if (index !== -1) {
          FALLBACK_PRODUCTS.splice(index, 1);
          deleted = true;
        }
      }

      if (!deleted) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Silinecek ürün bulunamadı.",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Ürün başarıyla silindi.",
        data: { id },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/products/:id/stock
   * Adjusts stock quantity for an item.
   */
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { delta, stock } = req.body;

      if (delta === undefined && stock === undefined) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Lütfen 'delta' veya 'stock' değeri belirtiniz.",
        });
      }

      let updated = null;

      try {
        if (delta !== undefined) {
          updated = await Product.updateStock(id, Number(delta));
        } else {
          updated = await Product.update(id, { stock: Number(stock) });
        }
      } catch (dbErr) {
        const found = FALLBACK_PRODUCTS.find((p) => p.id === id || p.slug === id);
        if (found) {
          if (delta !== undefined) {
            found.stock = Math.max(0, found.stock + Number(delta));
          } else {
            found.stock = Math.max(0, Number(stock));
          }
          updated = { id: found.id, name: found.name, stock: found.stock };
        }
      }

      if (!updated) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Ürün bulunamadı.",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Ürün stoğu başarıyla güncellendi.",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ProductController;
