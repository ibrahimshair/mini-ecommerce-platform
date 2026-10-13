import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import useDebounce from "../hooks/useDebounce";
import "./AdminPage.css";

const STATUS_LABELS = {
  pending: { label: "Beklemede", pillClass: "pending", desc: "Ödeme onaylandı, hazırlık bekleniyor" },
  processing: { label: "Hazırlanıyor", pillClass: "processing", desc: "Sipariş paketleniyor" },
  shipped: { label: "Kargoda", pillClass: "shipped", desc: "Taşıyıcı firmaya teslim edildi" },
  delivered: { label: "Teslim Edildi", pillClass: "delivered", desc: "Alıcıya ulaştırıldı" },
  cancelled: { label: "İptal Edildi", pillClass: "cancelled", desc: "Sipariş iptal edildi & stok iade edildi" },
};

function formatCurrency(amount) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function formatDate(isoString) {
  if (!isoString) return "-";
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

function AdminPage() {
  const { currentUser } = useAuth();

  // Active view tab
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'orders' | 'products'

  // Data states
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Filters
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [productStockFilter, setProductStockFilter] = useState("all");
  const [productSearchQuery, setProductSearchQuery] = useState("");

  // Modals
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [productModal, setProductModal] = useState({
    isOpen: false,
    mode: "create", // 'create' | 'edit'
    formData: {
      id: "",
      name: "",
      categoryId: "",
      price: "",
      oldPrice: "",
      stock: "",
      description: "",
      imageUrl: "",
      isFeatured: false,
    },
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    product: null,
  });

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Fetch all initial data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, categoriesRes] = await Promise.allSettled([
        api.getAdminStats(),
        api.getAdminOrders(),
        api.getAdminProducts(),
        api.getCategories(),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value?.data?.orders) {
        setOrders(ordersRes.value.data.orders);
      }

      if (productsRes.status === "fulfilled" && productsRes.value?.data) {
        setProducts(productsRes.value.data);
      }

      if (categoriesRes.status === "fulfilled" && categoriesRes.value?.data) {
        setCategories(categoriesRes.value.data);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
      showNotification("Veriler yüklenirken bir problem oluştu.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Order status update handler
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    // Optimistically update orders list and open modal state immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
      setSelectedOrderDetail((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      const res = await api.updateAdminOrderStatus(orderId, newStatus);
      if (res?.success) {
        showNotification(
          `Sipariş (#${res?.data?.orderNumber || orderId}) durumu '${STATUS_LABELS[newStatus]?.label || newStatus}' olarak güncellendi.`
        );
        // Refresh live orders and stats from backend
        loadDashboardData();
      }
    } catch (err) {
      loadDashboardData();
      showNotification(err.message || "Sipariş durumu güncellenemedi.", "error");
    }
  };

  // Open Create Product Modal
  const handleOpenCreateProduct = () => {
    setProductModal({
      isOpen: true,
      mode: "create",
      formData: {
        id: "",
        name: "",
        categoryId: categories[0]?.id || "",
        price: "",
        oldPrice: "",
        stock: "10",
        description: "",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        isFeatured: false,
      },
    });
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod) => {
    setProductModal({
      isOpen: true,
      mode: "edit",
      formData: {
        id: prod.id,
        name: prod.name || "",
        categoryId: prod.categoryId || "",
        price: prod.price !== undefined ? String(prod.price) : "",
        oldPrice: prod.oldPrice ? String(prod.oldPrice) : "",
        stock: prod.stock !== undefined ? String(prod.stock) : "0",
        description: prod.description || "",
        imageUrl: prod.image || prod.imageUrl || "",
        isFeatured: Boolean(prod.isFeatured),
      },
    });
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const { id, name, categoryId, price, oldPrice, stock, description, imageUrl, isFeatured } =
      productModal.formData;

    if (!name.trim() || !price) {
      showNotification("Lütfen ürün adını ve fiyatını eksiksiz giriniz.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      categoryId: categoryId || null,
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : null,
      stock: Number(stock || 0),
      description: description.trim(),
      imageUrl: imageUrl.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
      isFeatured: Boolean(isFeatured),
    };

    try {
      if (productModal.mode === "create") {
        await api.createProduct(payload);
        showNotification(`'${payload.name}' ürünü başarıyla eklendi!`);
      } else {
        await api.updateProduct(id, payload);
        showNotification(`'${payload.name}' ürünü başarıyla güncellendi!`);
      }
      setProductModal({ isOpen: false, mode: "create", formData: {} });
      loadDashboardData();
    } catch (err) {
      showNotification(err.message || "Ürün kaydedilemedi.", "error");
    }
  };

  // Delete Product
  const handleDeleteProduct = async () => {
    const prod = deleteConfirmModal.product;
    if (!prod) return;

    try {
      await api.deleteProduct(prod.id);
      showNotification(`'${prod.name}' katalogdan silindi.`);
      setDeleteConfirmModal({ isOpen: false, product: null });
      loadDashboardData();
    } catch (err) {
      showNotification(err.message || "Ürün silinemedi.", "error");
    }
  };

  // Quick Stock Adjustment
  const handleQuickStock = async (productId, delta) => {
    try {
      await api.updateProductStock(productId, { delta });
      showNotification("Stok miktarı anlık senkronize edildi.");
      loadDashboardData();
    } catch (err) {
      showNotification(err.message || "Stok güncellenemedi.", "error");
    }
  };

  // Debounced search queries for smooth typing & zero UI jank (Day 28)
  const debouncedOrderQuery = useDebounce(orderSearchQuery, 250);
  const debouncedProductQuery = useDebounce(productSearchQuery, 250);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (orderStatusFilter !== "all" && order.status !== orderStatusFilter) {
        return false;
      }
      // Search query
      if (debouncedOrderQuery.trim()) {
        const q = debouncedOrderQuery.toLowerCase();
        const num = (order.orderNumber || "").toLowerCase();
        const name = (order.customerName || order.shippingAddress?.fullName || "").toLowerCase();
        const city = (order.shippingAddress?.city || "").toLowerCase();
        return num.includes(q) || name.includes(q) || city.includes(q);
      }
      return true;
    });
  }, [orders, orderStatusFilter, debouncedOrderQuery]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (productCategoryFilter !== "all") {
        const catSlug = (prod.categorySlug || prod.category || "").toLowerCase();
        const target = productCategoryFilter.toLowerCase();
        if (catSlug !== target && prod.categoryId !== productCategoryFilter) return false;
      }
      // Stock filter
      if (productStockFilter === "low" && (prod.stock > 5 || prod.stock <= 0)) return false;
      if (productStockFilter === "out" && prod.stock > 0) return false;
      // Search
      if (debouncedProductQuery.trim()) {
        const q = debouncedProductQuery.toLowerCase();
        const name = (prod.name || "").toLowerCase();
        const desc = (prod.description || "").toLowerCase();
        return name.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [products, productCategoryFilter, productStockFilter, debouncedProductQuery]);

  return (
    <div className="admin-container">
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`admin-alert-banner ${notification.type}`}>
          <span>{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontWeight: 700 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-title">
          <div className="admin-badge-title">
            <span>🛡️ Yönetim Paneli</span>
            <span>•</span>
            <span>{currentUser?.name || "Yönetici"}</span>
          </div>
          <h1>E-Ticaret Yönetim Merkezi</h1>
          <p className="admin-header-subtitle">
            Canlı sipariş takibi, ürün kataloğu, stok operasyonları ve finansal KPI analizi
          </p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-live-badge">
            <span className="admin-live-dot" />
            <span>Sistem Çevrimiçi</span>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={loadDashboardData}
            title="Verileri Yenile"
          >
            🔄 Yenile
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <span>📊 Genel Bakış (KPI)</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <span>📦 Sipariş Yönetimi</span>
          <span className="admin-tab-count">{orders.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <span>🏷️ Ürün & Stok Yönetimi</span>
          <span className="admin-tab-count">{products.length}</span>
        </button>
      </nav>

      {/* Tab 1: Overview & KPI Cards */}
      {activeTab === "overview" && (
        <section>
          {/* KPI Metrics Grid */}
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card kpi-accent-indigo">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Toplam Ciro</span>
                <span className="admin-kpi-icon">💰</span>
              </div>
              <div className="admin-kpi-value">{formatCurrency(stats?.totalRevenue || 0)}</div>
              <div className="admin-kpi-footer">
                <span>Tamamlanan & aktif siparişlerden</span>
              </div>
            </div>

            <div className="admin-kpi-card kpi-accent-emerald">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Toplam Sipariş</span>
                <span className="admin-kpi-icon">🛍️</span>
              </div>
              <div className="admin-kpi-value">{stats?.totalOrders || orders.length}</div>
              <div className="admin-kpi-footer">
                <span>Sistem genelinde oluşturulan</span>
              </div>
            </div>

            <div className="admin-kpi-card kpi-accent-amber">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Bekleyen & Hazırlanan</span>
                <span className="admin-kpi-icon">⏳</span>
              </div>
              <div className="admin-kpi-value">
                {(stats?.pendingCount || 0) + (stats?.processingCount || 0)}
              </div>
              <div className="admin-kpi-footer">
                <span>{stats?.pendingCount || 0} beklemede, {stats?.processingCount || 0} hazırlanıyor</span>
              </div>
            </div>

            <div className="admin-kpi-card kpi-accent-sky">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Kargodaki Siparişler</span>
                <span className="admin-kpi-icon">🚚</span>
              </div>
              <div className="admin-kpi-value">{stats?.shippedCount || 0}</div>
              <div className="admin-kpi-footer">
                <span>Teslimat aşamasında olanlar</span>
              </div>
            </div>

            <div className="admin-kpi-card kpi-accent-rose">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Kritik Stok Uyarısı</span>
                <span className="admin-kpi-icon">⚠️</span>
              </div>
              <div className="admin-kpi-value">{stats?.lowStockCount || 0}</div>
              <div className="admin-kpi-footer">
                <span>5 adet veya altında kalan ürünler</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="admin-quick-actions-bar">
            <button
              type="button"
              className="admin-action-chip primary"
              onClick={handleOpenCreateProduct}
            >
              <span>➕ Yeni Ürün Ekle</span>
            </button>
            <button
              type="button"
              className="admin-action-chip"
              onClick={() => {
                setActiveTab("orders");
                setOrderStatusFilter("pending");
              }}
            >
              <span>⏳ Bekleyen Siparişleri Filtrele</span>
            </button>
            <button
              type="button"
              className="admin-action-chip"
              onClick={() => {
                setActiveTab("products");
                setProductStockFilter("low");
              }}
            >
              <span>⚠️ Kritik Stoktaki Ürünler</span>
            </button>
          </div>

          {/* Recent Orders Snapshot */}
          <div className="admin-card-table-wrapper">
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>
                🕒 Son Siparişler Önizlemesi
              </h3>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setActiveTab("orders")}
              >
                Tümünü Gör ({orders.length}) →
              </button>
            </div>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sipariş No</th>
                  <th>Müşteri</th>
                  <th>Tarih</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((ord) => {
                  const statusInfo = STATUS_LABELS[ord.status] || STATUS_LABELS.pending;
                  return (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700, color: "#4f46e5" }}>{ord.orderNumber}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">{ord.customerName || ord.shippingAddress?.fullName || "Müşteri"}</span>
                          <span className="customer-email">{ord.customerEmail || "-"}</span>
                        </div>
                      </td>
                      <td>{formatDate(ord.createdAt)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(ord.totalPrice)}</td>
                      <td>
                        <span className={`status-pill ${statusInfo.pillClass}`}>
                          <span className="status-pill-dot" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Detay Görüntüle"
                          onClick={() => setSelectedOrderDetail(ord)}
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 2: Orders Management */}
      {activeTab === "orders" && (
        <section>
          {/* Table Toolbar */}
          <div className="admin-table-toolbar">
            <div className="admin-toolbar-left">
              {/* Status Filter Dropdown */}
              <select
                className="admin-select-filter"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">Tüm Durumlar ({orders.length})</option>
                <option value="pending">Beklemede ({orders.filter((o) => o.status === "pending").length})</option>
                <option value="processing">Hazırlanıyor ({orders.filter((o) => o.status === "processing").length})</option>
                <option value="shipped">Kargoda ({orders.filter((o) => o.status === "shipped").length})</option>
                <option value="delivered">Teslim Edildi ({orders.filter((o) => o.status === "delivered").length})</option>
                <option value="cancelled">İptal Edildi ({orders.filter((o) => o.status === "cancelled").length})</option>
              </select>

              {/* Search Box */}
              <div className="admin-search-box">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Sipariş no, müşteri adı veya şehir ara..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div>
              <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                {filteredOrders.length} sipariş gösteriliyor
              </span>
            </div>
          </div>

          {/* Orders Table */}
          <div className="admin-card-table-wrapper">
            {filteredOrders.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">📦</div>
                <div className="admin-empty-title">Aramanıza Uygun Sipariş Bulunamadı</div>
                <p>Filtreleri sıfırlayarak tüm siparişleri görüntüleyebilirsiniz.</p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: "1rem" }}
                  onClick={() => {
                    setOrderStatusFilter("all");
                    setOrderSearchQuery("");
                  }}
                >
                  Filtreleri Temizle
                </button>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sipariş No</th>
                    <th>Müşteri</th>
                    <th>Tarih</th>
                    <th>Kalemler</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Durum Değiştir</th>
                    <th>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((ord) => {
                    const statusInfo = STATUS_LABELS[ord.status] || STATUS_LABELS.pending;
                    return (
                      <tr key={ord.id}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedOrderDetail(ord)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#4f46e5",
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "underline",
                            }}
                          >
                            {ord.orderNumber}
                          </button>
                        </td>

                        <td>
                          <div className="customer-cell">
                            <span className="customer-name">
                              {ord.customerName || ord.shippingAddress?.fullName || "Müşteri"}
                            </span>
                            <span className="customer-email">
                              {ord.shippingAddress?.city
                                ? `${ord.shippingAddress.city} • ${ord.customerEmail || ""}`
                                : ord.customerEmail || "-"}
                            </span>
                          </div>
                        </td>

                        <td>{formatDate(ord.createdAt)}</td>

                        <td>
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                            {ord.items?.length || ord.itemCount || 1} ürün
                          </span>
                        </td>

                        <td style={{ fontWeight: 800, color: "#1e293b" }}>
                          {formatCurrency(ord.totalPrice)}
                        </td>

                        <td>
                          <span className={`status-pill ${statusInfo.pillClass}`}>
                            <span className="status-pill-dot" />
                            {statusInfo.label}
                          </span>
                        </td>

                        <td>
                          <select
                            className="admin-status-dropdown"
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          >
                            <option value="pending">Beklemede</option>
                            <option value="processing">Hazırlanıyor</option>
                            <option value="shipped">Kargoda</option>
                            <option value="delivered">Teslim Edildi</option>
                            <option value="cancelled">İptal Et</option>
                          </select>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn-icon"
                            title="Sipariş Detayı & Fatura"
                            onClick={() => setSelectedOrderDetail(ord)}
                          >
                            👁️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Tab 3: Products Management */}
      {activeTab === "products" && (
        <section>
          {/* Table Toolbar */}
          <div className="admin-table-toolbar">
            <div className="admin-toolbar-left">
              {/* Category Filter */}
              <select
                className="admin-select-filter"
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
              >
                <option value="all">Tüm Kategoriler</option>
                {categories.map((c) => (
                  <option key={c.id || c.slug} value={c.slug || c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                className="admin-select-filter"
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value)}
              >
                <option value="all">Tüm Stok Durumları</option>
                <option value="low">⚠️ Kritik Stok (≤ 5)</option>
                <option value="out">⛔ Tükendi (0)</option>
              </select>

              {/* Search */}
              <div className="admin-search-box">
                <span className="admin-search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Ürün adı veya açıklama ara..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleOpenCreateProduct}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  boxShadow: "0 2px 6px rgba(79, 70, 229, 0.3)",
                }}
              >
                ➕ Yeni Ürün Ekle
              </button>
            </div>
          </div>

          {/* Products Table */}
          <div className="admin-card-table-wrapper">
            {filteredProducts.length === 0 ? (
              <div className="admin-empty-state">
                <div className="admin-empty-icon">🏷️</div>
                <div className="admin-empty-title">Ürün Bulunamadı</div>
                <p>Arama kriterlerinizi değiştirerek tekrar deneyebilirsiniz.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Ürün Bilgisi</th>
                    <th>Kategori</th>
                    <th>Fiyat</th>
                    <th>Stok Miktarı</th>
                    <th>Hızlı Stok</th>
                    <th>Öne Çıkan</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((prod) => {
                    const stock = Number(prod.stock || 0);
                    let stockClass = "healthy";
                    let stockLabel = `${stock} Adet`;
                    if (stock === 0) {
                      stockClass = "out";
                      stockLabel = "Tükendi (0)";
                    } else if (stock <= 5) {
                      stockClass = "low";
                      stockLabel = `Kritik (${stock})`;
                    }

                    return (
                      <tr key={prod.id}>
                        <td>
                          <div className="product-cell">
                            <img
                              src={prod.image || prod.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
                              alt={prod.name}
                              className="product-thumb"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80";
                              }}
                            />
                            <div className="product-meta">
                              <Link
                                to={`/products/${prod.id}`}
                                className="product-title"
                                target="_blank"
                                rel="noreferrer"
                              >
                                {prod.name}
                              </Link>
                              <span className="product-slug">ID: {prod.id}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
                            {prod.category || "Genel"}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontWeight: 800, color: "#1e293b" }}>
                              {formatCurrency(prod.price)}
                            </span>
                            {prod.oldPrice && (
                              <span style={{ fontSize: "0.75rem", color: "#94a3b8", textDecoration: "line-through" }}>
                                {formatCurrency(prod.oldPrice)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className={`stock-pill ${stockClass}`}>{stockLabel}</span>
                        </td>

                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <button
                              type="button"
                              className="btn-icon"
                              title="1 Azalt"
                              disabled={stock <= 0}
                              onClick={() => handleQuickStock(prod.id, -1)}
                            >
                              -
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              title="5 Ekle"
                              onClick={() => handleQuickStock(prod.id, 5)}
                            >
                              +5
                            </button>
                          </div>
                        </td>

                        <td>
                          {prod.isFeatured ? (
                            <span style={{ color: "#f59e0b", fontSize: "1rem" }} title="Öne Çıkan Ürün">
                              ⭐
                            </span>
                          ) : (
                            <span style={{ color: "#cbd5e1" }}>-</span>
                          )}
                        </td>

                        <td>
                          <div className="admin-action-btn-group">
                            <button
                              type="button"
                              className="btn-icon"
                              title="Ürünü Düzenle"
                              onClick={() => handleOpenEditProduct(prod)}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn-icon danger"
                              title="Ürünü Sil"
                              onClick={() => setDeleteConfirmModal({ isOpen: true, product: prod })}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrderDetail(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>Sipariş Detayı #{selectedOrderDetail.orderNumber}</h2>
                <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                  Kayıt Tarihi: {formatDate(selectedOrderDetail.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setSelectedOrderDetail(null)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              {/* Order Status Bar */}
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>
                    Mevcut Sipariş Durumu
                  </span>
                  <span
                    className={`status-pill ${STATUS_LABELS[selectedOrderDetail.status]?.pillClass || "pending"}`}
                    style={{ marginTop: "0.25rem" }}
                  >
                    <span className="status-pill-dot" />
                    {STATUS_LABELS[selectedOrderDetail.status]?.label || selectedOrderDetail.status}
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>
                    Durumu Değiştir:
                  </label>
                  <select
                    className="admin-status-dropdown"
                    value={selectedOrderDetail.status}
                    onChange={(e) =>
                      handleUpdateOrderStatus(selectedOrderDetail.id, e.target.value)
                    }
                  >
                    <option value="pending">Beklemede</option>
                    <option value="processing">Hazırlanıyor</option>
                    <option value="shipped">Kargoda</option>
                    <option value="delivered">Teslim Edildi</option>
                    <option value="cancelled">İptal Edildi</option>
                  </select>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="admin-form-row" style={{ marginBottom: "1.25rem" }}>
                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#1e293b" }}>
                    👤 Müşteri & İletişim
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>
                    {selectedOrderDetail.customerName || selectedOrderDetail.shippingAddress?.fullName || "Müşteri"}
                  </p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    {selectedOrderDetail.customerEmail || "-"}
                  </p>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                    📞 {selectedOrderDetail.shippingAddress?.phone || "+90 555 123 4567"}
                  </p>
                </div>

                <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", color: "#1e293b" }}>
                    📍 Teslimat Adresi
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
                    {selectedOrderDetail.shippingAddress?.detailedAddress ||
                      (typeof selectedOrderDetail.shippingAddress === "string"
                        ? selectedOrderDetail.shippingAddress
                        : "Adres detayı belirtilmemiş")}
                    <br />
                    <strong>
                      {selectedOrderDetail.shippingAddress?.district || ""}{" "}
                      {selectedOrderDetail.shippingAddress?.city || ""}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Items Breakdown */}
              <h4 style={{ margin: "1rem 0 0.5rem", fontSize: "0.95rem", color: "#1e293b" }}>
                🛍️ Sipariş Edilen Ürünler ({selectedOrderDetail.items?.length || 1})
              </h4>
              <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>Birim Fiyat</th>
                      <th>Adet</th>
                      <th>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrderDetail.items || []).map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <img
                              src={item.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"}
                              alt={item.name}
                              style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }}
                            />
                            <span style={{ fontWeight: 600, fontSize: "0.88rem" }}>{item.name}</span>
                          </div>
                        </td>
                        <td>{formatCurrency(item.unitPrice || item.price)}</td>
                        <td>{item.quantity} Adet</td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency((item.unitPrice || item.price) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div style={{ marginTop: "1.25rem", textAlign: "right" }}>
                <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#1e293b" }}>
                  Genel Toplam: {formatCurrency(selectedOrderDetail.totalPrice)}
                </div>
                {selectedOrderDetail.paymentMethod === "cash_on_delivery" ? (
                  <span style={{ fontSize: "0.82rem", color: selectedOrderDetail.status === "delivered" ? "#10b981" : "#d97706", fontWeight: 700 }}>
                    {selectedOrderDetail.status === "delivered"
                      ? "✓ Kapıda Tahsil Edildi (Nakit/Kart)"
                      : "⏳ Kapıda Tahsil Edilecek (Teslimatta Ödeme)"}
                  </span>
                ) : selectedOrderDetail.paymentMethod === "bank_transfer" ? (
                  <span style={{ fontSize: "0.82rem", color: selectedOrderDetail.paymentStatus === "paid" ? "#10b981" : "#d97706", fontWeight: 700 }}>
                    {selectedOrderDetail.paymentStatus === "paid" ? "✓ Havale Onaylandı" : "⏳ Havale Bekleniyor"}
                  </span>
                ) : (
                  <span style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 700 }}>
                    ✓ Ödeme Alındı ({selectedOrderDetail.paymentMethod === "credit_card" ? "Kredi Kartı" : selectedOrderDetail.paymentMethod || "Kredi Kartı"})
                  </span>
                )}
              </div>
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedOrderDetail(null)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {productModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setProductModal({ isOpen: false, mode: "create", formData: {} })}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{productModal.mode === "create" ? "➕ Yeni Ürün Ekle" : "✏️ Ürünü Düzenle"}</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setProductModal({ isOpen: false, mode: "create", formData: {} })}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="admin-modal-body">
                {/* Product Name */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Ürün Adı *</label>
                  <input
                    type="text"
                    required
                    className="admin-form-input"
                    placeholder="Örn: Sony WH-1000XM5 Kulaklık"
                    value={productModal.formData.name || ""}
                    onChange={(e) =>
                      setProductModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, name: e.target.value },
                      }))
                    }
                  />
                </div>

                {/* Category & Stock Row */}
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Kategori</label>
                    <select
                      className="admin-form-select"
                      value={productModal.formData.categoryId || ""}
                      onChange={(e) =>
                        setProductModal((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, categoryId: e.target.value },
                        }))
                      }
                    >
                      <option value="">Genel</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Stok Miktarı (Adet) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      className="admin-form-input"
                      value={productModal.formData.stock || ""}
                      onChange={(e) =>
                        setProductModal((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, stock: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Price & Old Price Row */}
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label className="admin-form-label">Satış Fiyatı (₺) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      min="0"
                      className="admin-form-input"
                      placeholder="999.90"
                      value={productModal.formData.price || ""}
                      onChange={(e) =>
                        setProductModal((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, price: e.target.value },
                        }))
                      }
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Eski / İndirimsiz Fiyat (₺)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="admin-form-input"
                      placeholder="1299.90"
                      value={productModal.formData.oldPrice || ""}
                      onChange={(e) =>
                        setProductModal((prev) => ({
                          ...prev,
                          formData: { ...prev.formData, oldPrice: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Image URL & Preview */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Görsel URL</label>
                  <input
                    type="url"
                    className="admin-form-input"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={productModal.formData.imageUrl || ""}
                    onChange={(e) =>
                      setProductModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, imageUrl: e.target.value },
                      }))
                    }
                  />
                  {productModal.formData.imageUrl && (
                    <div className="image-preview-box">
                      <img
                        src={productModal.formData.imageUrl}
                        alt="Önizleme"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="admin-form-group">
                  <label className="admin-form-label">Ürün Açıklaması</label>
                  <textarea
                    rows="3"
                    className="admin-form-textarea"
                    placeholder="Ürün özelliklerini ve detaylarını buraya yazınız..."
                    value={productModal.formData.description || ""}
                    onChange={(e) =>
                      setProductModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, description: e.target.value },
                      }))
                    }
                  />
                </div>

                {/* Featured Checkbox */}
                <label className="admin-form-checkbox-row">
                  <input
                    type="checkbox"
                    checked={productModal.formData.isFeatured || false}
                    onChange={(e) =>
                      setProductModal((prev) => ({
                        ...prev,
                        formData: { ...prev.formData, isFeatured: e.target.checked },
                      }))
                    }
                  />
                  <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                    ⭐ Bu ürünü ana sayfada "Öne Çıkanlar" vitrininde göster
                  </span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setProductModal({ isOpen: false, mode: "create", formData: {} })}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  }}
                >
                  {productModal.mode === "create" ? "Ürünü Kaydet" : "Değişiklikleri Güncelle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.isOpen && (
        <div className="admin-modal-overlay" onClick={() => setDeleteConfirmModal({ isOpen: false, product: null })}>
          <div className="admin-modal-card" style={{ maxWidth: "440px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Ürünü Sil</h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setDeleteConfirmModal({ isOpen: false, product: null })}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body" style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🗑️</div>
              <h3 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.15rem" }}>
                '{deleteConfirmModal.product?.name}'
              </h3>
              <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Bu ürünü katalogdan kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setDeleteConfirmModal({ isOpen: false, product: null })}
              >
                Vazgeç
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ background: "#dc2626", color: "#fff", border: "none", fontWeight: 700 }}
                onClick={handleDeleteProduct}
              >
                Evet, Ürünü Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
