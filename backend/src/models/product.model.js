const { query } = require("../config/db");

/**
 * Product Data Access Model
 */
const Product = {
  /**
   * Retrieves products with dynamic filtering, sorting, and pagination.
   */
  async findAll({
    categorySlug,
    minPrice,
    maxPrice,
    search,
    inStock,
    isFeatured,
    sortBy = "created_at",
    sortOrder = "DESC",
    limit = 50,
    offset = 0,
  } = {}) {
    const conditions = ["p.is_active = true"];
    const values = [];
    let paramIndex = 1;

    if (categorySlug && categorySlug !== "all" && categorySlug !== "Tümü") {
      conditions.push(`c.slug = $${paramIndex}`);
      values.push(categorySlug.toLowerCase());
      paramIndex++;
    }

    if (minPrice !== undefined && minPrice !== null) {
      conditions.push(`p.price >= $${paramIndex}`);
      values.push(minPrice);
      paramIndex++;
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      conditions.push(`p.price <= $${paramIndex}`);
      values.push(maxPrice);
      paramIndex++;
    }

    if (inStock) {
      conditions.push(`p.stock > 0`);
    }

    if (isFeatured !== undefined && isFeatured !== null) {
      conditions.push(`p.is_featured = $${paramIndex}`);
      values.push(isFeatured);
      paramIndex++;
    }

    if (search && search.trim()) {
      conditions.push(`(p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`);
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    // Sanitize sort parameters
    const allowedSortFields = {
      price: "p.price",
      rating: "p.rating",
      name: "p.name",
      created_at: "p.created_at",
    };
    const sortField = allowedSortFields[sortBy] || "p.created_at";
    const orderDirection = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const text = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.old_price AS "oldPrice",
        p.stock,
        p.rating,
        p.review_count AS "reviewCount",
        p.image_url AS "image",
        p.is_featured AS "isFeatured",
        p.created_at AS "createdAt",
        c.id AS "categoryId",
        c.name AS "category",
        c.slug AS "categorySlug"
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY ${sortField} ${orderDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    values.push(limit, offset);
    const res = await query(text, values);
    return res.rows;
  },

  /**
   * Retrieves single product by its unique ID.
   */
  async findById(id) {
    const text = `
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.price,
        p.old_price AS "oldPrice",
        p.stock,
        p.rating,
        p.review_count AS "reviewCount",
        p.image_url AS "image",
        p.is_featured AS "isFeatured",
        p.created_at AS "createdAt",
        c.id AS "categoryId",
        c.name AS "category",
        c.slug AS "categorySlug"
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.is_active = true;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Retrieves featured showcase products.
   */
  async findFeatured(limit = 8) {
    return this.findAll({ isFeatured: true, limit });
  },

  /**
   * Creates a new product.
   */
  async create({ categoryId, name, slug, description, price, oldPrice, stock, imageUrl, isFeatured = false }) {
    const text = `
      INSERT INTO products (
        category_id, name, slug, description, price, old_price, stock, image_url, is_featured
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const res = await query(text, [
      categoryId,
      name,
      slug,
      description,
      price,
      oldPrice,
      stock,
      imageUrl,
      isFeatured,
    ]);
    return res.rows[0];
  },
};

module.exports = Product;
