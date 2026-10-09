import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./OrdersPage.css";

function formatCurrency(val) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(val || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 4-step progress status map
const STATUS_STEPS = [
  { key: "pending", label: "Sipariş Alındı", desc: "Ödeme onaylandı, sipariş sıraya girdi." },
  { key: "processing", label: "Hazırlanıyor", desc: "Ürünler paketleniyor ve faturalandırılıyor." },
  { key: "shipped", label: "Kargoya Verildi", desc: "Paket kargo kuryesine teslim edildi." },
  { key: "delivered", label: "Teslim Edildi", desc: "Sipariş adresinize ulaştırıldı." },
];

function getStepIndex(status) {
  switch (status) {
    case "pending":
      return 0;
    case "processing":
      return 1;
    case "shipped":
      return 2;
    case "delivered":
      return 3;
    case "cancelled":
      return -1;
    default:
      return 0;
  }
}

function getStatusBadge(status) {
  switch (status) {
    case "pending":
      return { text: "Sipariş Alındı", className: "badge-pending", icon: "⏳" };
    case "processing":
      return { text: "Hazırlanıyor", className: "badge-processing", icon: "📦" };
    case "shipped":
      return { text: "Kargoda", className: "badge-shipped", icon: "🚚" };
    case "delivered":
      return { text: "Teslim Edildi", className: "badge-delivered", icon: "✅" };
    case "cancelled":
      return { text: "İptal Edildi", className: "badge-cancelled", icon: "🚫" };
    default:
      return { text: status, className: "badge-default", icon: "📋" };
  }
}

function OrdersPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'processing', 'shipped', 'delivered', 'cancelled'
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [copiedCode, setCopiedCode] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.getOrders();
      if (res && res.success) {
        const list = res.data?.orders || [];
        setOrders(list);

        // If URL has ?orderId=..., open detail modal automatically
        const requestedId = searchParams.get("orderId");
        if (requestedId) {
          const match = list.find((o) => o.id === requestedId || o.orderNumber === requestedId);
          if (match) {
            handleOpenDetail(match);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Siparişler yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "processing" && o.status !== "processing" && o.status !== "pending") {
          return false;
        } else if (statusFilter !== "processing" && o.status !== statusFilter) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const numMatch = o.orderNumber?.toLowerCase().includes(query);
        const itemMatch = o.items?.some((i) => i.name?.toLowerCase().includes(query));
        return numMatch || itemMatch;
      }

      return true;
    });
  }, [orders, statusFilter, searchQuery]);

  const handleOpenDetail = async (order) => {
    try {
      // Fetch full details if items missing
      if (!order.items || order.items.length === 0) {
        const res = await api.getOrderById(order.id);
        if (res && res.data) {
          setSelectedOrder(res.data);
          setIsDetailModalOpen(true);
          return;
        }
      }
      setSelectedOrder(order);
      setIsDetailModalOpen(true);
    } catch {
      setSelectedOrder(order);
      setIsDetailModalOpen(true);
    }
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
    if (searchParams.get("orderId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("orderId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Cancel order execution
  const handleExecuteCancel = async () => {
    if (!cancelTargetOrder) return;
    setIsCancelling(true);
    setCancelFeedback("");

    try {
      const res = await api.cancelOrder(cancelTargetOrder.id);
      if (res && res.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) => (o.id === cancelTargetOrder.id ? { ...o, status: "cancelled" } : o))
        );
        if (selectedOrder?.id === cancelTargetOrder.id) {
          setSelectedOrder((prev) => ({ ...prev, status: "cancelled" }));
        }
        setCancelFeedback("Sipariş başarıyla iptal edildi ve stoklar iade edildi.");
        setTimeout(() => {
          setCancelTargetOrder(null);
          setCancelFeedback("");
        }, 2000);
      }
    } catch (err) {
      setCancelFeedback(`Hata: ${err.message || "Sipariş iptal edilemedi."}`);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="orders-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <nav className="orders-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Ana Sayfa</Link>
          <span className="bc-sep">/</span>
          <Link to="/profile">Hesabım</Link>
          <span className="bc-sep">/</span>
          <span className="bc-current">Siparişlerim & Takip</span>
        </nav>

        {/* Page Header */}
        <div className="orders-page-header">
          <div>
            <h1 className="orders-page-title">Siparişlerim ve Kargo Takibi</h1>
            <p className="orders-page-subtitle">
              Geçmiş ve aktif tüm siparişlerinizin aşamalarını, kargo durumunu ve fatura detaylarını
              canlı takip edin.
            </p>
          </div>
          <Link to="/products" className="btn btn-outline btn-sm">
            + Yeni Alışveriş Yap
          </Link>
        </div>

        {/* Filter Controls & Search Bar */}
        <div className="orders-toolbar">
          <div className="status-filter-pills">
            <button
              type="button"
              className={`filter-pill ${statusFilter === "all" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              Tümü ({orders.length})
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "processing" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("processing")}
            >
              📦 Hazırlananlar
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "shipped" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("shipped")}
            >
              🚚 Kargodakiler
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "delivered" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("delivered")}
            >
              ✅ Teslim Edilenler
            </button>
            <button
              type="button"
              className={`filter-pill ${statusFilter === "cancelled" ? "is-active" : ""}`}
              onClick={() => setStatusFilter("cancelled")}
            >
              🚫 İptaller
            </button>
          </div>

          <div className="order-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Sipariş no veya ürün ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="orders-alert-error" role="alert">
            <span>⚠️ {error}</span>
            <button type="button" onClick={fetchOrders}>Tekrar Dene</button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="orders-loading-skeleton">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <div className="orders-empty-card">
            <div className="oec-icon">📦</div>
            <h3>
              {searchQuery || statusFilter !== "all"
                ? "Filtreye Uygun Sipariş Bulunamadı"
                : "Henüz Bir Siparişiniz Bulunmuyor"}
            </h3>
            <p>
              {searchQuery || statusFilter !== "all"
                ? "Arama kriterlerinizi değiştirerek veya filtreleri temizleyerek tekrar deneyebilirsiniz."
                : "Mağazamızdaki yüzlerce avantajlı ürünü keşfedin ve ilk siparişinizi kolayca oluşturun."}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Filtreleri Temizle
              </button>
            ) : (
              <Link to="/products" className="btn btn-primary">
                Alışverişe Başla
              </Link>
            )}
          </div>
        ) : (
          /* Orders Cards List */
          <div className="orders-list-grid">
            {filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const currentStep = getStepIndex(order.status);
              const canCancel = order.status === "pending" || order.status === "processing";

              return (
                <div key={order.id} className="order-history-card">
                  {/* Card Header */}
                  <div className="ohc-header">
                    <div className="ohc-header-left">
                      <span className="ohc-date-label">Sipariş Tarihi</span>
                      <strong className="ohc-date">{formatDate(order.createdAt)}</strong>
                    </div>

                    <div className="ohc-header-mid">
                      <span className="ohc-num-label">Sipariş No</span>
                      <div className="ohc-code-wrap">
                        <strong className="ohc-num">{order.orderNumber}</strong>
                        <button
                          type="button"
                          className="btn-tiny-copy"
                          onClick={() => handleCopy(order.orderNumber)}
                          title="Sipariş Numarasını Kopyala"
                        >
                          📋
                        </button>
                      </div>
                    </div>

                    <div className="ohc-header-right">
                      <span className="ohc-total-label">Toplam Tutar</span>
                      <strong className="ohc-total-price">
                        {formatCurrency(order.totalPrice)}
                      </strong>
                    </div>

                    <div className="ohc-status-wrap">
                      <span className={`order-status-badge ${badge.className}`}>
                        {badge.icon} {badge.text}
                      </span>
                    </div>
                  </div>

                  {/* Stepper Progress Bar (Unless cancelled) */}
                  {order.status !== "cancelled" ? (
                    <div className="order-stepper-track">
                      {STATUS_STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx;
                        const isCurrent = currentStep === idx;
                        return (
                          <div
                            key={step.key}
                            className={`stepper-step ${isDone ? "is-done" : ""} ${
                              isCurrent ? "is-current" : ""
                            }`}
                          >
                            <div className="stepper-dot">
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <span className="stepper-text">{step.label}</span>
                          </div>
                        );
                      })}
                      <div
                        className="stepper-progress-fill"
                        style={{
                          width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                  ) : (
                    <div className="order-cancelled-notice">
                      <span>⚠️ Bu sipariş iptal edilmiştir. İlgili tutar iade edilmiş ve stoklar sisteme geri aktarılmıştır.</span>
                    </div>
                  )}

                  {/* Items Preview Row */}
                  <div className="ohc-items-preview">
                    <div className="preview-thumbs-row">
                      {(order.items || []).slice(0, 4).map((item, idx) => (
                        <div key={idx} className="preview-thumb-box" title={item.name}>
                          <img
                            src={item.image || item.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                            alt={item.name || "Ürün"}
                            className="preview-img"
                          />
                          <span className="preview-qty-tag">{item.quantity} ad.</span>
                        </div>
                      ))}
                      {(order.items?.length || 0) > 4 && (
                        <div className="preview-more-box">
                          +{order.items.length - 4} ürün
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="ohc-actions">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenDetail(order)}
                      >
                        Sipariş Detayı & Kargo
                      </button>

                      {canCancel && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-cancel-order"
                          onClick={() => setCancelTargetOrder(order)}
                        >
                          Siparişi İptal Et
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ORDER DETAIL & CARGO TRACKING MODAL */}
        {isDetailModalOpen && selectedOrder && (
          <div className="order-modal-backdrop" onClick={handleCloseDetail}>
            <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="odm-header">
                <div className="odm-header-title">
                  <h2>Sipariş Detayı & Kargo Takibi</h2>
                  <span className="odm-ord-num">{selectedOrder.orderNumber}</span>
                </div>
                <button
                  type="button"
                  className="odm-close-btn"
                  onClick={handleCloseDetail}
                  aria-label="Kapat"
                >
                  ✕
                </button>
              </div>

              <div className="odm-body">
                {/* Stepper Inside Modal */}
                {selectedOrder.status !== "cancelled" && (
                  <div className="odm-stepper-box">
                    <div className="odm-stepper-row">
                      {STATUS_STEPS.map((step, idx) => {
                        const cur = getStepIndex(selectedOrder.status);
                        const isDone = cur >= idx;
                        return (
                          <div
                            key={step.key}
                            className={`odm-step ${isDone ? "is-done" : ""} ${
                              cur === idx ? "is-active" : ""
                            }`}
                          >
                            <div className="odm-step-circle">
                              {isDone ? "✓" : idx + 1}
                            </div>
                            <strong>{step.label}</strong>
                            <p>{step.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Cargo Tracking Info Box */}
                <div className="cargo-tracking-card">
                  <div className="ctc-icon">🚚</div>
                  <div className="ctc-info">
                    <h4>Kargo Takip Bilgisi</h4>
                    <p>
                      Kargo Firması: <strong>Yurtiçi Kargo</strong> &bull; Takip No:{" "}
                      <code>YK-{selectedOrder.id?.slice(-8) || "84920194"}</code>
                    </p>
                    <span className="ctc-estimate">
                      Tahmini Teslimat: <strong>2-3 İş Günü İçerisinde</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm btn-copy-track"
                    onClick={() => handleCopy(`YK-${selectedOrder.id?.slice(-8) || "84920194"}`)}
                  >
                    {copiedCode ? "Kopyalandı! ✓" : "Kodu Kopyala"}
                  </button>
                </div>

                {/* Grid: Address & Payment Summary */}
                <div className="odm-info-grid">
                  <div className="odm-info-block">
                    <span className="oib-label">📍 Teslimat Adresi</span>
                    <strong>
                      {selectedOrder.shippingAddress?.fullName || currentUser?.name}
                    </strong>
                    <p className="oib-phone">
                      📞 {selectedOrder.shippingAddress?.phone || currentUser?.phone || "-"}
                    </p>
                    <p className="oib-address">
                      {selectedOrder.shippingAddress?.address ||
                        selectedOrder.shippingAddress?.detailedAddress ||
                        "Kayıtlı Adres"}
                      <br />
                      {selectedOrder.shippingAddress?.district},{" "}
                      {selectedOrder.shippingAddress?.city}
                    </p>
                  </div>

                  <div className="odm-info-block">
                    <span className="oib-label">💳 Ödeme & Sipariş Bilgileri</span>
                    <p>
                      <strong>Ödeme Yöntemi:</strong>{" "}
                      {selectedOrder.paymentMethod === "credit_card"
                        ? "Kredi Kartı (3D Secure)"
                        : selectedOrder.paymentMethod === "cash_on_delivery"
                        ? "Kapıda Nakit / Kart"
                        : "Banka Havalesi / EFT"}
                    </p>
                    <p>
                      <strong>Ödeme Durumu:</strong>{" "}
                      <span className="payment-paid-badge">
                        {selectedOrder.paymentStatus === "paid" ? "Ödendi ✓" : "Beklemede"}
                      </span>
                    </p>
                    <p>
                      <strong>Sipariş Tarihi:</strong> {formatDate(selectedOrder.createdAt)}
                    </p>
                    {selectedOrder.notes && (
                      <p className="oib-notes">
                        <strong>Müşteri Notu:</strong> "{selectedOrder.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="odm-items-section">
                  <h4>Siparişteki Ürünler</h4>
                  <div className="odm-table-wrap">
                    <table className="odm-items-table">
                      <thead>
                        <tr>
                          <th>Ürün</th>
                          <th>Birim Fiyat</th>
                          <th>Adet</th>
                          <th style={{ textAlign: "right" }}>Toplam</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.items || []).map((item, idx) => (
                          <tr key={idx}>
                            <td className="odm-item-cell">
                              <img
                                src={item.image || item.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200"}
                                alt={item.name}
                                className="odm-item-img"
                              />
                              <div>
                                <strong>{item.name}</strong>
                                {item.productId && (
                                  <Link
                                    to={`/products/${item.productId}`}
                                    className="odm-view-link"
                                  >
                                    Ürünü İncele ↗
                                  </Link>
                                )}
                              </div>
                            </td>
                            <td>{formatCurrency(item.price || item.unitPrice)}</td>
                            <td>{item.quantity}</td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {formatCurrency(
                                (Number(item.price || item.unitPrice) || 0) * (Number(item.quantity) || 1)
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="odm-totals-box">
                  <div className="otb-row">
                    <span>Toplam Tutar</span>
                    <strong className="otb-grand-total">
                      {formatCurrency(selectedOrder.totalPrice)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="odm-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => window.print()}
                >
                  🖨️ Faturayı / Detayı Yazdır
                </button>
                <button type="button" className="btn btn-primary" onClick={handleCloseDetail}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL ORDER CONFIRMATION MODAL */}
        {cancelTargetOrder && (
          <div className="order-modal-backdrop" onClick={() => !isCancelling && setCancelTargetOrder(null)}>
            <div className="order-cancel-modal" onClick={(e) => e.stopPropagation()}>
              <div className="ocm-icon">⚠️</div>
              <h3>Siparişi İptal Etmek İstediğinize Emin misiniz?</h3>
              <p>
                <strong>{cancelTargetOrder.orderNumber}</strong> numaralı siparişiniz iptal edilecek,
                ödemeniz iade edilecek ve ayrılan ürün stokları sisteme geri yüklenecektir.
              </p>

              {cancelFeedback && (
                <div className="cancel-feedback-msg">{cancelFeedback}</div>
              )}

              <div className="ocm-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCancelTargetOrder(null)}
                  disabled={isCancelling}
                >
                  Vazgeç
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleExecuteCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? "İptal Ediliyor..." : "Evet, Siparişi İptal Et"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrdersPage;
