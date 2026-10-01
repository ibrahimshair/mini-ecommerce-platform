import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "./ProfilePage.css";

function ProfilePage({ currentUser, onLogout }) {
  const [profile, setProfile] = useState(currentUser || api.getCurrentUser());
  const [activeTab, setActiveTab] = useState("info");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      api.logout();
    }
    navigate("/");
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
              className={`profile-nav-item ${activeTab === "addresses" ? "active" : ""}`}
              onClick={() => setActiveTab("addresses")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Adreslerim
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
          {activeTab === "info" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Kişisel Hesap Bilgileri</h3>
                <span className="profile-status-pill">● Aktif Oturum</span>
              </div>

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
            </div>
          )}

          {activeTab === "orders" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Sipariş Geçmişi</h3>
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
                  Alışverişe Başla
                </Link>
              </div>
            </div>
          )}

          {activeTab === "addresses" && (
            <div className="profile-card">
              <div className="profile-card-header">
                <h3>Kayıtlı Teslimat Adresleri</h3>
              </div>
              <div className="profile-empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <h4>Henüz kayıtlı adresiniz bulunmuyor</h4>
                <p>Sipariş adımlarında hızlı teslimat için yeni teslimat adresi tanımlayabilirsiniz.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ProfilePage;
