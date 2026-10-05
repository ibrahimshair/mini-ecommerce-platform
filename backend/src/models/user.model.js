const { query } = require("../config/db");

/**
 * User Data Access Model
 */
const User = {
  async findById(id) {
    const text = `
      SELECT id, name, email, role, avatar_url AS "avatarUrl", phone, created_at AS "createdAt"
      FROM users
      WHERE id = $1 AND is_active = true;
    `;
    const res = await query(text, [id]);
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const text = `
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER($1);
    `;
    const res = await query(text, [email]);
    return res.rows[0] || null;
  },

  async create({ name, email, passwordHash, role = "user", phone }) {
    const text = `
      INSERT INTO users (name, email, password_hash, role, phone)
      VALUES ($1, LOWER($2), $3, $4, $5)
      RETURNING id, name, email, role, phone, created_at AS "createdAt";
    `;
    const res = await query(text, [name, email, passwordHash, role, phone]);
    return res.rows[0];
  },

  async updateProfile(id, { name, phone }) {
    const text = `
      UPDATE users
      SET name = COALESCE($2, name),
          phone = COALESCE($3, phone),
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, name, email, role, phone, created_at AS "createdAt", updated_at AS "updatedAt";
    `;
    const res = await query(text, [id, name, phone]);
    return res.rows[0] || null;
  },

  async updatePassword(id, passwordHash) {
    const text = `
      UPDATE users
      SET password_hash = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id;
    `;
    const res = await query(text, [id, passwordHash]);
    return res.rows[0] || null;
  },
};

module.exports = User;
