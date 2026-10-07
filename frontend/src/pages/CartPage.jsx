import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatCurrency } from "../utils/formatters";
import "./CartPage.css";

// Sample recommended items for empty or active cart upsell
const RECOMMENDED_ITEMS = [
  {
    id: "p1",
    productId: "p1",
    name: "Kablosuz ANC Kulak Üstü Kulaklık Pro",
    price: 2499.0,
    oldPrice: 3199.0,
    category: "Elektronik",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    stock: 24,
  },
  {
    id: "p2",
    productId: "p2",
    name: "Akıllı GPS Spor Saati V2",
    price: 3899.0,
    oldPrice: 4500.0,
    category: "Elektronik",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    stock: 15,
  },
  {
    id: "p3",
    productId: "p3",
    name: "Minimalist Su Geçirmez Laptop Sırt Çantası",
    price: 1299.0,
    oldPrice: 1650.0,
    category: "Giyim & Moda",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    stock: 40,
  },
  {
    id: "p4",
    productId: "p4",
    name: "Mekanik RGB Kompakt Klavye (%75)",
    price: 1849.0,
    oldPrice: 2200.0,
    category: "Elektronik",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    stock: 12,
  },
];

function CartPage() {
  const {
    items,
    summary,
    itemCount,
    actionLoading,
    activeCoupon,
    stockWarnings,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    addToCart,
    validateLiveStock,
  } = useCart();

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Validate live stock on page mount
  useEffect(() => {
    if (items.length > 0) {
      validateLiveStock();
    }
  }, []);

  const hasOutOfStockItems = useMemo(() => {
    return items.some((item) => item.isOutOfStock || (item.stock !== undefined && item.stock <= 0));
  }, [items]);

  // Free shipping progress percentage (capped at 100%)
  const freeShippingProgress = useMemo(() => {
    if (summary.isFreeShipping) return 100;
    const pct = Math.min(100, Math.round((summary.subtotal / summary.freeShippingThreshold) * 100));
    return isNaN(pct) ? 0 : pct;
  }, [summary]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError("");
    if (!couponInput.trim()) {
      setCouponError("Lütfen bir kupon kodu giriniz.");
      return;
    }
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput("");
    }
  };

  const handleStartCheckout = () => {
    if (hasOutOfStockItems) {
      return;
    }
    if (!currentUser) {
      navigate("/login?redirect=/cart");
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  return (
    <div className="cart-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="cart-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Ana Sayfa</Link>
          <span className="crumb-sep">/</span>
          <span className="crumb-current">Sepetim</span>
        </nav>

        {/* Page Header */}
        <div className="cart-header">
          <div className="cart-header-title-wrap">
            <h1 className="cart-page-title">Alışveriş Sepetim</h1>
            <span className="cart-items-counter-badge">{itemCount} Ürün</span>
          </div>

          {items.length > 0 && (
            <div className="cart-header-actions">
              <button
                type="button"
                className="btn-validate-stock"
                onClick={() => validateLiveStock()}
                disabled={actionLoading === "validate-stock"}
                title="Güncel ürün stoklarını kontrol et"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={actionLoading === "validate-stock" ? "spin-icon" : ""}
                >
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
                {actionLoading === "validate-stock" ? "Doğrulanıyor..." : "Stokları Doğrula"}
              </button>

              <button
                type="button"
                className="btn-clear-cart"
                onClick={() => setIsClearModalOpen(true)}
                disabled={actionLoading === "clear"}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Sepeti Temizle
              </button>
            </div>
          )}
        </div>

        {/* Live Stock Alert Banner */}
        {stockWarnings && stockWarnings.length > 0 && (
          <div className="cart-stock-warnings-card" role="alert">
            <div className="stock-warning-title">
              <span>⚠️</span>
              <strong>Canlı Stok Güncellemesi Bildirimi</strong>
            </div>
            <ul className="stock-warning-list">
              {stockWarnings.map((w, idx) => (
                <li key={idx}>{w.message}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Empty Cart State */}
        {items.length === 0 ? (
          <div className="empty-cart-card">
            <div className="empty-cart-icon-wrap">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
            </div>
            <h2 className="empty-cart-heading">Sepetinizde Ürün Bulunmuyor</h2>
            <p className="empty-cart-subtext">
              Alışveriş sepetiniz henüz boş. Binlerce kaliteli ürün arasından dilediğinizi
              seçip avantajlı fiyatlarla hemen sepetinize ekleyebilirsiniz.
            </p>
            <div className="empty-cart-actions">
              <Link to="/products" className="btn btn-primary btn-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m5 12 7-7 7 7" />
                  <path d="M12 19V5" />
                </svg>
                Alışverişe Başla
              </Link>
            </div>

            {/* Recommendations in Empty State */}
            <div className="cart-recommendations-section">
              <div className="rec-section-header">
                <h3>Sizin İçin Seçilen Popüler Ürünler</h3>
                <p>En çok satan modellerimize göz atın:</p>
              </div>
              <div className="rec-grid">
                {RECOMMENDED_ITEMS.map((prod) => (
                  <div key={prod.id} className="rec-item-card">
                    <img src={prod.image} alt={prod.name} className="rec-item-img" />
                    <div className="rec-item-info">
                      <span className="rec-item-cat">{prod.category}</span>
                      <h4 className="rec-item-name">{prod.name}</h4>
                      <div className="rec-item-price">{formatCurrency(prod.price)}</div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline rec-add-btn"
                        onClick={() => addToCart(prod, 1)}
                      >
                        Sepete Ekle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Cart with 2-Column Layout */
          <div className="cart-layout">
            {/* Left Items Column */}
            <div className="cart-main">
              {/* Free Shipping Notification Bar */}
              <div
                className={`free-shipping-card ${
                  summary.isFreeShipping ? "is-achieved" : "is-progressing"
                }`}
              >
                <div className="free-shipping-icon">
                  {summary.isFreeShipping ? "🎉" : "🚚"}
                </div>
                <div className="free-shipping-body">
                  <div className="free-shipping-text">
                    {summary.isFreeShipping ? (
                      <strong>Tebrikler! Kargo Ücreti Bizden!</strong>
                    ) : (
                      <>
                        <strong>{formatCurrency(summary.freeShippingThreshold)}</strong> üzeri
                        kargo bedava! Ücretsiz kargo için sepetinize{" "}
                        <span className="free-shipping-highlight">
                          {formatCurrency(summary.remainingForFreeShipping)}
                        </span>{" "}
                        tutarında ürün ekleyin.
                      </>
                    )}
                  </div>
                  <div className="shipping-progress-track">
                    <div
                      className="shipping-progress-bar"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="cart-items-list">
                {items.map((item) => {
                  const isUpdating = actionLoading === `update-${item.id}`;
                  const isRemoving = actionLoading === `remove-${item.id}`;
                  const isMaxStock = item.stock && item.quantity >= item.stock;

                  return (
                    <div
                      key={item.id}
                      className={`cart-item-card ${isRemoving ? "is-removing" : ""}`}
                    >
                      {/* Product Image Thumbnail */}
                      <div className="cart-item-img-wrap">
                        <Link to={`/products/${item.productId || item.id}`}>
                          <img
                            src={
                              item.image ||
                              item.imageUrl ||
                              "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
                            }
                            alt={item.name}
                            className="cart-item-img"
                          />
                        </Link>
                      </div>

                      {/* Product Metadata */}
                      <div className="cart-item-details">
                        {item.category && (
                          <span className="cart-item-cat-tag">{item.category}</span>
                        )}
                        <h3 className="cart-item-name">
                          <Link to={`/products/${item.productId || item.id}`}>
                            {item.name}
                          </Link>
                        </h3>

                        <div className="cart-item-meta-badges">
                          {item.isOutOfStock || (item.stock !== undefined && item.stock <= 0) ? (
                            <span className="stock-danger-badge">
                              ⚠️ Tükendi
                            </span>
                          ) : item.isAdjusted ? (
                            <span className="stock-adjusted-badge">
                              🔄 Stok Güncellendi
                            </span>
                          ) : item.stock && item.stock <= 5 ? (
                            <span className="stock-warning-badge">
                              🔥 Son {item.stock} Ürün!
                            </span>
                          ) : (
                            <span className="stock-ok-badge">✓ Stokta Var</span>
                          )}
                        </div>

                        <div className="cart-item-unit-price">
                          Birim Fiyat: <strong>{formatCurrency(item.price)}</strong>
                        </div>
                      </div>

                      {/* Quantity Selector Controls */}
                      <div className="cart-item-quantity-box">
                        <div className="cart-qty-picker">
                          <button
                            type="button"
                            className="cart-qty-btn"
                            disabled={item.quantity <= 1 || isUpdating || item.isOutOfStock}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            title="Azalt"
                            aria-label="Azalt"
                          >
                            &minus;
                          </button>
                          <span className="cart-qty-val">
                            {isUpdating ? "..." : item.quantity}
                          </span>
                          <button
                            type="button"
                            className="cart-qty-btn"
                            disabled={isMaxStock || isUpdating || item.isOutOfStock}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            title={
                              item.isOutOfStock
                                ? "Tükendi"
                                : isMaxStock
                                ? "Maksimum stok miktarına ulaşıldı"
                                : "Artır"
                            }
                            aria-label="Artır"
                          >
                            +
                          </button>
                        </div>
                        {isMaxStock && !item.isOutOfStock && (
                          <span className="max-stock-notice">Maksimum adet</span>
                        )}
                      </div>

                      {/* Line Item Total */}
                      <div className="cart-item-total-box">
                        <span className="cart-line-total-label">Toplam:</span>
                        <span className="cart-line-total-val">
                          {formatCurrency(
                            item.total ||
                              Math.round(item.price * item.quantity * 100) / 100
                          )}
                        </span>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        className="btn-remove-item"
                        title="Ürünü sepetten çıkar"
                        aria-label="Ürünü sepetten çıkar"
                        disabled={isRemoving}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Actions below Items List */}
              <div className="cart-footer-actions">
                <Link to="/products" className="btn btn-outline">
                  &larr; Alışverişe Devam Et
                </Link>
              </div>
            </div>

            {/* Right Sticky Summary Sidebar */}
            <aside className="cart-sidebar">
              <div className="order-summary-card">
                <h2 className="summary-title">Sipariş Özeti</h2>

                {/* Breakdown Rows */}
                <div className="summary-rows">
                  <div className="summary-row">
                    <span className="summary-label">Ürünler Toplamı ({itemCount} Adet)</span>
                    <span className="summary-val">{formatCurrency(summary.subtotal)}</span>
                  </div>

                  <div className="summary-row">
                    <span className="summary-label">Kargo Ücreti</span>
                    <span className="summary-val">
                      {summary.isFreeShipping ? (
                        <span className="free-shipping-tag">Ücretsiz</span>
                      ) : (
                        formatCurrency(summary.shippingCost)
                      )}
                    </span>
                  </div>

                  {/* Active Discount Coupon Row */}
                  {activeCoupon && summary.discountAmount > 0 && (
                    <div className="summary-row summary-discount-row">
                      <div className="discount-label-wrap">
                        <span className="summary-label">
                          🎁 {activeCoupon.label || "İndirim Kuponu"}
                        </span>
                        <button
                          type="button"
                          className="btn-remove-coupon"
                          onClick={removeCoupon}
                          title="Kuponu Kaldır"
                        >
                          (Kaldır)
                        </button>
                      </div>
                      <span className="discount-val">
                        -{formatCurrency(summary.discountAmount)}
                      </span>
                    </div>
                  )}

                  <hr className="summary-divider" />

                  {/* Grand Total */}
                  <div className="summary-row summary-grand-total">
                    <div>
                      <span className="grand-total-label">Ödenecek Tutar</span>
                      <span className="vat-notice">KDV Dahil</span>
                    </div>
                    <span className="grand-total-val">
                      {formatCurrency(summary.grandTotal)}
                    </span>
                  </div>
                </div>

                {/* Promotional Coupon Input Box */}
                {!activeCoupon ? (
                  <form className="coupon-form" onSubmit={handleApplyCoupon}>
                    <div className="coupon-input-group">
                      <input
                        type="text"
                        placeholder="Kupon Kodu (örn. INDIRIM10)"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className={`coupon-input ${couponError ? "has-error" : ""}`}
                      />
                      <button type="submit" className="btn btn-primary btn-coupon-apply">
                        Uygula
                      </button>
                    </div>
                    {couponError && <p className="coupon-error-text">{couponError}</p>}
                    <p className="coupon-hint-text">
                      💡 İpucu: <strong>INDIRIM10</strong> (%10) veya <strong>HOSGELDIN</strong> (50 TL) kodunu deneyin.
                    </p>
                  </form>
                ) : (
                  <div className="applied-coupon-pill">
                    <span>
                      ✓ <strong>{activeCoupon.code}</strong> kuponu uygulandı.
                    </span>
                    <button
                      type="button"
                      className="pill-remove-btn"
                      onClick={removeCoupon}
                    >
                      &times;
                    </button>
                  </div>
                )}

                {/* Checkout Primary Action Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-checkout"
                  onClick={handleStartCheckout}
                  disabled={hasOutOfStockItems}
                  title={
                    hasOutOfStockItems
                      ? "Sepetinizde tükenmiş ürün bulunduğu için sipariş oluşturulamaz"
                      : "Siparişi Tamamla"
                  }
                >
                  <span>Siparişi Tamamla</span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="checkout-arrow"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>

                {hasOutOfStockItems ? (
                  <p className="cart-out-of-stock-checkout-warning">
                    ⚠️ Sepetinizde tükenmiş ürün bulunmaktadır. Siparişi tamamlayabilmek için lütfen bu ürünleri sepetten çıkarınız.
                  </p>
                ) : !currentUser ? (
                  <p className="guest-checkout-notice">
                    🔒 Siparişinizi tamamlamak için giriş yapmanız istenecektir.
                  </p>
                ) : null}

                {/* Trust Badges */}
                <div className="summary-trust-badges">
                  <div className="trust-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>256-Bit SSL Güvenli Alışveriş</span>
                  </div>
                  <div className="trust-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="16" height="13" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                    <span>Hızlı & Sigortalı Teslimat</span>
                  </div>
                  <div className="trust-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span>14 Gün Koşulsuz Kolay İade</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* Clear Cart Confirmation Modal */}
        {isClearModalOpen && (
          <div
            className="cart-modal-backdrop"
            onClick={() => setIsClearModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="cart-confirm-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Sepeti Temizlemek İstiyor musunuz?</h3>
              <p>
                Sepetinizdeki tüm ürünler ve uygulanan indirim kuponu kaldırılacaktır.
                Bu işlem geri alınamaz.
              </p>
              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsClearModalOpen(false)}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    clearCart();
                    setIsClearModalOpen(false);
                  }}
                >
                  Evet, Sepeti Temizle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Modal (Milestone 4 Preview / Milestone 5 Order System Preparation) */}
        {isCheckoutModalOpen && (
          <div
            className="cart-modal-backdrop"
            onClick={() => setIsCheckoutModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="checkout-preview-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="checkout-modal-header">
                <h3>🚀 Sipariş Tamamlama Önizlemesi</h3>
                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={() => setIsCheckoutModalOpen(false)}
                >
                  &times;
                </button>
              </div>

              <div className="checkout-modal-content">
                <div className="checkout-success-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                </div>

                <h4>Sepetiniz Sipariş Oluşturmaya Hazır!</h4>
                <p>
                  Sayın <strong>{currentUser?.name || "Kullanıcı"}</strong>, toplam{" "}
                  <strong>{itemCount} ürün</strong> ({formatCurrency(summary.grandTotal)})
                  için sepet hesaplamaları ve stok doğrulama adımları başarıyla tamamlandı.
                </p>

                <div className="checkout-details-summary">
                  <div className="chk-row">
                    <span>Teslimat Adresi:</span>
                    <strong>{currentUser?.email ? "Kayıtlı Varsayılan Adres" : "İstanbul, Türkiye"}</strong>
                  </div>
                  <div className="chk-row">
                    <span>Ödeme Yöntemi:</span>
                    <strong>Kredi Kartı / 3D Secure</strong>
                  </div>
                  <div className="chk-row">
                    <span>Ödenecek Tutar:</span>
                    <strong className="chk-amount">{formatCurrency(summary.grandTotal)}</strong>
                  </div>
                </div>

                <div className="milestone-notice-box">
                  <span className="notice-tag">Milestone 5 Önizleme</span>
                  <p>
                    Kalıcı sipariş veritabanı kayıtları (`POST /api/orders`) ve yönetici sipariş
                    takibi <strong>5. Hafta (Gün 21–25)</strong> kapsamında entegre edilecektir.
                  </p>
                </div>
              </div>

              <div className="modal-btn-row">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsCheckoutModalOpen(false)}
                >
                  Sepete Dön
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setIsCheckoutModalOpen(false);
                    navigate("/profile");
                  }}
                >
                  Profilim & Adreslerime Git
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;
