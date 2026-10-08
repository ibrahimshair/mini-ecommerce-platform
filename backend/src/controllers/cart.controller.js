const Cart = require("../models/cart.model");
const Product = require("../models/product.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const { FALLBACK_PRODUCTS } = require("../utils/dummyData");

// In-memory fallback carts for guest & offline demo sessions
const FALLBACK_CARTS = new Map();

/**
 * Calculates cart subtotal, shipping cost, and totals.
 */
function calculateCartTotals(items = []) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const FREE_SHIPPING_THRESHOLD = 150;
  const standardShipping = 29.9;
  const shippingCost = roundedSubtotal >= FREE_SHIPPING_THRESHOLD || roundedSubtotal === 0 ? 0 : standardShipping;
  const grandTotal = Math.round((roundedSubtotal + shippingCost) * 100) / 100;
  const remainingForFreeShipping = Math.max(0, Math.round((FREE_SHIPPING_THRESHOLD - roundedSubtotal) * 100) / 100);

  return {
    itemCount,
    subtotal: roundedSubtotal,
    shippingCost,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    remainingForFreeShipping,
    isFreeShipping: shippingCost === 0 && roundedSubtotal > 0,
    grandTotal,
  };
}

/**
 * Resolves product information (DB or fallback dummy data)
 */
async function resolveProduct(productId) {
  try {
    const product = await Product.findById(productId);
    if (product) return product;
  } catch (err) {}

  return FALLBACK_PRODUCTS.find((p) => p.id === productId || p.slug === productId) || null;
}

