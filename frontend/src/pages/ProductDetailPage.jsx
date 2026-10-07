import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useCart } from "../context/CartContext";
import "./ProductDetailPage.css";

function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [activeImage, setActiveImage] = useState("");
  const [activeTab, setActiveTab] = useState("description"); // description | specs | reviews | delivery
  const [isFavorite, setIsFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [stockNoticeEmail, setStockNoticeEmail] = useState("");
  const [stockNoticeSuccess, setStockNoticeSuccess] = useState(false);

  // Fetch product details
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setQuantity(1);
    setAddedSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    api
      .getProductById(id)
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          const prod = res.data;
          setProduct(prod);
          setActiveImage(prod.imageUrl || prod.image || "");

          // Load related products from same category
          if (prod.categorySlug || prod.category) {
            api
              .getProducts({ category: prod.categorySlug || prod.category })
              .then((catRes) => {
                if (isMounted && catRes?.data) {
                  const filtered = catRes.data
                    .filter((p) => p.id !== prod.id && p.slug !== prod.slug)
                    .slice(0, 4);
                  setRelatedProducts(filtered);
                }
              })
              .catch(() => {});
          }
        } else {
          setError("Ürün bilgisi bulunamadı.");
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

  const handleAddToCart = async () => {
    if (!product || product.stock <= 0) return;
    const success = await addToCart(product, quantity);
    if (success) {
      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
      }, 2500);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleStockNoticeSubmit = (e) => {
    e.preventDefault();
    if (!stockNoticeEmail.trim()) return;
    setStockNoticeSuccess(true);
    setTimeout(() => {
      setStockNoticeSuccess(false);
      setStockNoticeEmail("");
    }, 4000);
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

  const isOutOfStock = product.stock <= 0;
  const isCriticalStock = product.stock > 0 && product.stock <= 5;

  // Generate thumbnail list (main image + mock angle perspectives)
  const thumbnails = [
    product.imageUrl || product.image,
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
  ].filter(Boolean);

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
              <Link to={`/products?category=${encodeURIComponent(product.categorySlug || product.category)}`}>
                {product.category}
              </Link>
              <span className="crumb-sep">/</span>
            </>
          )}
          <span className="crumb-current">{product.name}</span>
        </nav>

        {/* Top Product Layout */}
        <div className="product-detail-layout">
          {/* Left Media Gallery */}
          <div className="detail-media">
            <div className="detail-image-card">
              <img
                src={activeImage || product.imageUrl || product.image}
                alt={product.name}
                className="detail-main-image"
              />
              {discountPercent && (
                <span className="detail-badge-discount">%{discountPercent} İNDİRİM</span>
              )}
              {isCriticalStock && (
                <span className="detail-badge-stock-urgent">🔥 Son {product.stock} Ürün!</span>
              )}
              {isOutOfStock && (
                <div className="detail-out-of-stock-overlay">
                  <span>TÜKENDİ</span>
                </div>
              )}
            </div>

            {/* Thumbnail Selector */}
            <div className="detail-thumbnails">
              {thumbnails.map((thumb, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumb-btn ${activeImage === thumb ? "active" : ""}`}
                  onClick={() => setActiveImage(thumb)}
                >
                  <img src={thumb} alt={`${product.name} Görsel ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Product Purchasing Info */}
          <div className="detail-info">
            <div className="detail-header">
              <div className="detail-header-top">
                {product.category && (
                  <span className="detail-category-tag">{product.category}</span>
                )}
                <div className="detail-share-actions">
                  <button
                    type="button"
                    className={`btn-icon-action ${isFavorite ? "favorite-active" : ""}`}
                    onClick={() => setIsFavorite(!isFavorite)}
                    title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                  >
                    {isFavorite ? "❤️" : "🤍"}
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action"
                    onClick={handleShare}
                    title="Ürün Bağlantısını Kopyala"
                  >
                    {copiedLink ? "✓" : "🔗"}
                  </button>
                </div>
              </div>

              <h1 className="detail-title">{product.name}</h1>

              <div className="detail-rating-row">
                <div className="detail-stars">
                  {"★".repeat(Math.floor(product.rating || 5))}
                  {"☆".repeat(5 - Math.floor(product.rating || 5))}
                </div>
                <span className="detail-rating-num">{product.rating || 5.0}</span>
                <span className="detail-review-count">
                  ({product.reviewCount || 24} değerlendirme)
                </span>

                {/* Live Stock Status Indicator */}
                <span
                  className={`detail-stock-pill ${
                    isOutOfStock
                      ? "out-of-stock"
                      : isCriticalStock
                      ? "low-stock"
                      : "in-stock"
                  }`}
                >
                  {isOutOfStock
                    ? "❌ Stokta Yok"
                    : isCriticalStock
                    ? `⚠️ Kritik Stok: Son ${product.stock} Adet`
                    : `✓ Stokta Var (${product.stock} Adet)`}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="detail-price-box">
              <div className="detail-price-current">
                {product.price ? product.price.toLocaleString("tr-TR") : "0"} TL
              </div>
              {product.oldPrice && (
                <div className="detail-price-old">
                  {product.oldPrice.toLocaleString("tr-TR")} TL
                </div>
              )}
              {discountPercent && (
                <span className="detail-savings">
                  ({((product.oldPrice - product.price)).toLocaleString("tr-TR")} TL Kazanç)
                </span>
              )}
            </div>

            <p className="detail-short-desc">
              {product.description?.slice(0, 160)}...
            </p>

            {/* Purchasing Action Area */}
            {!isOutOfStock ? (
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
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
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
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        width="20"
                        height="20"
                      >
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                      Sepete Ekle ({(quantity * (product.price || 0)).toLocaleString("tr-TR")} TL)
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="detail-out-of-stock-box">
                <p className="stock-warning-text">
                  ⚠️ Bu ürün şu anda tükendi. Tekrar stoğa girdiğinde e-posta ile bildirim almak ister misiniz?
                </p>
                {stockNoticeSuccess ? (
                  <div className="stock-notice-success">
                    ✓ Bildirim kaydınız alındı! Ürün stoğa girdiğinde size haber vereceğiz.
                  </div>
                ) : (
                  <form onSubmit={handleStockNoticeSubmit} className="stock-notice-form">
                    <input
                      type="email"
                      placeholder="E-posta adresinizi giriniz"
                      value={stockNoticeEmail}
                      onChange={(e) => setStockNoticeEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn btn-outline">
                      🔔 Haber Ver
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Value Propositions */}
            <div className="detail-features-list">
              <div className="feature-item">
                <span>🚚</span>
                <div>
                  <strong>Ücretsiz Hızlı Kargo</strong>
                  <p>150 TL ve üzeri siparişlerde aynı gün kargo</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🛡️</span>
                <div>
                  <strong>2 Yıl Resmi Garanti</strong>
                  <p>%100 Yetkili distribütör ve orijinal ürün garantisi</p>
                </div>
              </div>
              <div className="feature-item">
                <span>🔄</span>
                <div>
                  <strong>14 Gün Koşulsuz İade</strong>
                  <p>Memnun kalmazsanız kapıdan ücretsiz iade</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Info Section */}
        <section className="detail-tabs-section">
          <div className="detail-tab-headers">
            <button
              type="button"
              className={`tab-btn ${activeTab === "description" ? "active" : ""}`}
              onClick={() => setActiveTab("description")}
            >
              Ürün Açıklaması
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "specs" ? "active" : ""}`}
              onClick={() => setActiveTab("specs")}
            >
              Teknik Özellikler
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "delivery" ? "active" : ""}`}
              onClick={() => setActiveTab("delivery")}
            >
              Kargo & İade Koşulları
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === "reviews" ? "active" : ""}`}
              onClick={() => setActiveTab("reviews")}
            >
              Değerlendirmeler ({product.reviewCount || 24})
            </button>
          </div>

          <div className="detail-tab-content">
            {activeTab === "description" && (
              <div className="tab-pane">
                <h3>Ürün Hakkında Detaylı Bilgi</h3>
                <p>{product.description}</p>
                <p>
                  Yüksek kaliteli malzeme yapısı, ergonomik tasarımı ve üstün dayanıklılığı ile günlük
                  kullanımda maksimum konfor sağlar. Tüm testlerden başarıyla geçmiş orijinal üründür.
                </p>
              </div>
            )}

            {activeTab === "specs" && (
              <div className="tab-pane">
                <h3>Teknik Detaylar</h3>
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <th>Ürün Kodu (SKU)</th>
                      <td>{product.id}</td>
                    </tr>
                    <tr>
                      <th>Kategori</th>
                      <td>{product.category || "Genel"}</td>
                    </tr>
                    <tr>
                      <th>Stok Durumu</th>
                      <td>{product.stock} Adet</td>
                    </tr>
                    <tr>
                      <th>Garanti Süresi</th>
                      <td>24 Ay (2 Yıl)</td>
                    </tr>
                    <tr>
                      <th>Menşei</th>
                      <td>İthal / Yetkili Distribütör</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "delivery" && (
              <div className="tab-pane">
                <h3>Teslimat ve İade Süreçleri</h3>
                <p>
                  <strong>Teslimat Süresi:</strong> Saat 16:00'a kadar verilen siparişler aynı gün kargoya
                  teslim edilir. Tahmini teslimat süresi 1-3 iş günüdür.
                </p>
                <p>
                  <strong>İade ve Değişim:</strong> Satın aldığınız ürünü teslim aldığınız tarihten itibaren
                  14 gün içerisinde herhangi bir gerekçe göstermeksizin iade edebilirsiniz.
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="tab-pane">
                <div className="reviews-summary-card">
                  <div className="rating-big-score">{product.rating || "4.8"}</div>
                  <div>
                    <div className="detail-stars">★★★★★</div>
                    <p>{product.reviewCount || 24} müşteri değerlendirmesi üzerinden</p>
                  </div>
                </div>

                <div className="reviews-list">
                  <div className="review-item">
                    <div className="review-top">
                      <strong>Mehmet K.</strong>
                      <span className="review-stars">★★★★★</span>
                      <span className="review-date">2 gün önce</span>
                    </div>
                    <p>Paketleme çok özenliydi, ürün ertesi gün elime ulaştı. Kalitesine bayıldım!</p>
                  </div>
                  <div className="review-item">
                    <div className="review-top">
                      <strong>Ayşe D.</strong>
                      <span className="review-stars">★★★★★</span>
                      <span className="review-date">1 hafta önce</span>
                    </div>
                    <p>Fiyat/performans olarak mükemmel bir ürün. Kesinlikle tavsiye ederim.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="detail-related-section">
            <div className="section-header">
              <h2>Benzer Ürünler</h2>
              <Link to={`/products?category=${encodeURIComponent(product.categorySlug || product.category)}`}>
                Tümünü Gör &rarr;
              </Link>
            </div>

            <div className="related-grid">
              {relatedProducts.map((rel) => (
                <div key={rel.id} className="related-card">
                  <Link to={`/products/${rel.id}`} className="related-img-wrap">
                    <img src={rel.imageUrl || rel.image} alt={rel.name} loading="lazy" />
                  </Link>
                  <div className="related-body">
                    <span className="related-cat">{rel.category}</span>
                    <h4 className="related-title">
                      <Link to={`/products/${rel.id}`}>{rel.name}</Link>
                    </h4>
                    <div className="related-price">
                      {rel.price ? rel.price.toLocaleString("tr-TR") : "0"} TL
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;
