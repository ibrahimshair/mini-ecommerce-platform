const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const CartController = require("./cart.controller");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { FALLBACK_PRODUCTS } = require("../utils/dummyData");

// In-memory fallback orders for offline/demo/testing environments
const FALLBACK_ORDERS = [];

/**
 * Resolves product details from DB or fallback dataset.
 */
async function resolveProduct(productId) {
  try {
    const product = await Product.findById(productId);
    if (product) return product;
  } catch (err) {}

  return (
    FALLBACK_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null
  );
}

const OrderController = {
  FALLBACK_ORDERS,

  /**
   * POST /api/orders
   * Converts current user's active shopping cart into a permanent order.
   */
  async createOrder(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, {
          statusCode: 401,
          message: "Sipariş oluşturmak için lütfen oturum açınız.",
        });
      }

      const {
        shippingAddress,
        paymentMethod = "credit_card",
        notes = null,
        items: directItems,
      } = req.body || {};

      let orderItems = [];

      // 1. If direct items provided in body, use them; otherwise pull from user's cart
      if (Array.isArray(directItems) && directItems.length > 0) {
        orderItems = directItems;
      } else {
        // Try DB cart first
        try {
          const userCart = await Cart.getOrCreateCart(userId);
          if (userCart?.id) {
            const dbItems = await Cart.getCartItems(userCart.id);
            if (Array.isArray(dbItems) && dbItems.length > 0) {
              orderItems = dbItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                name: item.name,
                price: Number(item.price),
                image: item.image,
                quantity: Number(item.quantity),
                stock: Number(item.stock),
              }));
            }
          }
        } catch (dbErr) {
          // Ignore, fallback next
        }

        // If DB cart is empty, try fallback cart
        if (orderItems.length === 0) {
          const userCartKey = `user_${userId}`;
          const fallbackCartItems =
            CartController.FALLBACK_CARTS?.get(userCartKey) ||
            CartController.FALLBACK_CARTS?.get("session_guest_default") ||
            [];
          orderItems = fallbackCartItems;
        }
      }

      // Check if cart has items
      if (!orderItems || orderItems.length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Sepetiniz boş. Sipariş oluşturmak için sepetinize en az bir ürün ekleyiniz.",
          errors: [{ field: "items", message: "Sipariş edilecek ürün bulunamadı." }],
        });
      }

      // 2. Validate live product availability & stock for each item
      const validatedItems = [];
      for (const item of orderItems) {
        const productId = item.productId || item.id;
        const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);

        const product = await resolveProduct(productId);
        if (!product) {
          return errorResponse(res, {
            statusCode: 404,
            message: `Sipariş verilmek istenen ürün bulunamadı (ID: ${productId}).`,
          });
        }

        if (Number(product.stock) < requestedQty) {
          return errorResponse(res, {
            statusCode: 400,
            message: `Yetersiz stok! '${product.name}' ürününden mevcut stok ${product.stock} adet, talep edilen: ${requestedQty} adet.`,
            errors: [
              {
                field: "quantity",
                productId: product.id,
                productName: product.name,
                availableStock: Number(product.stock),
                requestedQuantity: requestedQty,
                message: "Talep edilen miktar mevcut stoğu aşıyor.",
              },
            ],
          });
        }

        const unitPrice = Number(product.price || item.price || 0);
        validatedItems.push({
          productId: product.id,
          name: product.name,
          price: unitPrice,
          unitPrice,
          quantity: requestedQty,
          image: product.image || product.imageUrl || item.image || item.imageUrl,
          stock: Number(product.stock),
        });
      }

      // 3. Calculate financial totals
      const subtotal = validatedItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0
      );
      const roundedSubtotal = Math.round(subtotal * 100) / 100;
      const FREE_SHIPPING_THRESHOLD = 150;
      const shippingCost =
        roundedSubtotal >= FREE_SHIPPING_THRESHOLD || roundedSubtotal === 0 ? 0 : 29.9;
      const grandTotal = Math.round((roundedSubtotal + shippingCost) * 100) / 100;

      // 4. Generate unique readable order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

      let createdOrder = null;

      // 5. Try creating order in PostgreSQL
      try {
        createdOrder = await Order.create(
          {
            userId,
            orderNumber,
            totalPrice: grandTotal,
            status: "pending",
            shippingAddress,
            paymentMethod,
            paymentStatus: "paid",
            notes: notes ? String(notes).trim() : null,
          },
          validatedItems
        );
      } catch (dbErr) {
        // Fallback to in-memory order creation
        createdOrder = {
          id: `ord-${Date.now()}`,
          orderNumber,
          userId,
          totalPrice: grandTotal,
          subtotal: roundedSubtotal,
          shippingCost,
          status: "pending",
          shippingAddress:
            typeof shippingAddress === "object"
              ? shippingAddress
              : { addressLine: shippingAddress },
          paymentMethod,
          paymentStatus: "paid",
          notes: notes ? String(notes).trim() : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          items: validatedItems.map((item, index) => ({
            id: `item-${Date.now()}-${index}`,
            orderId: `ord-${Date.now()}`,
            productId: item.productId,
            name: item.name,
            price: item.price,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: Math.round(item.unitPrice * item.quantity * 100) / 100,
            image: item.image,
          })),
        };
        FALLBACK_ORDERS.unshift(createdOrder);
      }

      // 6. Deduct product stocks
      for (const item of validatedItems) {
        try {
          await Product.updateStock(item.productId, -item.quantity);
        } catch (dbStockErr) {}

        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === item.productId);
        if (fallbackProd) {
          fallbackProd.stock = Math.max(0, fallbackProd.stock - item.quantity);
        }
      }

      // 7. Clear user's shopping cart
      try {
        const userCart = await Cart.getOrCreateCart(userId);
        if (userCart?.id) {
          await Cart.clearCart(userCart.id);
        }
      } catch (dbCartErr) {}

      // Clear fallback cart
      const userCartKey = `user_${userId}`;
      if (CartController.FALLBACK_CARTS) {
        CartController.FALLBACK_CARTS.delete(userCartKey);
        CartController.FALLBACK_CARTS.set(userCartKey, []);
        CartController.FALLBACK_CARTS.delete("session_guest_default");
        CartController.FALLBACK_CARTS.set("session_guest_default", []);
      }

      return successResponse(res, {
        statusCode: 201,
        message: "Siparişiniz başarıyla oluşturuldu.",
        data: createdOrder,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders
   * Retrieves all orders placed by the authenticated user.
   */
  async getMyOrders(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return errorResponse(res, {
          statusCode: 401,
          message: "Sipariş geçmişini görüntülemek için oturum açmalısınız.",
        });
      }

      let orders = [];

      try {
        orders = await Order.findByUserId(userId);
      } catch (dbErr) {
        orders = [];
      }

      // If DB has no orders or is in fallback mode, check in-memory list
      if (!orders || orders.length === 0) {
        orders = FALLBACK_ORDERS.filter((o) => o.userId === userId);
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Sipariş geçmişi başarıyla getirildi.",
        data: {
          orders,
          total: orders.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/orders/:id
   * Retrieves single order details by ID or Order Number.
   */
  async getOrderById(req, res, next) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";
      const { id } = req.params;

      let order = null;

      try {
        order = await Order.findById(id, isAdmin ? null : userId);
      } catch (dbErr) {
        order = null;
      }

      // Fallback search
      if (!order) {
        order =
          FALLBACK_ORDERS.find(
            (o) =>
              (o.id === id || o.orderNumber === id) && (isAdmin || o.userId === userId)
          ) || null;
      }

      if (!order) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Belirtilen sipariş bulunamadı veya bu siparişe erişim yetkiniz yok.",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Sipariş detayları başarıyla getirildi.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/orders/:id/cancel
   * Allows user to cancel an order if it is still in 'pending' or 'processing' state.
   */
  async cancelOrder(req, res, next) {
    try {
      const userId = req.user?.id;
      const isAdmin = req.user?.role === "admin";
      const { id } = req.params;

      let order = null;

      try {
        order = await Order.findById(id, isAdmin ? null : userId);
      } catch (dbErr) {
        order = null;
      }

      if (!order) {
        order =
          FALLBACK_ORDERS.find(
            (o) =>
              (o.id === id || o.orderNumber === id) && (isAdmin || o.userId === userId)
          ) || null;
      }

      if (!order) {
        return errorResponse(res, {
          statusCode: 404,
          message: "İptal edilecek sipariş bulunamadı.",
        });
      }

      if (order.status !== "pending" && order.status !== "processing") {
        return errorResponse(res, {
          statusCode: 400,
          message: `Bu sipariş '${order.status}' durumunda olduğu için iptal edilemez. Yalnızca hazırlanma aşamasındaki siparişler iptal edilebilir.`,
        });
      }

      // Update status to 'cancelled'
      let updatedOrder = null;
      try {
        updatedOrder = await Order.updateStatus(order.id, "cancelled");
      } catch (dbErr) {
        order.status = "cancelled";
        order.updatedAt = new Date().toISOString();
        updatedOrder = order;
      }

      if (order) {
        order.status = "cancelled";
      }

      // Revert product stocks
      const itemsToRevert = order.items || [];
      for (const item of itemsToRevert) {
        const prodId = item.productId || item.id;
        const qty = Number(item.quantity || 1);

        try {
          await Product.updateStock(prodId, qty);
        } catch (stockErr) {}

        const fallbackProd = FALLBACK_PRODUCTS.find((p) => p.id === prodId);
        if (fallbackProd) {
          fallbackProd.stock = fallbackProd.stock + qty;
        }
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Sipariş başarıyla iptal edildi ve ürün stokları iade edildi.",
        data: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: "cancelled",
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = OrderController;
