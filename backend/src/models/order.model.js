const { query } = require("../config/db");

/**
 * Order Data Access Model
 * Manages database operations for orders and order items.
 */
const Order = {
  /**
   * Creates a new order along with its order items in PostgreSQL.
   */
  async create(orderData, items = []) {
    const {
      userId,
      orderNumber,
      totalPrice,
      status = "pending",
      shippingAddress,
      paymentMethod = "credit_card",
      paymentStatus = "paid",
      notes = null,
    } = orderData;

    const serializedAddress =
      typeof shippingAddress === "object"
        ? JSON.stringify(shippingAddress)
        : String(shippingAddress);

    const orderQuery = `
      INSERT INTO orders (
        order_number,
        user_id,
        total_price,
        status,
        shipping_address,
        payment_method,
        payment_status,
        notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id,
        order_number AS "orderNumber",
        user_id AS "userId",
        total_price AS "totalPrice",
        status,
        shipping_address AS "shippingAddress",
        payment_method AS "paymentMethod",
        payment_status AS "paymentStatus",
        notes,
        created_at AS "createdAt",
        updated_at AS "updatedAt";
    `;

    const orderRes = await query(orderQuery, [
      orderNumber,
      userId,
      totalPrice,
      status,
      serializedAddress,
      paymentMethod,
      paymentStatus,
      notes,
    ]);

    const createdOrder = orderRes.rows[0];

    // Insert order items
    const insertedItems = [];
    for (const item of items) {
      const itemQuery = `
        INSERT INTO order_items (
          order_id,
          product_id,
          quantity,
          unit_price,
          total_price
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING 
          id,
          order_id AS "orderId",
          product_id AS "productId",
          quantity,
          unit_price AS "unitPrice",
          total_price AS "totalPrice",
          created_at AS "createdAt";
      `;
      const unitPrice = Number(item.price || item.unitPrice || 0);
      const qty = Number(item.quantity || 1);
      const itemTotal = Math.round(unitPrice * qty * 100) / 100;

      const itemRes = await query(itemQuery, [
        createdOrder.id,
        item.productId || item.id,
        qty,
        unitPrice,
        itemTotal,
      ]);

      insertedItems.push({
        ...itemRes.rows[0],
        name: item.name,
        image: item.image || item.imageUrl,
      });
    }

    return {
      ...createdOrder,
      items: insertedItems,
    };
  },

  /**
   * Retrieves orders for a specific user.
   */
  async findByUserId(userId, { limit = 20, offset = 0 } = {}) {
    const text = `
      SELECT 
        o.id,
        o.order_number AS "orderNumber",
        o.user_id AS "userId",
        o.total_price AS "totalPrice",
        o.status,
        o.shipping_address AS "shippingAddress",
        o.payment_method AS "paymentMethod",
        o.payment_status AS "paymentStatus",
        o.notes,
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt",
        COUNT(oi.id)::int AS "itemCount"
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $2 OFFSET $3;
    `;
    const res = await query(text, [userId, limit, offset]);
    return res.rows;
  },

  /**
   * Retrieves a single order by ID with all item details.
   */
  async findById(orderId, userId = null) {
    const whereConditions = ["o.id = $1"];
    const params = [orderId];

    if (userId) {
      whereConditions.push("o.user_id = $2");
      params.push(userId);
    }

    const orderQuery = `
      SELECT 
        o.id,
        o.order_number AS "orderNumber",
        o.user_id AS "userId",
        o.total_price AS "totalPrice",
        o.status,
        o.shipping_address AS "shippingAddress",
        o.payment_method AS "paymentMethod",
        o.payment_status AS "paymentStatus",
        o.notes,
        o.created_at AS "createdAt",
        o.updated_at AS "updatedAt"
      FROM orders o
      WHERE ${whereConditions.join(" AND ")};
    `;

    const orderRes = await query(orderQuery, params);
    if (!orderRes.rows.length) return null;

    const order = orderRes.rows[0];

    const itemsQuery = `
      SELECT 
        oi.id,
        oi.order_id AS "orderId",
        oi.product_id AS "productId",
        oi.quantity,
        oi.unit_price AS "unitPrice",
        oi.total_price AS "totalPrice",
        p.name,
        p.image_url AS "image",
        p.slug
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
      ORDER BY oi.created_at ASC;
    `;
    const itemsRes = await query(itemsQuery, [orderId]);
    order.items = itemsRes.rows;

    return order;
  },

  /**
   * Updates an order status (e.g. pending -> processing -> shipped -> delivered, or cancelled).
   */
  async updateStatus(orderId, status) {
    const text = `
      UPDATE orders
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING 
        id,
        order_number AS "orderNumber",
        status,
        updated_at AS "updatedAt";
    `;
    const res = await query(text, [status, orderId]);
    return res.rows[0] || null;
  },

  /**
   * Returns total count of orders for a user.
   */
  async countByUserId(userId) {
    const text = `SELECT COUNT(*) AS total FROM orders WHERE user_id = $1;`;
    const res = await query(text, [userId]);
    return parseInt(res.rows[0]?.total || 0, 10);
  },
};

module.exports = Order;
