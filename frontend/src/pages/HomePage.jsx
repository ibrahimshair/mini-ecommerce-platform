import { useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import "./HomePage.css";

const FEATURED_PRODUCTS = [
  {
    id: "p1",
    name: "Kablosuz Gürültü Engelleyici Kulak Üstü Kulaklık Pro",
    slug: "kablosuz-anc-kulak-ustu-kulaklik-pro",
    category: "Elektronik",
    price: 2499,
    oldPrice: 3199,
    discount: 22,
    rating: 4.8,
    reviewCount: 142,
    stock: 24,
    description: "Aktif gürültü engelleme (ANC), 40 saat pil ömrü, yüksek çözünürlüklü ses kalitesi ve ultra rahat hafızalı sünger yastıklar.",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p2",
    name: "Akıllı Spor Saat - Nabız ve Uyku Takibi V2",
    slug: "akilli-gps-spor-saati-v2",
    category: "Elektronik",
    price: 3899,
    oldPrice: 4500,
    discount: 13,
    rating: 4.9,
    reviewCount: 89,
    stock: 15,
    description: "AMOLED ekran, nabız ve kandaki oksijen ölçümü, dahili GPS, 50m su geçirmezlik ve 14 gün pil ömrü ile kusursuz antrenman takibi.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p3",
    name: "Minimalist Su Geçirmez Laptop Sırt Çantası",
    slug: "minimalist-su-gecirmez-laptop-sirt-cantasi",
    category: "Giyim & Moda",
    price: 1299,
    oldPrice: 1650,
    discount: 21,
    rating: 4.7,
    reviewCount: 64,
    stock: 40,
    description: "16 inç korumalı laptop bölmesi, su itici kumaş dokusu, ergonomik omuz askıları ve gizli hırsızlık önleyici pasaport cebi.",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "p4",
    name: "Mekanik RGB Kompakt Klavye (%75)",
    slug: "mekanik-rgb-kompakt-klavye-75",
    category: "Elektronik",
    price: 1899,
    oldPrice: 2299,
    discount: 17,
    rating: 4.6,
    reviewCount: 110,
    stock: 18,
    description: "Hot-swappable mekanik kırmızı anahtarlar, PBT tuş kapakları, alüminyum gövde ve kablosuz Bluetooth/2.4Ghz çoklu cihaz desteği.",
    image:
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
  },
];

function HomePage({ onNavigateToProducts }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = [
    { id: "all", label: "Tüm Ürünler" },
    { id: "tech", label: "Elektronik" },
    { id: "fashion", label: "Giyim & Moda" },
    { id: "sport", label: "Spor & Outdoor" },
    { id: "accessories", label: "Aksesuar" },
  ];

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat.id);
    if (onNavigateToProducts && cat.id !== "all") {
      onNavigateToProducts(cat.label);
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            <span className="badge badge-primary hero-badge">
              ⚡ Yeni Nesil Alışveriş Deneyimi
            </span>
            <h1 className="hero-title">
              İhtiyacın Olan Her Şey, <span>Tek Bir Platformda.</span>
            </h1>
            <p className="hero-subtitle">
              En son teknoloji elektronik aletlerden seçkin moda ürünlerine kadar
              binlerce kaliteli seçenek, hızlı teslimat ve özel fırsatlarla seni bekliyor.
            </p>
            <div className="hero-actions">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => onNavigateToProducts && onNavigateToProducts("Tümü")}
              >
                Alışverişe Başla
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="btn-arrow"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                className="btn btn-outline btn-lg"
                onClick={() => onNavigateToProducts && onNavigateToProducts("Tümü")}
              >
                Kataloğu İncele
              </button>
            </div>

            {/* Micro Stats */}
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Mutlu Müşteri</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Orijinal Ürün</span>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-number">%100</span>
                <span className="stat-label">Güvenli Alışveriş</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions / Features */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className="feature-info">
                <h4>Hızlı & Ücretsiz Kargo</h4>
                <p>150 ₺ üzeri tüm siparişlerde aynı gün kargo avantajı.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="feature-info">
                <h4>%100 Güvenli Ödeme</h4>
                <p>256-bit SSL korumasıyla 3D Secure güvenli işlem.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </div>
              <div className="feature-info">
                <h4>14 Gün Kolay İade</h4>
                <p>Koşulsuz şartsız hızlı iade ve değişim güvencesi.</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div className="feature-info">
                <h4>7/24 Müşteri Desteği</h4>
                <p>Her sorunuz için uzman destek ekibimiz yanınızda.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section id="products" className="products-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Öne Çıkan Ürünler</h2>
            <p className="section-subtitle">
              En çok tercih edilen, müşteri puanı en yüksek popüler modelleri keşfedin.
            </p>

            {/* Category Pills */}
            <div className="category-pills">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`pill-btn ${activeCategory === cat.id ? "active" : ""}`}
                  onClick={() => handleCategoryClick(cat)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="products-grid">
            {FEATURED_PRODUCTS.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onViewDetail={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={() => onNavigateToProducts && onNavigateToProducts("Tümü")}
            >
              Tüm Ürünleri Gör ({categories.length} Kategori) &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-section">
        <div className="container">
          <div className="promo-banner">
            <div className="promo-text">
              <span className="badge badge-accent">Sınırlı Süre</span>
              <h3>İlk Alışverişine Özel Sepette %15 İndirim!</h3>
              <p>
                Kod: <strong>MINI15</strong> ile yapacağın ilk alışverişinde anında indirim kazan.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => onNavigateToProducts && onNavigateToProducts("Tümü")}
            >
              Fırsatı Yakala
            </button>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

export default HomePage;
