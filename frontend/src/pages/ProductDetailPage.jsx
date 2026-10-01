import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProductDetailPage.css";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getProductById(id)
      .then((res) => {
        if (isMounted) {
          if (res?.data) {
            setProduct(res.data);
          } else {
            setError("Ürün bilgisi bulunamadı.");
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Ürün yüklenirken bir hata oluştu.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = () => {
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2000);
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container detail-loading-container">
          <div className="loading-spinner" />
          <p>Ürün detayları yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container detail-error-container">
          <h2>Ürün Bulunamadı</h2>
          <p>{error || "Aradığınız ürün katalogda yer almıyor."}</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Ürün Kataloğuna Dön
          </Link>
        </div>
      </div>
    );
  }

  const discountPercent =
    product.oldPrice && product.oldPrice > product.price
      ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
      : null;

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="detail-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Ana Sayfa</Link>
          <span className="crumb-sep">/</span>
          <Link to="/products">Ürünler</Link>
          <span className="crumb-sep">/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
                {product.category}
              </Link>
              <span className="crumb-sep">/</span>
            </>
          )}
          <span className="crumb-current">{product.name}</span>
        </nav>

        <div className="product-detail-layout">
          {/* Product Media Gallery */}
          <div className="detail-media">
            <div className="detail-image-card">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="detail-main-image"
                loading="lazy"
              />
              {discountPercent && (
                <span className="detail-badge-discount">%{discountPercent} İNDİRİM</span>
              )}
            </div>
          </div>

          {/* Product Purchasing Info */}
          <div className="detail-info">
            <div className="detail-header">
              {product.category && (
                <span className="detail-category-tag">{product.category}</span>
              )}
              <h1 className="detail-title">{product.name}</h1>
              
              <div className="detail-rating-row">
                <div className="detail-stars">
                  {"★".repeat(Math.floor(product.rating || 5))}
                  {"☆".repeat(5 - Math.floor(product.rating || 5))}
                </div>
                <span className="detail-rating-num">{product.rating || 5.0}</span>
                <span className="detail-review-count">({product.reviewCount || 12} değerlendirme)</span>
                <span className="detail-stock-pill in-stock">
                  {product.stock > 0 ? `✓ Stokta Var (${product.stock} Adet)` : "Stokta Yok"}
                </span>
              </div>
            </div>

            <div className="detail-price-box">
              <div className="detail-price-current">
                {product.price ? product.price.toLocaleString("tr-TR") : "0"} TL
              </div>
              {product.oldPrice && (
                <div className="detail-price-old">
                  {product.oldPrice.toLocaleString("tr-TR")} TL
                </div>
              )}
            </div>

            <div className="detail-description">
              <h3>Ürün Açıklaması</h3>
              <p>{product.description}</p>
            </div>

            {/* Purchase Action Box */}
            <div className="detail-actions">
              <div className="detail-qty-picker">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  disabled={quantity >= (product.stock || 99)}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className={`btn btn-primary btn-add-cart ${addedSuccess ? "btn-success" : ""}`}
                onClick={handleAddToCart}
              >
                {addedSuccess ? (
                  <>✓ Sepete Eklendi!</>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                      <circle cx="8" cy="21" r="1" />
                      <circle cx="19" cy="21" r="1" />
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    </svg>
                    Sepete Ekle ({quantity * (product.price || 0)} TL)
                  </>
                )}
              </button>
            </div>

            {/* Value Props */}
            <div className="detail-features-list">
              <div className="feature-item">
                <span>🚚</span>
                <div>
                  <strong>Ücretsiz Kargo</strong>
                  <p>150 TL ve üzeri siparişlerde kargo bedava</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🛡️</span>
                <div>
                  <strong>Orijinal Ürün Garantisi</strong>
                  <p>%100 Yetkili distribütör ve marka garantisi</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🔄</span>
                <div>
                  <strong>14 Gün Koşulsuz İade</strong>
                  <p>Kolay ve hızlı iade süreci</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
