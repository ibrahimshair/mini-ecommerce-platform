import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const CART_LOCAL_STORAGE_KEY = "mini_ecommerce_cart_cache";
const COUPON_STORAGE_KEY = "mini_ecommerce_active_coupon";

const DEFAULT_SUMMARY = {
  itemCount: 0,
  subtotal: 0,
  shippingCost: 0,
  freeShippingThreshold: 150,
  remainingForFreeShipping: 150,
  isFreeShipping: false,
  grandTotal: 0,
};

// Available promotional coupons for checkout discounts
const PROMO_COUPONS = {
  INDIRIM10: { code: "INDIRIM10", rate: 0.1, type: "percent", label: "%10 Fırsat İndirimi", minSubtotal: 0 },
  INDIRIM20: { code: "INDIRIM20", rate: 0.2, type: "percent", label: "%20 Sezon İndirimi", minSubtotal: 200 },
  HOSGELDIN: { code: "HOSGELDIN", amount: 50, type: "fixed", label: "50 TL Hoş Geldin İndirimi", minSubtotal: 100 },
  KAROBEDAVA: { code: "KAROBEDAVA", type: "free_shipping", label: "Koşulsuz Ücretsiz Kargo", minSubtotal: 0 },
};

/**
 * Calculates cart summary totals including subtotal, shipping, and coupons.
 */
