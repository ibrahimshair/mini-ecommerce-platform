import { useState, useEffect } from "react";
import { formatCurrency } from "../utils/formatters";
import { useCart } from "../context/CartContext";
import "./ProductDetailModal.css";

function ProductDetailModal({ product, onClose, onAddToCart }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const {
    id,
    name,
    category,
    price,
    oldPrice,
    rating = 4.8,
    reviewCount = 50,
    image,
    discount,
    description,
    stock = 15,
  } = product;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < stock) setQuantity(quantity + 1);
  };

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity);
    } else {
      addToCart(product, quantity);
    }
    onClose();
  };

  const isOutOfStock = stock <= 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Kapat"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="modal-body">
          {/* Product Image Column */}
          <div className="modal-image-col">
            <div className="modal-image-wrapper">
              {discount && (
                <span className="modal-discount-badge">%{discount} İndirim</span>
              )}
              <img src={image} alt={name} className="modal-image" />
            </div>
          </div>

          {/* Product Information Column */}
          <div className="modal-info-col">
            <div className="modal-header-meta">
              <span className="modal-category">{category}</span>
              <span className={`modal-stock-badge ${isOutOfStock ? "out" : "in-stock"}`}>
                {isOutOfStock ? "✕ Tükendi" : `✓ Stokta Var (${stock} adet)`}
              </span>
            </div>

            <h2 className="modal-title">{name}</h2>

            <div className="modal-rating">
              <div className="stars">
                {"★".repeat(Math.floor(rating))}
                {"☆".repeat(5 - Math.floor(rating))}
              </div>
              <span className="rating-score">{rating}</span>
              <span className="rating-divider">•</span>
              <span className="modal-review-count">{reviewCount} Değerlendirme</span>
            </div>

            <div className="modal-price-box">
              <span className="modal-price">{formatCurrency(price)}</span>
              {oldPrice && (
                <span className="modal-old-price">{formatCurrency(oldPrice)}</span>
              )}
            </div>

            <p className="modal-description">
              {description ||
                "Yüksek kaliteli malzemeler ve modern işçilikle üretilmiş bu ürün, günlük kullanımda ve özel anlarınızda en üst düzey konfor ve şıklık sunar. Orijinal kutusunda ve resmi distribütör garantisiyle teslim edilir."}
            </p>

            <div className="modal-actions-area">
              <div className="quantity-selector">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={handleDecrease}
                  disabled={quantity <= 1 || isOutOfStock}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={handleIncrease}
                  disabled={quantity >= stock || isOutOfStock}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-modal-cart"
                onClick={handleAdd}
                disabled={isOutOfStock}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="cart-icon"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                {isOutOfStock ? "Stokta Yok" : `Sepete Ekle (${formatCurrency(price * quantity)})`}
              </button>
            </div>

            <div className="modal-features-list">
              <div className="modal-feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span>2 Yıl Resmi Distribütör Garantisi</span>
              </div>
              <div className="modal-feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <span>Saat 16:00'a Kadar Verilen Siparişlerde Aynı Gün Ücretsiz Kargo</span>
              </div>
              <div className="modal-feature-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>14 Gün Koşulsuz İade ve Değişim Güvencesi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailModal;
