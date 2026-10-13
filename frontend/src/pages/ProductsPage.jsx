import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ProductDetailModal from "../components/ProductDetailModal";
import Pagination from "../components/Pagination";
import api from "../services/api";
import { formatCurrency } from "../utils/formatters";
import useDebounce from "../hooks/useDebounce";
import { useToast } from "../context/ToastContext";
import "./ProductsPage.css";

const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    name: "Kablosuz ANC Kulak Üstü Kulaklık Pro",
    slug: "kablosuz-anc-kulak-ustu-kulaklik-pro",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 2499.0,
    oldPrice: 3199.0,
    discount: 22,
    rating: 4.8,
    reviewCount: 142,
    stock: 24,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    isFeatured: true,
    description: "Aktif gürültü engelleme (ANC), 40 saat pil ömrü, yüksek çözünürlüklü ses kalitesi ve ultra rahat hafızalı sünger yastıklar.",
  },
  {
    id: "p2",
    name: "Akıllı GPS Spor Saati V2",
    slug: "akilli-gps-spor-saati-v2",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 3899.0,
    oldPrice: 4500.0,
    discount: 13,
    rating: 4.9,
    reviewCount: 89,
    stock: 15,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    isFeatured: true,
    description: "AMOLED ekran, nabız ve kandaki oksijen ölçümü, dahili GPS, 50m su geçirmezlik ve 14 gün pil ömrü ile kusursuz antrenman takibi.",
  },
  {
    id: "p3",
    name: "Minimalist Su Geçirmez Laptop Sırt Çantası",
    slug: "minimalist-su-gecirmez-laptop-sirt-cantasi",
    category: "Giyim & Moda",
    categorySlug: "giyim-moda",
    price: 1299.0,
    oldPrice: 1650.0,
    discount: 21,
    rating: 4.7,
    reviewCount: 64,
    stock: 40,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    isFeatured: true,
    description: "16 inç korumalı laptop bölmesi, su itici kumaş dokusu, ergonomik omuz askıları ve gizli hırsızlık önleyici pasaport cebi.",
  },
  {
    id: "p4",
    name: "Mekanik RGB Kompakt Klavye (%75)",
    slug: "mekanik-rgb-kompakt-klavye-75",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 1899.0,
    oldPrice: 2299.0,
    discount: 17,
    rating: 4.6,
    reviewCount: 110,
    stock: 18,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    isFeatured: false,
    description: "Hot-swappable mekanik kırmızı anahtarlar, PBT tuş kapakları, alüminyum gövde ve kablosuz Bluetooth/2.4Ghz çoklu cihaz desteği.",
  },
  {
    id: "p5",
    name: "Ergonomik Yalıtımlı Çelik Termos (750ml)",
    slug: "ergonomik-yalitimli-celik-termos-750ml",
    category: "Spor & Outdoor",
    categorySlug: "spor-outdoor",
    price: 649.0,
    oldPrice: 799.0,
    discount: 18,
    rating: 4.8,
    reviewCount: 76,
    stock: 50,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    isFeatured: false,
    description: "Çift duvarlı vakumlu 18/8 paslanmaz çelik, 24 saat soğuk ve 12 saat sıcak tutma performansı, sızdırmaz emniyetli kapak.",
  },
  {
    id: "p6",
    name: "Polarize Klasik Tasarım Güneş Gözlüğü",
    slug: "polarize-klasik-tasarim-gunes-gozlugu",
    category: "Aksesuar",
    categorySlug: "aksesuar",
    price: 899.0,
    oldPrice: 1150.0,
    discount: 22,
    rating: 4.5,
    reviewCount: 52,
    stock: 25,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    isFeatured: false,
    description: "UV400 tam koruma filtreli polarize camlar, hafif asetat çerçeve, darbelere dayanıklı menteşe yapısı ve koruyucu deri kılıf.",
  },
];

const DEFAULT_CATEGORIES = [
  "Tümü",
  "Elektronik",
  "Giyim & Moda",
  "Spor & Outdoor",
  "Ev & Yaşam",
  "Aksesuar",
];

