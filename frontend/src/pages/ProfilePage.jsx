import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProfilePage.css";

function ProfilePage({ currentUser, onLogout }) {
  const [profile, setProfile] = useState(currentUser || api.getCurrentUser());
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    phone: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Address Management State
  const [addresses, setAddresses] = useState([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    title: "",
    fullName: "",
    phone: "",
    city: "",
    district: "",
    detailedAddress: "",
    postalCode: "",
    isDefault: false,
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});
  const [addressFeedback, setAddressFeedback] = useState("");

  // Load profile from server on mount
  useEffect(() => {
    setIsLoading(true);
    api
      .getMe()
      .then((res) => {
        if (res?.data) {
          setProfile(res.data);
          api.setCurrentUser(res.data);
        }
      })
      .catch((err) => {
        console.warn("Profil yüklenemedi:", err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Sync profile form data when profile is ready or editing starts
  useEffect(() => {
    if (profile) {
      setProfileFormData({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);

  // Load addresses per user
  useEffect(() => {
    const userId = profile?.id || "default";
    const userAddresses = api.getAddresses(userId);
    setAddresses(userAddresses);
  }, [profile?.id]);

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      api.logout();
    }
    navigate("/");
  };

  // --- Profile Edit Handlers ---
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileFormData.name.trim()) {
      setProfileError("Ad Soyad alanı boş bırakılamaz.");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      const res = await api.updateProfile({
        name: profileFormData.name.trim(),
        phone: profileFormData.phone.trim(),
      });

      const updated = res?.data || {
        ...profile,
        name: profileFormData.name.trim(),
        phone: profileFormData.phone.trim(),
      };

      setProfile(updated);
      setProfileSuccess("Profil bilgileriniz başarıyla güncellendi.");
      setIsEditingProfile(false);
    } catch (err) {
      setProfileError(err.message || "Profil güncellenirken bir hata oluştu.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // --- Password Change Handlers ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwordFormData;

    if (!currentPassword) {
      setPasswordError("Lütfen mevcut şifrenizi giriniz.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Yeni şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Yeni şifreler birbiriyle eşleşmiyor.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      await api.updateProfile({
        currentPassword,
        newPassword,
      });

      setPasswordSuccess("Şifreniz başarıyla değiştirildi.");
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsChangingPassword(false);
    } catch (err) {
      setPasswordError(err.message || "Şifre değiştirilirken bir hata oluştu.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // --- Address Handlers ---
  const handleOpenNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressFormData({
      title: "",
      fullName: profile?.name || "",
      phone: profile?.phone || "",
      city: "",
      district: "",
      detailedAddress: "",
      postalCode: "",
      isDefault: addresses.length === 0,
    });
    setAddressFormErrors({});
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddressModal = (addr) => {
    setEditingAddressId(addr.id);
    setAddressFormData({
      title: addr.title || "",
      fullName: addr.fullName || "",
      phone: addr.phone || "",
      city: addr.city || "",
      district: addr.district || "",
      detailedAddress: addr.detailedAddress || "",
      postalCode: addr.postalCode || "",
      isDefault: !!addr.isDefault,
    });
    setAddressFormErrors({});
    setIsAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddressId(null);
    setAddressFormErrors({});
  };

  const validateAddressForm = () => {
    const errs = {};
    if (!addressFormData.title.trim()) errs.title = "Adres başlığı zorunludur.";
    if (!addressFormData.fullName.trim()) errs.fullName = "Alıcı adı ve soyadı zorunludur.";
    if (!addressFormData.phone.trim()) errs.phone = "İletişim telefonu zorunludur.";
    if (!addressFormData.city.trim()) errs.city = "Şehir (İl) zorunludur.";
    if (!addressFormData.district.trim()) errs.district = "İlçe zorunludur.";
    if (!addressFormData.detailedAddress.trim()) errs.detailedAddress = "Açık adres zorunludur.";
    setAddressFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!validateAddressForm()) return;

    const userId = profile?.id || "default";
    let updatedList = [];

    if (editingAddressId) {
      // Editing existing address
      updatedList = addresses.map((addr) => {
        if (addr.id === editingAddressId) {
          return {
            ...addr,
            ...addressFormData,
          };
        }
        return addressFormData.isDefault ? { ...addr, isDefault: false } : addr;
      });
      setAddressFeedback("Adres başarıyla güncellendi.");
    } else {
      // Adding new address
      const newAddress = {
        id: `addr-${Date.now()}`,
        ...addressFormData,
        isDefault: addresses.length === 0 || addressFormData.isDefault,
      };

      if (newAddress.isDefault) {
        updatedList = addresses.map((a) => ({ ...a, isDefault: false }));
        updatedList.push(newAddress);
      } else {
        updatedList = [...addresses, newAddress];
      }
      setAddressFeedback("Yeni teslimat adresi başarıyla eklendi.");
    }

    setAddresses(updatedList);
    api.saveAddresses(updatedList, userId);
    handleCloseAddressModal();

    setTimeout(() => {
      setAddressFeedback("");
    }, 4000);
  };

  const handleDeleteAddress = (id) => {
    if (!window.confirm("Bu teslimat adresini silmek istediğinize emin misiniz?")) return;

    const userId = profile?.id || "default";
    const filtered = addresses.filter((a) => a.id !== id);

    // If deleted address was default, make the first one default
    if (filtered.length > 0 && !filtered.some((a) => a.isDefault)) {
      filtered[0].isDefault = true;
    }

    setAddresses(filtered);
    api.saveAddresses(filtered, userId);
    setAddressFeedback("Adres başarıyla silindi.");
    setTimeout(() => {
      setAddressFeedback("");
    }, 4000);
  };

  const handleSetDefaultAddress = (id) => {
    const userId = profile?.id || "default";
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    setAddresses(updated);
    api.saveAddresses(updated, userId);
    setAddressFeedback("Varsayılan teslimat adresi güncellendi.");
    setTimeout(() => {
      setAddressFeedback("");
    }, 4000);
  };

  const formattedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Bilinmiyor";

  return (
    <div className="profile-page">
      <div className="container profile-container">
        {/* Profile Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-card">
            <div className="profile-avatar">
              {profile?.name
                ?.split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "👤"}
            </div>
            <h2 className="profile-name">{profile?.name || "Kullanıcı"}</h2>
            <p className="profile-email">{profile?.email}</p>
            <div className="profile-role-badge">
              {profile?.role === "admin" ? "🛡️ Sistem Yöneticisi" : "🛍️ Müşteri Hesabı"}
            </div>
          </div>

          <nav className="profile-nav-menu">
            <button
              type="button"
              className={`profile-nav-item ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Kişisel Bilgiler
            </button>

            <button
              type="button"
              className={`profile-nav-item ${activeTab === "addresses" ? "active" : ""}`}
              onClick={() => setActiveTab("addresses")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Adreslerim ({addresses.length})
            </button>

            <button
              type="button"
              className={`profile-nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Siparişlerim
            </button>

            <button
              type="button"
              className="profile-nav-item logout"
              onClick={handleLogoutClick}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Güvenli Çıkış
            </button>
          </nav>
        </aside>

        {/* Profile Main Content */}
        <main className="profile-main">
          {/* TAB 1: Personal Information */}
          {activeTab === "info" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3>Kişisel Hesap Bilgileri</h3>
                  <p className="card-subtitle">Profil detaylarınızı görüntüleyin ve güncelleyin</p>
                </div>
                {!isEditingProfile && !isChangingPassword && (
                  <div className="header-actions-group">
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setIsChangingPassword(false);
                      }}
                    >
                      ✏️ Bilgileri Düzenle
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setIsChangingPassword(true);
                        setIsEditingProfile(false);
                      }}
                    >
                      🔒 Şifre Değiştir
                    </button>
                  </div>
                )}
              </div>

              {profileSuccess && (
                <div className="profile-alert success">
                  <span>✓ {profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="profile-alert error">
                  <span>⚠️ {profileError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="profile-alert success">
                  <span>✓ {passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="profile-alert error">
                  <span>⚠️ {passwordError}</span>
                </div>
              )}

              {/* View Mode */}
              {!isEditingProfile && !isChangingPassword && (
                <div className="profile-info-grid">
                  <div className="info-group">
                    <label>Ad ve Soyad</label>
                    <p className="info-val">{profile?.name || "-"}</p>
                  </div>

                  <div className="info-group">
                    <label>E-posta Adresi</label>
                    <p className="info-val">{profile?.email || "-"}</p>
                  </div>

                  <div className="info-group">
                    <label>Telefon Numarası</label>
                    <p className="info-val">{profile?.phone || "Belirtilmemiş"}</p>
                  </div>

                  <div className="info-group">
                    <label>Kullanıcı Rolü</label>
                    <p className="info-val capitalize">{profile?.role || "user"}</p>
                  </div>

                  <div className="info-group">
                    <label>Üyelik Tarihi</label>
                    <p className="info-val">{formattedDate}</p>
                  </div>

                  <div className="info-group">
                    <label>Hesap Durumu</label>
                    <p className="info-val text-success">✓ Onaylı ve Güvenli</p>
                  </div>
                </div>
              )}

              {/* Edit Profile Form */}
              {isEditingProfile && (
                <form onSubmit={handleProfileSubmit} className="profile-edit-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="edit-name">Ad ve Soyad *</label>
                      <input
                        id="edit-name"
                        type="text"
                        value={profileFormData.name}
                        onChange={(e) =>
                          setProfileFormData((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder="Adınızı giriniz"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="edit-phone">Telefon Numarası</label>
                      <input
                        id="edit-phone"
                        type="tel"
                        value={profileFormData.phone}
                        onChange={(e) =>
                          setProfileFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="0555 123 45 67"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>E-posta Adresi (Değiştirilemez)</label>
                    <input type="text" value={profile?.email || ""} disabled className="input-disabled" />
                    <span className="field-hint">E-posta adresi güvenlik nedeniyle değiştirilemez.</span>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isUpdatingProfile}
                    >
                      {isUpdatingProfile ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileError("");
                      }}
                      disabled={isUpdatingProfile}
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              )}

              {/* Password Change Form */}
              {isChangingPassword && (
                <form onSubmit={handlePasswordSubmit} className="profile-edit-form">
                  <div className="form-group">
                    <label htmlFor="curr-pass">Mevcut Şifre *</label>
                    <input
                      id="curr-pass"
                      type="password"
                      value={passwordFormData.currentPassword}
                      onChange={(e) =>
                        setPasswordFormData((prev) => ({
                          ...prev,
                          currentPassword: e.target.value,
                        }))
                      }
                      placeholder="Mevcut şifrenizi giriniz"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="new-pass">Yeni Şifre * (En az 6 karakter)</label>
                      <input
                        id="new-pass"
                        type="password"
                        value={passwordFormData.newPassword}
                        onChange={(e) =>
                          setPasswordFormData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="Yeni şifrenizi giriniz"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="conf-pass">Yeni Şifre Tekrar *</label>
                      <input
                        id="conf-pass"
                        type="password"
                        value={passwordFormData.confirmPassword}
                        onChange={(e) =>
                          setPasswordFormData((prev) => ({
                            ...prev,
                            confirmPassword: e.target.value,
                          }))
                        }
                        placeholder="Yeni şifreyi tekrar giriniz"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setPasswordError("");
                      }}
                      disabled={isUpdatingPassword}
                    >
                      Vazgeç
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Address Management */}
          {activeTab === "addresses" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3>Kayıtlı Teslimat Adresleri</h3>
                  <p className="card-subtitle">
                    Siparişlerinizde hızlı teslimat için adreslerinizi yönetin
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenNewAddressModal}
                >
                  + Yeni Adres Ekle
                </button>
              </div>

              {addressFeedback && (
                <div className="profile-alert success">
                  <span>✓ {addressFeedback}</span>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="profile-empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <h4>Henüz kayıtlı teslimat adresiniz bulunmuyor</h4>
                  <p>
                    Alışverişlerinizi tek tıkla tamamlamak için hemen ilk teslimat adresinizi ekleyin.
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: "1.25rem" }}
                    onClick={handleOpenNewAddressModal}
                  >
                    + İlk Adresinizi Ekleyin
                  </button>
                </div>
              ) : (
                <div className="address-grid">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`address-card ${addr.isDefault ? "is-default" : ""}`}
                    >
                      <div className="address-card-top">
                        <div className="address-badge-group">
                          <span className="address-title-tag">
                            {addr.title.toLowerCase().includes("iş") || addr.title.toLowerCase().includes("ofis")
                              ? "🏢 "
                              : "🏠 "}
                            {addr.title}
                          </span>
                          {addr.isDefault && (
                            <span className="address-default-badge">
                              ⭐ Varsayılan Adres
                            </span>
                          )}
                        </div>

                        <div className="address-card-actions">
                          <button
                            type="button"
                            className="address-action-btn edit"
                            onClick={() => handleOpenEditAddressModal(addr)}
                            title="Adresi Düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="address-action-btn delete"
                            onClick={() => handleDeleteAddress(addr.id)}
                            title="Adresi Sil"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <div className="address-card-body">
                        <h4 className="address-recipient-name">{addr.fullName}</h4>
                        <p className="address-recipient-phone">📞 {addr.phone}</p>
                        <p className="address-detail-text">{addr.detailedAddress}</p>
                        <p className="address-location">
                          📍 {addr.district} / {addr.city} {addr.postalCode ? `(${addr.postalCode})` : ""}
                        </p>
                      </div>

                      {!addr.isDefault && (
                        <div className="address-card-footer">
                          <button
                            type="button"
                            className="btn-set-default"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                          >
                            Varsayılan Olarak Ayarla
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Orders Placeholder */}
          {activeTab === "orders" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <div>
                  <h3>Sipariş Geçmişi</h3>
                  <p className="card-subtitle">Verdiğiniz siparişlerin durumunu ve detaylarını takip edin</p>
                </div>
              </div>
              <div className="profile-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <h4>Henüz bir siparişiniz bulunmuyor</h4>
                <p>Favori ürünlerinizi sepetinize ekleyerek ilk siparişinizi kolayca oluşturabilirsiniz.</p>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: "1rem" }}>
                  Ürün Kataloğuna Göz At
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Address Add / Edit Modal */}
      {isAddressModalOpen && (
        <div className="modal-backdrop" onClick={handleCloseAddressModal}>
          <div className="modal-dialog address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAddressId ? "Teslimat Adresini Düzenle" : "Yeni Teslimat Adresi Ekle"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseAddressModal}
                aria-label="Kapat"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddressSubmit} className="modal-body address-form">
              <div className="form-group">
                <label htmlFor="addr-title">Adres Başlığı *</label>
                <input
                  id="addr-title"
                  type="text"
                  placeholder="Örn: Evim, İş Yeri, Yazlık"
                  value={addressFormData.title}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className={addressFormErrors.title ? "has-error" : ""}
                />
                {addressFormErrors.title && (
                  <span className="field-error">{addressFormErrors.title}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="addr-fullname">Alıcı Adı ve Soyadı *</label>
                  <input
                    id="addr-fullname"
                    type="text"
                    placeholder="Ad ve Soyad"
                    value={addressFormData.fullName}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, fullName: e.target.value }))
                    }
                    className={addressFormErrors.fullName ? "has-error" : ""}
                  />
                  {addressFormErrors.fullName && (
                    <span className="field-error">{addressFormErrors.fullName}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="addr-phone">İletişim Telefonu *</label>
                  <input
                    id="addr-phone"
                    type="tel"
                    placeholder="0555 123 45 67"
                    value={addressFormData.phone}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    className={addressFormErrors.phone ? "has-error" : ""}
                  />
                  {addressFormErrors.phone && (
                    <span className="field-error">{addressFormErrors.phone}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="addr-city">Şehir (İl) *</label>
                  <input
                    id="addr-city"
                    type="text"
                    placeholder="Örn: İstanbul"
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                    className={addressFormErrors.city ? "has-error" : ""}
                  />
                  {addressFormErrors.city && (
                    <span className="field-error">{addressFormErrors.city}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="addr-district">İlçe *</label>
                  <input
                    id="addr-district"
                    type="text"
                    placeholder="Örn: Kadıköy"
                    value={addressFormData.district}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, district: e.target.value }))
                    }
                    className={addressFormErrors.district ? "has-error" : ""}
                  />
                  {addressFormErrors.district && (
                    <span className="field-error">{addressFormErrors.district}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="addr-postal">Posta Kodu</label>
                  <input
                    id="addr-postal"
                    type="text"
                    placeholder="Örn: 34710"
                    value={addressFormData.postalCode}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="addr-detail">Açık Adres (Cadde, Sokak, No, Daire) *</label>
                <textarea
                  id="addr-detail"
                  rows="3"
                  placeholder="Mahalle, cadde, sokak ve bina numarası gibi teslimat detaylarını yazınız..."
                  value={addressFormData.detailedAddress}
                  onChange={(e) =>
                    setAddressFormData((prev) => ({
                      ...prev,
                      detailedAddress: e.target.value,
                    }))
                  }
                  className={addressFormErrors.detailedAddress ? "has-error" : ""}
                />
                {addressFormErrors.detailedAddress && (
                  <span className="field-error">{addressFormErrors.detailedAddress}</span>
                )}
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={addressFormData.isDefault}
                    onChange={(e) =>
                      setAddressFormData((prev) => ({ ...prev, isDefault: e.target.checked }))
                    }
                  />
                  <span className="checkbox-custom" />
                  <span>Bu adresi varsayılan teslimat adresi olarak ayarla</span>
                </label>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={handleCloseAddressModal}>
                  Vazgeç
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAddressId ? "Değişiklikleri Kaydet" : "Adresi Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