export function calculateLocalTotals(items = [], activeCoupon = null) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const FREE_SHIPPING_THRESHOLD = 150;
  const standardShipping = 29.9;

  let shippingCost =
    roundedSubtotal >= FREE_SHIPPING_THRESHOLD || roundedSubtotal === 0 ? 0 : standardShipping;

  if (activeCoupon?.type === "free_shipping" && roundedSubtotal > 0) {
    shippingCost = 0;
  }

  let discountAmount = 0;
  if (activeCoupon && roundedSubtotal >= (activeCoupon.minSubtotal || 0)) {
    if (activeCoupon.type === "percent") {
      discountAmount = Math.round(roundedSubtotal * activeCoupon.rate * 100) / 100;
    } else if (activeCoupon.type === "fixed") {
      discountAmount = Math.min(roundedSubtotal, activeCoupon.amount);
    }
  }

  const grandTotal = Math.max(0, Math.round((roundedSubtotal - discountAmount + shippingCost) * 100) / 100);
  const remainingForFreeShipping = Math.max(
    0,
    Math.round((FREE_SHIPPING_THRESHOLD - roundedSubtotal) * 100) / 100
  );

  return {
    itemCount,
    subtotal: roundedSubtotal,
    shippingCost,
    discountAmount,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    remainingForFreeShipping,
    isFreeShipping: shippingCost === 0 && roundedSubtotal > 0,
    grandTotal,
  };
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      const cached = localStorage.getItem(CART_LOCAL_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [activeCoupon, setActiveCoupon] = useState(() => {
    try {
      const cached = localStorage.getItem(COUPON_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  // Show user feedback toast
  const showToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3200);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Compute live summary totals
  const summary = useMemo(() => {
    return calculateLocalTotals(items, activeCoupon);
  }, [items, activeCoupon]);

  // Persist items to localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem(CART_LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist cart to localStorage:", e);
    }
  }, [items]);

  // Persist active coupon
  useEffect(() => {
    try {
      if (activeCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(activeCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Failed to persist coupon:", e);
    }
  }, [activeCoupon]);

  // Fetch cart from backend API
  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCart();
      if (res?.data?.items) {
        setItems(res.data.items);
      }
    } catch (err) {
      // Backend may be offline during development; graceful fallback to cached state
      console.info("[CartContext] Backend cart sync unavailable, using local cache.", err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh cart when auth user changes
  useEffect(() => {
    refreshCart();
  }, [currentUser, refreshCart]);

  /**
   * Add a product to the shopping cart
   */
  const addToCart = useCallback(
    async (product, quantity = 1) => {
      if (!product) return;
      const targetQty = Math.max(1, parseInt(quantity, 10) || 1);
      const productId = product.id || product.productId;

      // Stock check validation
      const availableStock = product.stock !== undefined ? product.stock : 99;
      const existing = items.find((i) => i.productId === productId || i.id === productId);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + targetQty > availableStock) {
        showToast(
          `Stok yetersiz! Mevcut stok: ${availableStock} adet (Sepetinizde zaten ${currentQty} adet var).`,
          "error"
        );
        return false;
      }

      setActionLoading(`add-${productId}`);

      try {
        // Try backend API first
        const res = await api.addToCart(productId, targetQty);
        if (res?.data?.items) {
          setItems(res.data.items);
          showToast(`"${product.name}" sepete eklendi!`, "success");
          return true;
        }
      } catch (err) {
        console.warn("[CartContext] Backend addToCart failed, applying locally:", err?.message);
      } finally {
        setActionLoading(null);
      }

      // Local fallback in case backend is offline
      setItems((prevItems) => {
        const index = prevItems.findIndex(
          (i) => i.productId === productId || i.id === productId
        );

        if (index > -1) {
          const updated = [...prevItems];
          const newQty = updated[index].quantity + targetQty;
          updated[index] = {
            ...updated[index],
            quantity: newQty,
            total: Math.round(Number(updated[index].price) * newQty * 100) / 100,
          };
          return updated;
        } else {
          const newItem = {
            id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            productId: productId,
            name: product.name,
            price: Number(product.price) || 0,
            image: product.imageUrl || product.image,
            imageUrl: product.imageUrl || product.image,
            stock: availableStock,
            quantity: targetQty,
            category: product.category,
            total: Math.round((Number(product.price) || 0) * targetQty * 100) / 100,
          };
          return [...prevItems, newItem];
        }
      });

      showToast(`"${product.name}" sepete eklendi!`, "success");
      return true;
    },
    [items, showToast]
  );

  /**
   * Update quantity of an item in cart
   */
  const updateQuantity = useCallback(
    async (itemId, newQuantity) => {
      const parsedQty = parseInt(newQuantity, 10);
      if (isNaN(parsedQty) || parsedQty < 1) {
        return removeFromCart(itemId);
      }

      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      if (item.stock && parsedQty > item.stock) {
        showToast(`Bu ürün için maksimum stok adedi: ${item.stock}`, "error");
        return false;
      }

      setActionLoading(`update-${itemId}`);

      try {
        const res = await api.updateCartItem(itemId, parsedQty);
        if (res?.data?.items) {
          setItems(res.data.items);
          return true;
        }
      } catch (err) {
        console.warn("[CartContext] Backend updateCartItem failed, applying locally:", err?.message);
      } finally {
        setActionLoading(null);
      }

      // Local update fallback
      setItems((prevItems) =>
        prevItems.map((it) =>
          it.id === itemId
            ? {
                ...it,
                quantity: parsedQty,
                total: Math.round(Number(it.price) * parsedQty * 100) / 100,
              }
            : it
        )
      );
      return true;
    },
    [items, showToast]
  );

  /**
   * Remove an item from cart
   */
  const removeFromCart = useCallback(
    async (itemId) => {
      const itemToRemove = items.find((i) => i.id === itemId);
      setActionLoading(`remove-${itemId}`);

      try {
        const res = await api.removeCartItem(itemId);
        if (res?.data?.items) {
          setItems(res.data.items);
          if (itemToRemove) {
            showToast(`"${itemToRemove.name}" sepetten çıkarıldı.`, "info");
          }
          return true;
        }
      } catch (err) {
        console.warn("[CartContext] Backend removeCartItem failed, applying locally:", err?.message);
      } finally {
        setActionLoading(null);
      }

      setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
      if (itemToRemove) {
        showToast(`"${itemToRemove.name}" sepetten çıkarıldı.`, "info");
      }
      return true;
    },
    [items, showToast]
  );

  /**
   * Clear all items in cart
   */
  const clearCart = useCallback(async () => {
    setActionLoading("clear");
    try {
      await api.clearCart();
    } catch (err) {
      console.warn("[CartContext] Backend clearCart failed, applying locally:", err?.message);
    } finally {
      setActionLoading(null);
    }

    setItems([]);
    setActiveCoupon(null);
    showToast("Sepetiniz temizlendi.", "info");
  }, [showToast]);

  /**
   * Apply promotional coupon
   */
  const applyCoupon = useCallback(
    (inputCode) => {
      const codeUpper = (inputCode || "").trim().toUpperCase();
      if (!codeUpper) {
        return { success: false, message: "Lütfen bir kupon kodu giriniz." };
      }

      const coupon = PROMO_COUPONS[codeUpper];
      if (!coupon) {
        return {
          success: false,
          message: "Geçersiz kupon kodu! ('INDIRIM10', 'INDIRIM20', 'HOSGELDIN' deneyebilirsiniz)",
        };
      }

      if (coupon.minSubtotal && summary.subtotal < coupon.minSubtotal) {
        return {
          success: false,
          message: `Bu kupon en az ${coupon.minSubtotal} TL alışverişlerde geçerlidir.`,
        };
      }

      setActiveCoupon(coupon);
      showToast(`Tebrikler! ${coupon.label} uygulandı.`, "success");
      return { success: true, message: `${coupon.label} uygulandı.` };
    },
    [summary.subtotal, showToast]
  );

  /**
   * Remove active promotional coupon
   */
  const removeCoupon = useCallback(() => {
    setActiveCoupon(null);
    showToast("Kupon kaldırıldı.", "info");
  }, [showToast]);

  const [stockWarnings, setStockWarnings] = useState([]);

  /**
   * Validates cart against real-time backend stock levels and adjusts quantities if needed
   */
  const validateLiveStock = useCallback(async () => {
    setActionLoading("validate-stock");
    try {
      const res = await api.validateCart();
      if (res?.data) {
        if (res.data.items) {
          setItems(res.data.items);
        }
        if (res.data.warnings && res.data.warnings.length > 0) {
          setStockWarnings(res.data.warnings);
          showToast(
            `Stok Uyarısı: Sepetinizdeki ürünlerin güncel stok durumu kontrol edildi.`,
            "error"
          );
        } else {
          setStockWarnings([]);
          showToast("Tüm sepet ürünleri için güncel stoklar doğrulandı.", "success");
        }
        return res.data;
      }
    } catch (err) {
      console.warn("[CartContext] Live stock validation error:", err?.message);
    } finally {
      setActionLoading(null);
    }
    return { isValid: true, warnings: [] };
  }, [showToast]);

  /**
   * Helper: Get quantity of a product currently in the cart
   */
  const getItemQuantityInCart = useCallback(
    (productId) => {
      const found = items.find((i) => i.productId === productId || i.id === productId);
      return found ? found.quantity : 0;
    },
    [items]
  );

  /**
   * Helper: Calculate remaining purchasable stock considering existing cart quantity
   */
  const getRemainingStock = useCallback(
    (productId, totalStock) => {
      const inCart = getItemQuantityInCart(productId);
      const stock = totalStock !== undefined ? totalStock : 99;
      return Math.max(0, stock - inCart);
    },
    [getItemQuantityInCart]
  );

  const value = useMemo(
    () => ({
      items,
      summary,
      itemCount: summary.itemCount,
      loading,
      actionLoading,
      activeCoupon,
      toast,
      stockWarnings,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      refreshCart,
      validateLiveStock,
      getItemQuantityInCart,
      getRemainingStock,
      showToast,
      hideToast,
    }),
    [
      items,
      summary,
      loading,
      actionLoading,
      activeCoupon,
      toast,
      stockWarnings,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      refreshCart,
      validateLiveStock,
      getItemQuantityInCart,
      getRemainingStock,
      showToast,
      hideToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export default CartContext;
