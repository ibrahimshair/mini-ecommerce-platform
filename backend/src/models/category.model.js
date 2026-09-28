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
      SELECT id, name, slug, description, icon, image_url, created_at
      FROM categories
      WHERE is_active = true
      ORDER BY name ASC;
    `;
    const res = await query(text);
    return res.rows;
  },

  /**
   * Finds a category by its unique ID.
   */
  async findById(id) {
    const text = `
      SELECT id, name, slug, description, icon, image_url, created_at
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
      SELECT id, name, slug, description, icon, image_url, created_at
      FROM categories
      WHERE slug = $1 AND is_active = true;
    `;
    const res = await query(text, [slug]);
    return res.rows[0] || null;
  },

  /**
   * Inserts a new category into the database.
   */
  async create({ name, slug, description, icon, imageUrl }) {
    const text = `
      INSERT INTO categories (name, slug, description, icon, image_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await query(text, [name, slug, description, icon, imageUrl]);
    return res.rows[0];
  },
};

module.exports = Category;
