import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./CheckoutPage.css";

function formatCurrency(val) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(val || 0);
}

function CheckoutPage() {
  const { items, summary, clearCart, validateLiveStock } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    title: "Ev",
    fullName: currentUser?.name || "",
    phone: currentUser?.phone || "",
    city: "İstanbul",
    district: "",
    detailedAddress: "",
    postalCode: "",
  });
  const [addressError, setAddressError] = useState("");

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState("credit_card"); // 'credit_card', 'cash_on_delivery', 'bank_transfer'
  const [cardData, setCardData] = useState({
    holder: currentUser?.name || "",
    number: "",
    expiry: "",
    cvv: "",
    use3dSecure: true,
  });
  const [cardErrors, setCardErrors] = useState({});

  // Notes & Submission states
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState(false);

  // Load addresses on mount
  useEffect(() => {
    const userId = currentUser?.id || "default";
    const saved = api.getAddresses(userId);
    setAddresses(saved);

    if (saved && saved.length > 0) {
      const defaultAddr = saved.find((a) => a.isDefault) || saved[0];
      setSelectedAddressId(defaultAddr.id);
    } else {
      setShowNewAddressForm(true);
    }

    if (items.length > 0) {
      validateLiveStock();
    }
  }, [currentUser]);

  // Credit Card formatting helpers
  const handleCardNumberChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardData((prev) => ({ ...prev, number: formatted }));
    if (cardErrors.number) setCardErrors((prev) => ({ ...prev, number: "" }));
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardData((prev) => ({ ...prev, expiry: raw }));
    if (cardErrors.expiry) setCardErrors((prev) => ({ ...prev, expiry: "" }));
  };

  const handleCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCardData((prev) => ({ ...prev, cvv: raw }));
    if (cardErrors.cvv) setCardErrors((prev) => ({ ...prev, cvv: "" }));
  };

  // Add new address
  const handleSaveNewAddress = (e) => {
    e.preventDefault();
    setAddressError("");

    if (!addressForm.fullName.trim()) {
      setAddressError("Ad ve soyad alanı zorunludur.");
      return;
    }
    if (!addressForm.phone.trim()) {
      setAddressError("Telefon numarası zorunludur.");
      return;
    }
    if (!addressForm.city.trim() || !addressForm.district.trim()) {
      setAddressError("İl ve ilçe seçimi zorunludur.");
      return;
    }
    if (!addressForm.detailedAddress.trim()) {
      setAddressError("Açık adres alanı zorunludur.");
      return;
    }

    const newAddr = {
      id: `addr-${Date.now()}`,
      title: addressForm.title || "Ev",
      fullName: addressForm.fullName.trim(),
      phone: addressForm.phone.trim(),
      city: addressForm.city.trim(),
      district: addressForm.district.trim(),
      detailedAddress: addressForm.detailedAddress.trim(),
      postalCode: addressForm.postalCode.trim() || "34000",
      isDefault: addresses.length === 0,
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    api.saveAddresses(updated, currentUser?.id || "default");
    setSelectedAddressId(newAddr.id);
    setShowNewAddressForm(false);
  };

  // Validate and submit order
  const handlePlaceOrder = async () => {
    setSubmitError("");

    if (!selectedAddressId) {
      setSubmitError("Lütfen bir teslimat adresi seçiniz veya yeni adres ekleyiniz.");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      setSubmitError("Seçilen teslimat adresi bulunamadı.");
      return;
    }

    // Card validations if credit_card
    if (paymentMethod === "credit_card") {
      const errors = {};
      const rawNumber = cardData.number.replace(/\s/g, "");
      if (rawNumber.length < 16) {
        errors.number = "Lütfen 16 haneli kart numaranızı eksiksiz giriniz.";
      }
      if (!cardData.holder.trim()) {
        errors.holder = "Kart üzerindeki isim zorunludur.";
      }
      if (!cardData.expiry || cardData.expiry.length < 5) {
        errors.expiry = "Son kullanma tarihi geçersiz (AA/YY).";
      }
      if (!cardData.cvv || cardData.cvv.length < 3) {
        errors.cvv = "CVV en az 3 haneli olmalıdır.";
      }

      if (Object.keys(errors).length > 0) {
        setCardErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Double check live stock
      const stockCheck = await validateLiveStock();
      if (stockCheck && !stockCheck.isValid) {
        setIsSubmitting(false);
        setSubmitError("Bazı ürünlerin stok durumu değişti. Lütfen sepetinizi kontrol ediniz.");
        return;
      }

      // 2. Call backend orders API
      const payload = {
        shippingAddress: {
          title: selectedAddr.title,
          fullName: selectedAddr.fullName,
          phone: selectedAddr.phone,
          city: selectedAddr.city,
          district: selectedAddr.district,
          address: selectedAddr.detailedAddress || selectedAddr.address,
          postalCode: selectedAddr.postalCode,
        },
        paymentMethod,
        notes: orderNotes.trim() || null,
      };

      const res = await api.createOrder(payload);

      if (res && res.success && res.data) {
        // Clear cart and show confirmation screen
        clearCart();
        setCreatedOrder(res.data);
      } else {
        throw new Error(res.message || "Sipariş oluşturulamadı.");
      }
    } catch (err) {
      setSubmitError(
        err.message || "Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyiniz."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = () => {
    if (createdOrder?.orderNumber) {
      navigator.clipboard.writeText(createdOrder.orderNumber);
      setCopiedOrderNumber(true);
      setTimeout(() => setCopiedOrderNumber(false), 3000);
    }
  };

  // SUCCESS CONFIRMATION SCREEN
  if (createdOrder) {
    return (
      <div className="checkout-page checkout-success-view">
        <div className="container">
          <div className="success-card">
            <div className="success-icon-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <span className="success-tag">Sipariş Alındı 🎉</span>
            <h1 className="success-title">Tebrikler, Siparişiniz Başarıyla Oluşturuldu!</h1>
            <p className="success-subtitle">
              Siparişiniz hazırlanmak üzere sistemimize kaydedildi. Kargonuz yola çıktığında
              bilgilendirileceksiniz.
            </p>

            <div className="order-number-banner">
              <span className="on-label">Sipariş Takip Numaranız</span>
              <div className="on-row">
                <strong className="on-code">{createdOrder.orderNumber}</strong>
                <button
                  type="button"
                  className="btn-copy-code"
                  onClick={handleCopyOrderNumber}
                  title="Numarayı Kopyala"
                >
                  {copiedOrderNumber ? "Kopyalandı! ✓" : "Kopyala"}
                </button>
              </div>
            </div>

            <div className="success-details-grid">
              <div className="succ-detail-box">
                <span className="sdb-label">Teslimat Adresi</span>
                <strong>{createdOrder.shippingAddress?.title || "Kayıtlı Adres"}</strong>
                <p>
                  {createdOrder.shippingAddress?.fullName} <br />
                  {createdOrder.shippingAddress?.address ||
                    createdOrder.shippingAddress?.detailedAddress}{" "}
                  <br />
                  {createdOrder.shippingAddress?.district},{" "}
                  {createdOrder.shippingAddress?.city}
                </p>
              </div>

              <div className="succ-detail-box">
                <span className="sdb-label">Ödeme & Tutar</span>
                <strong>
                  {createdOrder.paymentMethod === "credit_card"
                    ? "Kredi Kartı (3D Secure)"
                    : createdOrder.paymentMethod === "cash_on_delivery"
                    ? "Kapıda Ödeme"
                    : "Havale / EFT"}
                </strong>
                <p className="succ-price-highlight">
                  {formatCurrency(createdOrder.totalPrice)}
                </p>
                <span className="succ-status-pill">Durum: Hazırlanıyor</span>
              </div>
            </div>

            <div className="success-action-buttons">
              <Link to="/products" className="btn btn-outline btn-lg">
                Alışverişe Devam Et
              </Link>
              <Link to="/profile" className="btn btn-primary btn-lg">
                Profilime Git & Siparişleri Gör
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART GUARD
  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty-card">
            <div className="empty-cart-icon">🛒</div>
            <h2>Sepetiniz Boş</h2>
            <p>Sipariş oluşturabilmek için sepetinize en az bir ürün eklemelisiniz.</p>
            <Link to="/products" className="btn btn-primary">
              Ürünleri Keşfet
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Checkout Header & Stepper */}
        <div className="checkout-header">
          <nav className="checkout-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Ana Sayfa</Link>
            <span className="bc-sep">/</span>
            <Link to="/cart">Sepetim</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Siparişi Tamamla</span>
          </nav>

          <h1 className="checkout-title">Güvenli Sipariş Tamamlama</h1>

          <div className="checkout-stepper">
            <div className="step-item is-completed">
              <span className="step-num">✓</span>
              <span className="step-label">Sepet</span>
            </div>
            <div className="step-line is-active" />
            <div className="step-item is-active">
              <span className="step-num">2</span>
              <span className="step-label">Adres & Ödeme</span>
            </div>
            <div className="step-line" />
            <div className="step-item">
              <span className="step-num">3</span>
              <span className="step-label">Sipariş Onayı</span>
            </div>
          </div>
        </div>

        {/* Global Submit Error Banner */}
        {submitError && (
          <div className="checkout-error-banner" role="alert">
            <span className="ceb-icon">⚠️</span>
            <span>{submitError}</span>
          </div>
        )}

        <div className="checkout-layout">
          {/* LEFT COLUMN: Address & Payment Forms */}
          <div className="checkout-main">
            {/* STEP 1: Shipping Address Selection */}
            <section className="checkout-section-card">
              <div className="section-card-header">
                <div className="sch-title-wrap">
                  <span className="section-badge">1</span>
                  <h2>Teslimat Adresi</h2>
                </div>
                {!showNewAddressForm && (
                  <button
                    type="button"
                    className="btn-add-address-toggle"
                    onClick={() => setShowNewAddressForm(true)}
                  >
                    + Yeni Adres Ekle
                  </button>
                )}
              </div>

              {/* Saved Addresses List */}
              <div className="addresses-grid">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`address-card-choice ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div className="acc-radio-row">
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={isSelected}
                          onChange={() => setSelectedAddressId(addr.id)}
                        />
                        <strong>{addr.title || "Adres"}</strong>
                        {addr.isDefault && <span className="default-pill">Varsayılan</span>}
                      </div>
                      <p className="acc-recipient">{addr.fullName} &bull; {addr.phone}</p>
                      <p className="acc-text">
                        {addr.detailedAddress || addr.address}
                        <br />
                        {addr.district}, {addr.city}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* New Address Form Modal/Inline */}
              {showNewAddressForm && (
                <form className="new-address-inline-form" onSubmit={handleSaveNewAddress}>
                  <div className="na-form-header">
                    <h3>Yeni Teslimat Adresi Ekle</h3>
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn-close-form"
                        onClick={() => setShowNewAddressForm(false)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {addressError && <p className="form-error-inline">{addressError}</p>}

                  <div className="form-grid-2">
                    <div className="input-group">
                      <label>Adres Başlığı *</label>
                      <input
                        type="text"
                        placeholder="Örn: Ev, İşyeri"
                        value={addressForm.title}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, title: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>Ad Soyad *</label>
                      <input
                        type="text"
                        placeholder="Teslim alacak kişi"
                        value={addressForm.fullName}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, fullName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="form-grid-3">
                    <div className="input-group">
                      <label>Telefon *</label>
                      <input
                        type="tel"
                        placeholder="05XX XXX XX XX"
                        value={addressForm.phone}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, phone: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>İl *</label>
                      <input
                        type="text"
                        placeholder="Örn: İstanbul"
                        value={addressForm.city}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>İlçe *</label>
                      <input
                        type="text"
                        placeholder="Örn: Kadıköy"
                        value={addressForm.district}
                        onChange={(e) =>
                          setAddressForm({ ...addressForm, district: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Açık Adres (Cadde, Sokak, No, Daire) *</label>
                    <textarea
                      rows="2"
                      placeholder="Kuryenin adresi kolay bulabilmesi için detaylı yazınız..."
                      value={addressForm.detailedAddress}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, detailedAddress: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="form-action-row">
                    {addresses.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowNewAddressForm(false)}
                      >
                        İptal
                      </button>
                    )}
                    <button type="submit" className="btn btn-primary">
                      Adresi Kaydet ve Kullan
                    </button>
                  </div>
                </form>
              )}
            </section>

            {/* STEP 2: Payment Method */}
            <section className="checkout-section-card">
              <div className="section-card-header">
                <div className="sch-title-wrap">
                  <span className="section-badge">2</span>
                  <h2>Ödeme Yöntemi</h2>
                </div>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="payment-method-tabs">
                <button
                  type="button"
                  className={`pm-tab-btn ${paymentMethod === "credit_card" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("credit_card")}
                >
                  <span className="pm-tab-icon">💳</span>
                  <span>Kredi / Banka Kartı</span>
                </button>
                <button
                  type="button"
                  className={`pm-tab-btn ${paymentMethod === "cash_on_delivery" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("cash_on_delivery")}
                >
                  <span className="pm-tab-icon">💵</span>
                  <span>Kapıda Ödeme</span>
                </button>
                <button
                  type="button"
                  className={`pm-tab-btn ${paymentMethod === "bank_transfer" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("bank_transfer")}
                >
                  <span className="pm-tab-icon">🏦</span>
                  <span>Havale / EFT</span>
                </button>
              </div>

              {/* Credit Card Form & Virtual Preview */}
              {paymentMethod === "credit_card" && (
                <div className="credit-card-experience">
                  {/* Virtual Card Widget */}
                  <div className="virtual-card-preview">
                    <div className="vcard-top">
                      <div className="vcard-chip" />
                      <span className="vcard-brand">Mastercard</span>
                    </div>
                    <div className="vcard-number">
                      {cardData.number || "•••• •••• •••• ••••"}
                    </div>
                    <div className="vcard-bottom">
                      <div className="vcard-holder">
                        <span className="vcard-sub">KART SAHİBİ</span>
                        <strong>{cardData.holder || "AD SOYAD"}</strong>
                      </div>
                      <div className="vcard-expiry">
                        <span className="vcard-sub">SKT</span>
                        <strong>{cardData.expiry || "MM/YY"}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Card Input Fields */}
                  <div className="credit-card-fields">
                    <div className="input-group">
                      <label>Kart Üzerindeki İsim *</label>
                      <input
                        type="text"
                        placeholder="Örn: AHMET YILMAZ"
                        value={cardData.holder}
                        onChange={(e) => {
                          setCardData({ ...cardData, holder: e.target.value });
                          if (cardErrors.holder)
                            setCardErrors((prev) => ({ ...prev, holder: "" }));
                        }}
                      />
                      {cardErrors.holder && (
                        <span className="field-error-text">{cardErrors.holder}</span>
                      )}
                    </div>

                    <div className="input-group">
                      <label>Kart Numarası *</label>
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        value={cardData.number}
                        onChange={handleCardNumberChange}
                      />
                      {cardErrors.number && (
                        <span className="field-error-text">{cardErrors.number}</span>
                      )}
                    </div>

                    <div className="form-grid-2">
                      <div className="input-group">
                        <label>Son Kullanma Tarihi *</label>
                        <input
                          type="text"
                          placeholder="AA/YY"
                          value={cardData.expiry}
                          onChange={handleExpiryChange}
                        />
                        {cardErrors.expiry && (
                          <span className="field-error-text">{cardErrors.expiry}</span>
                        )}
                      </div>

                      <div className="input-group">
                        <label>Güvenlik Kodu (CVV) *</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength="4"
                          value={cardData.cvv}
                          onChange={handleCvvChange}
                        />
                        {cardErrors.cvv && (
                          <span className="field-error-text">{cardErrors.cvv}</span>
                        )}
                      </div>
                    </div>

                    <label className="checkbox-label-3d">
                      <input
                        type="checkbox"
                        checked={cardData.use3dSecure}
                        onChange={(e) =>
                          setCardData({ ...cardData, use3dSecure: e.target.checked })
                        }
                      />
                      <span>3D Secure ile güvenli SMS doğrulaması yapmak istiyorum</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Cash On Delivery Info */}
              {paymentMethod === "cash_on_delivery" && (
                <div className="alt-payment-info-box">
                  <div className="api-icon">📦</div>
                  <div className="api-text">
                    <h4>Kapıda Nakit veya Kredi Kartı ile Ödeme</h4>
                    <p>
                      Siparişiniz adresinize teslim edildiğinde kapıda kuryeye nakit veya
                      kredi kartınızla tek çekim olarak ödeme yapabilirsiniz. Ek hizmet bedeli
                      alınmamaktadır.
                    </p>
                  </div>
                </div>
              )}

              {/* Bank Transfer Info */}
              {paymentMethod === "bank_transfer" && (
                <div className="alt-payment-info-box">
                  <div className="api-icon">🏦</div>
                  <div className="api-text">
                    <h4>Banka Havalesi / FAST / EFT ile Ödeme</h4>
                    <p>
                      Siparişinizi tamamladıktan sonra sipariş numaranızı açıklama kısmına
                      yazarak aşağıdaki IBAN hesabımıza 24 saat içinde transfer edebilirsiniz:
                    </p>
                    <div className="iban-display-card">
                      <strong>Ziraat Bankası</strong>
                      <code>TR12 0001 0090 1087 6543 2100 01</code>
                      <span>Alıcı: Mini E-Commerce Platform Ltd. Şti.</span>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* STEP 3: Order Notes */}
            <section className="checkout-section-card">
              <div className="section-card-header">
                <div className="sch-title-wrap">
                  <span className="section-badge">3</span>
                  <h2>Sipariş Notu (Opsiyonel)</h2>
                </div>
              </div>
              <textarea
                className="order-notes-textarea"
                rows="2"
                placeholder="Kargo görevlisine iletmek istediğiniz özel bir talimat varsa yazabilirsiniz (örn: Zile basmayın, güvenliğe bırakın)..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
              />
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Order Summary */}
          <aside className="checkout-sidebar">
            <div className="checkout-summary-card">
              <h3 className="csc-title">Sipariş Özeti</h3>

              {/* Mini Item List */}
              <div className="checkout-items-list">
                {items.map((item) => (
                  <div key={item.id} className="checkout-item-row">
                    <img
                      src={item.image || item.imageUrl}
                      alt={item.name}
                      className="checkout-item-thumb"
                    />
                    <div className="checkout-item-info">
                      <p className="checkout-item-name">{item.name}</p>
                      <span className="checkout-item-qty">
                        {item.quantity} adet &bull; {formatCurrency(item.price)}
                      </span>
                    </div>
                    <strong className="checkout-item-total">
                      {formatCurrency(item.price * item.quantity)}
                    </strong>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="csc-breakdown">
                <div className="csc-row">
                  <span>Ürünler Toplamı</span>
                  <span>{formatCurrency(summary.subtotal)}</span>
                </div>
                <div className="csc-row">
                  <span>Kargo Ücreti</span>
                  <span className={summary.isFreeShipping ? "free-text" : ""}>
                    {summary.isFreeShipping ? "Ücretsiz" : formatCurrency(summary.shippingCost)}
                  </span>
                </div>
                {summary.activeCoupon && (
                  <div className="csc-row discount-row">
                    <span>Kupon ({summary.activeCoupon.code})</span>
                    <span>-{formatCurrency(summary.discountAmount)}</span>
                  </div>
                )}
                <div className="csc-divider" />
                <div className="csc-row csc-total-row">
                  <strong>Genel Toplam</strong>
                  <strong className="csc-grand-total">
                    {formatCurrency(summary.grandTotal)}
                  </strong>
                </div>
              </div>

              {/* Place Order CTA Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg btn-place-order"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
              >
                {isSubmitting ? (
                  <span className="btn-loading-wrap">
                    <span className="spin-circle" /> Sipariş Oluşturuluyor...
                  </span>
                ) : (
                  <span>Siparişi Onayla ve Öde ({formatCurrency(summary.grandTotal)})</span>
                )}
              </button>

              {/* Security Trust Badges */}
              <div className="checkout-trust-box">
                <div className="ct-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>256-Bit SSL Güvenli Alışveriş</span>
                </div>
                <div className="ct-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  </svg>
                  <span>14 Gün Koşulsuz Kolay İade</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
