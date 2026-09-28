const { query } = require("../config/db");

/**
 * Category Data Access Model
 */
const Category = {
  /**
   * Retrieves all active categories.
   */
  async findAll() {
    const text = `
      SELECT id, name, slug, description, icon, image_url AS "imageUrl", created_at AS "createdAt"
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC;
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Retrieves all active categories with product counts.
   */
  async findAllWithCount() {
    const text = `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description, 
        c.icon, 
        c.image_url AS "imageUrl", 
        c.created_at AS "createdAt",
        COUNT(p.id)::int AS "productCount"
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id AND p.is_active = true
      WHERE c.is_active = true
      GROUP BY c.id
      ORDER BY c.name ASC;
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Finds a category by its unique ID.
   */
  async findById(id) {
    const text = `
      SELECT id, name, slug, description, icon, image_url AS "imageUrl", created_at AS "createdAt"
      FROM categories
      WHERE id = $1 AND is_active = true;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  /**
   * Finds a category by its URL slug.
   */
  async findBySlug(slug) {
    const text = `
      SELECT id, name, slug, description, icon, image_url AS "imageUrl", created_at AS "createdAt"
      FROM categories
      WHERE slug = $1 AND is_active = true;
    `;
    const res = await query(text, [slug.toLowerCase()]);
    return res.rows[0] || null;
  },

  /**
   * Finds a category and all active products belonging to it.
   */
  async findBySlugWithProducts(slug) {
    const category = await this.findBySlug(slug);
    if (!category) return null;

    const productsQuery = `
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
        p.is_featured AS "isFeatured"
      FROM products p
      WHERE p.category_id = $1 AND p.is_active = true
      ORDER BY p.created_at DESC;
    `;
    const productsRes = await query(productsQuery, [category.id]);
    return {
      ...category,
      products: productsRes.rows,
    };
  },

  /**
   * Inserts a new category into the database.
   */
  async create({ name, slug, description, icon, imageUrl }) {
    const autoSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const text = `
      INSERT INTO categories (name, slug, description, icon, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, slug, description, icon, image_url AS "imageUrl", created_at AS "createdAt";
    `;
    const res = await query(text, [name, autoSlug, description, icon, imageUrl]);
    return res.rows[0];
  },

  /**
   * Updates an existing category.
   */
  async update(id, { name, slug, description, icon, imageUrl }) {
    const text = `
      UPDATE categories
      SET 
        name = COALESCE($1, name),
        slug = COALESCE($2, slug),
        description = COALESCE($3, description),
        icon = COALESCE($4, icon),
        image_url = COALESCE($5, image_url)
      WHERE id = $6 AND is_active = true
      RETURNING id, name, slug, description, icon, image_url AS "imageUrl", updated_at AS "updatedAt";
    `;
    const res = await query(text, [name, slug, description, icon, imageUrl, id]);
    return res.rows[0] || null;
  },

  /**
   * Soft deletes a category.
   */
  async delete(id) {
    const text = `
      UPDATE categories
      SET is_active = false
      WHERE id = $1
      RETURNING id;
    `;
    const res = await query(text, [id]);
    return res.rowCount > 0;
  },
};

module.exports = Category;