function ProductsPage({ initialCategory = "Tümü", searchQuery = "", onNavigateHome }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const urlCategory = searchParams.get("category");
  const urlSearch = searchParams.get("search");
  const urlRating = searchParams.get("rating");
  const urlMaxPrice = searchParams.get("maxPrice");
  const urlInStock = searchParams.get("inStock");
  const urlSortBy = searchParams.get("sortBy");
  const urlPage = searchParams.get("page");
  const urlLimit = searchParams.get("limit");

  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Derive filter states from URL search params or defaults
  const selectedCategory = urlCategory
    ? urlCategory === "Moda"
      ? "Giyim & Moda"
      : urlCategory
    : initialCategory || "Tümü";

  const activeSearch = urlSearch !== null ? urlSearch : searchQuery;
  const maxPrice = urlMaxPrice ? Number(urlMaxPrice) : 5000;
  const onlyInStock = urlInStock === "true";
  const minRating = urlRating || "all";
  const sortBy = urlSortBy || "recommended";
  const page = Math.max(1, Number(urlPage) || 1);
  const limit = Math.max(1, Number(urlLimit) || 12);

  // Debounced filters for responsive performance (Day 28)
  const debouncedSearch = useDebounce(activeSearch, 250);
  const debouncedMaxPrice = useDebounce(maxPrice, 150);

  // Helper to update URL search parameters
  const updateFilter = useCallback(
    (updates) => {
      const newParams = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, val]) => {
        if (
          val === null ||
          val === undefined ||
          val === "" ||
          val === "Tümü" ||
          val === "all" ||
          (key === "page" && val === 1) ||
          (key === "maxPrice" && Number(val) >= 5000)
        ) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(val));
        }
      });

      // Reset page to 1 when any filter other than page changes
      if (!("page" in updates)) {
        newParams.delete("page");
      }

      setSearchParams(newParams);
    },
    [searchParams, setSearchParams]
  );

  // Fetch products and categories via API client
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const loadData = async () => {
      try {
        const [prodRes, catRes] = await Promise.allSettled([
          api.getProducts(),
          api.getCategories(),
        ]);

        if (isMounted) {
          if (prodRes.status === "fulfilled" && prodRes.value?.data) {
            setProducts(prodRes.value.data);
          }
          if (catRes.status === "fulfilled" && catRes.value?.data) {
            const catNames = catRes.value.data.map((c) => c.name);
            setCategories(["Tümü", ...catNames]);
          }
        }
      } catch (err) {
        console.warn("API load fallback engaged:", err.message);
      } finally {
        if (isMounted) {
          setTimeout(() => setIsLoading(false), 300);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-criteria client-side filtering and sorting engine
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        const matchesCategory =
          selectedCategory === "Tümü" ||
          product.category === selectedCategory ||
          product.categorySlug === selectedCategory.toLowerCase();

        // Price filter
        const matchesPrice = Number(product.price) <= debouncedMaxPrice;

        // Stock filter
        const matchesStock = !onlyInStock || (product.stock && product.stock > 0);

        // Rating filter (Day 29)
        const matchesRating =
          minRating === "all" || Number(product.rating || 0) >= Number(minRating);

        // Search query filter
        const matchesSearch =
          !debouncedSearch ||
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (product.description &&
            product.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (product.category &&
            product.category.toLowerCase().includes(debouncedSearch.toLowerCase()));

        return (
          matchesCategory &&
          matchesPrice &&
          matchesStock &&
          matchesRating &&
          matchesSearch
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") return Number(a.price) - Number(b.price);
        if (sortBy === "price-desc") return Number(b.price) - Number(a.price);
        if (sortBy === "rating-desc") return Number(b.rating) - Number(a.rating);
        if (sortBy === "popular") return Number(b.reviewCount || 0) - Number(a.reviewCount || 0);
        if (sortBy === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        return 0; // recommended
      });
  }, [
    products,
    selectedCategory,
    debouncedMaxPrice,
    onlyInStock,
    minRating,
    sortBy,
    debouncedSearch,
  ]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(page, totalPages);

  const pagedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    return filteredProducts.slice(startIndex, startIndex + limit);
  }, [filteredProducts, currentPage, limit]);

  const handlePageChange = (newPage) => {
    updateFilter({ page: newPage });
    window.scrollTo({ top: 320, behavior: "smooth" });
  };

  const handleLimitChange = (newLimit) => {
    updateFilter({ limit: newLimit, page: 1 });
  };

  const hasActiveFilters =
    selectedCategory !== "Tümü" ||
    Boolean(activeSearch) ||
    maxPrice < 5000 ||
    onlyInStock ||
    minRating !== "all";

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
    if (toast?.info) {
      toast.info("Tüm filtreler temizlendi.");
    }
  };

  return (
    <div className="products-page">
      {/* Page Header Banner */}
      <div className="products-banner">
        <div className="container">
          <div className="banner-breadcrumb">
            <Link
              to="/"
              className="breadcrumb-link"
              onClick={onNavigateHome}
            >
              Ana Sayfa
            </Link>{" "}
            &gt;{" "}
            {selectedCategory === "Tümü" ? (
              <span>Ürün Kataloğu</span>
            ) : (
              <>
                <Link
                  to="/products"
                  className="breadcrumb-link"
                  onClick={() => updateFilter({ category: "Tümü" })}
                >
                  Ürün Kataloğu
                </Link>{" "}
                &gt; <span>{selectedCategory}</span>
              </>
            )}
          </div>
          <h1 className="banner-title">
            {selectedCategory === "Tümü" ? "Tüm Ürünler" : `${selectedCategory} Koleksiyonu`}
          </h1>
          <p className="banner-subtitle">
            En güncel teknoloji, spor, giyim ve aksesuar koleksiyonlarını avantajlı fiyatlarla keşfedin.
          </p>
        </div>
      </div>

      <div className="container products-layout">
        {/* Mobile Filter Toggle Button */}
        <button
          type="button"
          className="btn btn-outline mobile-filter-trigger"
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          Filtrele & Sırala ({filteredProducts.length})
        </button>

        {/* Sidebar Filter Column */}
        <aside className={`filters-sidebar ${mobileFilterOpen ? "is-open" : ""}`}>
          <div className="sidebar-header">
            <h3>Filtreler</h3>
            <div className="sidebar-header-actions">
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                Temizle
              </button>
              <button
                type="button"
                className="mobile-close-filter"
                onClick={() => setMobileFilterOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Kategoriler</h4>
            <div className="filter-options">
              {categories.map((cat) => (
                <label key={cat} className="filter-radio-label">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => {
                      updateFilter({ category: cat });
                      if (mobileFilterOpen) setMobileFilterOpen(false);
                    }}
                  />
                  <span className="radio-custom" />
                  <span className="label-text">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <div className="filter-title-row">
              <h4 className="filter-group-title">Maksimum Fiyat</h4>
              <span className="price-tag">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={maxPrice}
              onChange={(e) => updateFilter({ maxPrice: Number(e.target.value) })}
              className="price-range-slider"
            />
            <div className="price-range-labels">
              <span>500 ₺</span>
              <span>5.000 ₺</span>
            </div>
          </div>

          {/* Customer Rating Filter (Day 29) */}
          <div className="filter-group">
            <h4 className="filter-group-title">Müşteri Puanı</h4>
            <div className="filter-options">
              {[
                { value: "all", label: "Tüm Puanlar" },
                { value: "4.5", label: "⭐ 4.5 ve üzeri" },
                { value: "4.0", label: "⭐ 4.0 ve üzeri" },
                { value: "3.0", label: "⭐ 3.0 ve üzeri" },
              ].map((r) => (
                <label key={r.value} className="filter-radio-label">
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === r.value}
                    onChange={() => updateFilter({ rating: r.value })}
                  />
                  <span className="radio-custom" />
                  <span className="label-text">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="filter-group">
            <h4 className="filter-group-title">Stok Durumu</h4>
            <label className="filter-checkbox-label">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => updateFilter({ inStock: e.target.checked ? "true" : null })}
              />
              <span className="checkbox-custom" />
              <span className="label-text">Yalnızca Stoktakiler</span>
            </label>
          </div>

          {/* Value Props Box in Sidebar */}
          <div className="sidebar-promo-box">
            <span className="promo-badge">Garantili Teslimat</span>
            <p>150 ₺ ve üzeri tüm siparişlerde aynı gün kargo ve 14 gün iade garantisi!</p>
          </div>
        </aside>

        {/* Main Products Grid Column */}
        <main className="products-main">
          {/* Top Bar (Count & Sort) */}
          <div className="products-topbar">
            <div className="products-count">
              Toplam <strong>{totalItems}</strong> ürün listeleniyor
              {activeSearch && (
                <span className="search-active-pill">
                  "{activeSearch}" için sonuçlar
                </span>
              )}
            </div>

            <div className="products-sort-box">
              <label htmlFor="sort-select">Sırala:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => updateFilter({ sortBy: e.target.value })}
                className="sort-select"
              >
                <option value="recommended">Önerilen Sıralama</option>
                <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="rating-desc">En Yüksek Puanlılar</option>
                <option value="newest">En Yeni Ürünler</option>
                <option value="popular">En Çok Değerlendirilenler</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips Bar (Day 29) */}
          {hasActiveFilters && (
            <div className="active-filters-bar">
              <span className="active-filters-label">Aktif Filtreler:</span>

              {selectedCategory !== "Tümü" && (
                <span className="active-filter-chip">
                  Kategori: {selectedCategory}
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => updateFilter({ category: "Tümü" })}
                    title="Kategoriyi kaldır"
                    aria-label="Kategoriyi kaldır"
                  >
                    ✕
                  </button>
                </span>
              )}

              {activeSearch && (
                <span className="active-filter-chip">
                  Arama: "{activeSearch}"
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => updateFilter({ search: "" })}
                    title="Aramayı temizle"
                    aria-label="Aramayı temizle"
                  >
                    ✕
                  </button>
                </span>
              )}

              {maxPrice < 5000 && (
                <span className="active-filter-chip">
                  Maks: {formatCurrency(maxPrice)}
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => updateFilter({ maxPrice: null })}
                    title="Fiyat filtresini kaldır"
                    aria-label="Fiyat filtresini kaldır"
                  >
                    ✕
                  </button>
                </span>
              )}

              {minRating !== "all" && (
                <span className="active-filter-chip">
                  ⭐ {minRating}+ Puan
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => updateFilter({ rating: "all" })}
                    title="Puan filtresini kaldır"
                    aria-label="Puan filtresini kaldır"
                  >
                    ✕
                  </button>
                </span>
              )}

              {onlyInStock && (
                <span className="active-filter-chip">
                  Yalnızca Stokta
                  <button
                    type="button"
                    className="chip-remove-btn"
                    onClick={() => updateFilter({ inStock: null })}
                    title="Stok filtresini kaldır"
                    aria-label="Stok filtresini kaldır"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button
                type="button"
                className="clear-all-chips-btn"
                onClick={handleResetFilters}
              >
                Tümünü Temizle
              </button>
            </div>
          )}

          {/* Loading Skeleton State */}
          {isLoading ? (
            <div className="products-grid">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-image" />
                  <div className="skeleton-meta" />
                  <div className="skeleton-title" />
                  <div className="skeleton-footer" />
                </div>
              ))}
            </div>
          ) : pagedProducts.length > 0 ? (
            /* Product Grid */
            <>
              <div className="products-grid">
                {pagedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onViewDetail={(prod) => setSelectedProduct(prod)}
                  />
                ))}
              </div>

              {/* Standardized Pagination Controls (Day 29) */}
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
              />
            </>
          ) : (
            /* Empty State */
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  <line x1="8" y1="11" x2="14" y2="11" />
                </svg>
              </div>
              <h3>Aradığınız Kriterlere Uygun Ürün Bulunamadı</h3>
              <p>
                Lütfen farklı bir kategori seçmeyi veya filtre aralığını genişletmeyi deneyin.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleResetFilters}
              >
                Filtreleri Sıfırla
              </button>
            </div>
          )}
        </main>
      </div>

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

export default ProductsPage;