const CartController = {
  /**
   * Helper to get user cart key or ID
   */
  getCartKey(req) {
    if (req.user?.id) return `user_${req.user.id}`;
    const sessionId = req.headers["x-session-id"] || req.query.sessionId || "guest_default";
    return `session_${sessionId}`;
  },

  /**
   * GET /api/cart
   * Retrieves active shopping cart with calculated totals.
   */
  async getCart(req, res, next) {
    try {
      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;

      let items = [];

      // Try database if user is authenticated with DB connection
      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            const dbItems = await Cart.getCartItems(cart.id);
            if (Array.isArray(dbItems)) {
              items = dbItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                name: item.name,
                price: Number(item.price),
                image: item.image,
                imageUrl: item.image,
                stock: Number(item.stock),
                quantity: Number(item.quantity),
                total: Math.round(Number(item.price) * Number(item.quantity) * 100) / 100,
              }));
            }
          }
        } catch (dbErr) {
          // Fallback to in-memory cart
          items = FALLBACK_CARTS.get(cartKey) || [];
        }
      } else {
        items = FALLBACK_CARTS.get(cartKey) || [];
      }

      const summary = calculateCartTotals(items);

      return successResponse(res, {
        statusCode: 200,
        message: "Alışveriş sepeti başarıyla getirildi.",
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/cart/items
   * Adds an item to the shopping cart or increments quantity.
   */
  async addItem(req, res, next) {
    try {
      const { productId, quantity = 1 } = req.body;
      const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);

      if (!productId) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Lütfen eklenecek ürünün ID'sini belirtiniz.",
          errors: [{ field: "productId", message: "Ürün ID zorunludur." }],
        });
      }

      // Check product and stock
      const product = await resolveProduct(productId);
      if (!product) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Sepete eklenmek istenen ürün bulunamadı.",
        });
      }

      if (product.stock < parsedQty) {
        return errorResponse(res, {
          statusCode: 400,
          message: `Yetersiz stok! Mevcut stok: ${product.stock} adet.`,
          errors: [{ field: "quantity", message: "Talep edilen miktar mevcut stoğu aşıyor." }],
        });
      }

      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;
      let items = [];

      let handledInDb = false;
      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            await Cart.addItem(cart.id, product.id, parsedQty);
            const dbItems = await Cart.getCartItems(cart.id);
            items = dbItems.map((item) => ({
              id: item.id,
              productId: item.productId,
              name: item.name,
              price: Number(item.price),
              image: item.image,
              imageUrl: item.image,
              stock: Number(item.stock),
              quantity: Number(item.quantity),
              total: Math.round(Number(item.price) * Number(item.quantity) * 100) / 100,
            }));
            handledInDb = true;
          }
        } catch (dbErr) {
          handledInDb = false;
        }
      }

      if (!handledInDb) {
        let currentItems = FALLBACK_CARTS.get(cartKey) || [];
        const existingIndex = currentItems.findIndex(
          (i) => i.productId === product.id || i.id === product.id
        );

        if (existingIndex > -1) {
          const newTotalQty = currentItems[existingIndex].quantity + parsedQty;
          if (newTotalQty > product.stock) {
            return errorResponse(res, {
              statusCode: 400,
              message: `Sepetteki miktar ve eklenen toplam stok sınırını aşıyor (${product.stock} adet).`,
            });
          }
          currentItems[existingIndex].quantity = newTotalQty;
          currentItems[existingIndex].total =
            Math.round(currentItems[existingIndex].price * newTotalQty * 100) / 100;
        } else {
          currentItems.push({
            id: `item-${Date.now()}`,
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.imageUrl || product.image,
            imageUrl: product.imageUrl || product.image,
            stock: Number(product.stock),
            quantity: parsedQty,
            total: Math.round(Number(product.price) * parsedQty * 100) / 100,
          });
        }

        FALLBACK_CARTS.set(cartKey, currentItems);
        items = currentItems;
      }

      const summary = calculateCartTotals(items);

      return successResponse(res, {
        statusCode: 200,
        message: `${product.name} sepete eklendi.`,
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/cart/items/:id
   * Updates an item's quantity in the cart.
   */
  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const parsedQty = parseInt(quantity, 10);

      if (isNaN(parsedQty)) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Geçerli bir miktar belirtiniz.",
        });
      }

      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;
      let items = [];

      // If quantity <= 0, remove item
      if (parsedQty <= 0) {
        return CartController.removeItem(req, res, next);
      }

      let handledInDb = false;
      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            const item = await Cart.getItemById(cart.id, id);
            if (item && item.stock < parsedQty) {
              return errorResponse(res, {
                statusCode: 400,
                message: `Stok yetersiz! Mevcut stok: ${item.stock} adet.`,
              });
            }
            await Cart.updateItemQuantity(cart.id, id, parsedQty);
            const dbItems = await Cart.getCartItems(cart.id);
            items = dbItems.map((it) => ({
              id: it.id,
              productId: it.productId,
              name: it.name,
              price: Number(it.price),
              image: it.image,
              imageUrl: it.image,
              stock: Number(it.stock),
              quantity: Number(it.quantity),
              total: Math.round(Number(it.price) * Number(it.quantity) * 100) / 100,
            }));
            handledInDb = true;
          }
        } catch (dbErr) {
          handledInDb = false;
        }
      }

      if (!handledInDb) {
        let currentItems = FALLBACK_CARTS.get(cartKey) || [];
        const index = currentItems.findIndex((it) => it.id === id || it.productId === id);

        if (index === -1) {
          return errorResponse(res, {
            statusCode: 404,
            message: "Sepet ürünü bulunamadı.",
          });
        }

        if (currentItems[index].stock < parsedQty) {
          return errorResponse(res, {
            statusCode: 400,
            message: `Stok yetersiz! Mevcut stok: ${currentItems[index].stock} adet.`,
          });
        }

        currentItems[index].quantity = parsedQty;
        currentItems[index].total =
          Math.round(currentItems[index].price * parsedQty * 100) / 100;

        FALLBACK_CARTS.set(cartKey, currentItems);
        items = currentItems;
      }

      const summary = calculateCartTotals(items);

      return successResponse(res, {
        statusCode: 200,
        message: "Ürün miktarı güncellendi.",
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/cart/items/:id
   * Removes an item from the cart.
   */
  async removeItem(req, res, next) {
    try {
      const { id } = req.params;
      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;
      let items = [];

      let handledInDb = false;
      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            await Cart.removeItem(cart.id, id);
            const dbItems = await Cart.getCartItems(cart.id);
            items = dbItems.map((it) => ({
              id: it.id,
              productId: it.productId,
              name: it.name,
              price: Number(it.price),
              image: it.image,
              imageUrl: it.image,
              stock: Number(it.stock),
              quantity: Number(it.quantity),
              total: Math.round(Number(it.price) * Number(it.quantity) * 100) / 100,
            }));
            handledInDb = true;
          }
        } catch (dbErr) {
          handledInDb = false;
        }
      }

      if (!handledInDb) {
        let currentItems = FALLBACK_CARTS.get(cartKey) || [];
        currentItems = currentItems.filter((it) => it.id !== id && it.productId !== id);
        FALLBACK_CARTS.set(cartKey, currentItems);
        items = currentItems;
      }

      const summary = calculateCartTotals(items);

      return successResponse(res, {
        statusCode: 200,
        message: "Ürün sepetten kaldırıldı.",
        data: {
          items,
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/cart
   * Clears all items from the shopping cart.
   */
  async clearCart(req, res, next) {
    try {
      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;

      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            await Cart.clearCart(cart.id);
          }
        } catch (dbErr) {}
      }

      FALLBACK_CARTS.set(cartKey, []);
      const summary = calculateCartTotals([]);

      return successResponse(res, {
        statusCode: 200,
        message: "Sepetiniz tamamen boşaltıldı.",
        data: {
          items: [],
          summary,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/cart/validate
   * Validates cart items against live stock levels, adjusts quantities if exceeded,
   * detects out-of-stock items, and returns warnings and updated totals.
   */
  async validateStock(req, res, next) {
    try {
      const cartKey = CartController.getCartKey(req);
      const userId = req.user?.id;
      let items = [];

      if (userId) {
        try {
          const cart = await Cart.getOrCreateCart(userId);
          if (cart?.id) {
            const dbItems = await Cart.getCartItems(cart.id);
            if (Array.isArray(dbItems)) {
              items = dbItems.map((item) => ({
                id: item.id,
                productId: item.productId,
                name: item.name,
                price: Number(item.price),
                image: item.image,
                imageUrl: item.image,
                stock: Number(item.stock),
                quantity: Number(item.quantity),
                total: Math.round(Number(item.price) * Number(item.quantity) * 100) / 100,
              }));
            }
          }
        } catch (dbErr) {
          items = FALLBACK_CARTS.get(cartKey) || [];
        }
      } else {
        items = FALLBACK_CARTS.get(cartKey) || [];
      }

      const warnings = [];
      let isModified = false;
      const verifiedItems = [];

      for (const item of items) {
        const product = await resolveProduct(item.productId);
        const liveStock = product ? Number(product.stock) : 0;

        if (!product || liveStock <= 0) {
          warnings.push({
            productId: item.productId,
            name: item.name,
            type: "out_of_stock",
            message: `"${item.name}" stoklarımızda tükendi.`,
          });
          verifiedItems.push({
            ...item,
            stock: 0,
            isOutOfStock: true,
          });
        } else if (item.quantity > liveStock) {
          warnings.push({
            productId: item.productId,
            name: item.name,
            type: "quantity_adjusted",
            previousQuantity: item.quantity,
            newQuantity: liveStock,
            message: `"${item.name}" için mevcut stok (${liveStock} adet) talep edilen miktarın altında kaldığı için sepet adedi güncellendi.`,
          });
          isModified = true;
          item.quantity = liveStock;
          item.stock = liveStock;
          item.total = Math.round(Number(item.price) * liveStock * 100) / 100;

          if (userId) {
            try {
              const cart = await Cart.getOrCreateCart(userId);
              if (cart?.id) {
                await Cart.updateItemQuantity(cart.id, item.id, liveStock);
              }
            } catch (err) {}
          }

          verifiedItems.push({
            ...item,
            isAdjusted: true,
            isOutOfStock: false,
          });
        } else {
          verifiedItems.push({
            ...item,
            stock: liveStock,
            isOutOfStock: false,
          });
        }
      }

      if (isModified && !userId) {
        FALLBACK_CARTS.set(cartKey, verifiedItems);
      }

      const summary = calculateCartTotals(verifiedItems);

      return successResponse(res, {
        statusCode: 200,
        message:
          warnings.length > 0
            ? "Sepet stok kontrolü tamamlandı, bazı stok uyarıları mevcut."
            : "Tüm sepet ürünleri için güncel stok doğrulandı.",
        data: {
          items: verifiedItems,
          summary,
          warnings,
          isValid: warnings.length === 0,
          isModified,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

CartController.FALLBACK_CARTS = FALLBACK_CARTS;
CartController.calculateCartTotals = calculateCartTotals;

module.exports = CartController;

