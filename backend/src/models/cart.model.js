const { query } = require("../config/db");

/**
 * Shopping Cart Data Access Model
 */
const Cart = {
  async getOrCreateCart(userId) {
    let text = `SELECT id, user_id FROM carts WHERE user_id = $1;`;
    let res = await query(text, [userId]);
    if (res.rows.length === 0) {
      text = `INSERT INTO carts (user_id) VALUES ($1) RETURNING id, user_id;`;
      res = await query(text, [userId]);
    }
    return res.rows[0];
  },

  async getCartItems(cartId) {
    const text = `
      SELECT 
        ci.id,
        ci.quantity,
        ci.created_at AS "createdAt",
        p.id AS "productId",
        p.name,
        p.price,
        p.image_url AS "image",
        p.stock
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
      ORDER BY ci.created_at ASC;
    `;
    const res = await query(text, [cartId]);
    return res.rows;
  },

  async addItem(cartId, productId, quantity = 1) {
    const text = `
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
      RETURNING *;
    `;
    const res = await query(text, [cartId, productId, quantity]);
    return res.rows[0];
  },

  async updateItemQuantity(cartId, itemId, quantity) {
    const text = `
      UPDATE cart_items
      SET quantity = $1
      WHERE id = $2 AND cart_id = $3
      RETURNING *;
    `;
    const res = await query(text, [quantity, itemId, cartId]);
    return res.rows[0];
  },

  async removeItem(cartId, itemId) {
    const text = `
      DELETE FROM cart_items
      WHERE id = $1 AND cart_id = $2
      RETURNING *;
    `;
    const res = await query(text, [itemId, cartId]);
    return res.rows[0];
  },
};

module.exports = Cart;
