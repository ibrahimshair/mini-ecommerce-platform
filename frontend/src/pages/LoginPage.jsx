import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

function LoginPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // If redirected from a protected route, remember where to go back
  const from = location.state?.from?.pathname || "/profile";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to target page
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGeneralError("");
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Lütfen geçerli bir e-posta adresi giriniz.";
    }

    if (!formData.password) {
      newErrors.password = "Lütfen şifrenizi giriniz.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const res = await login({
        email: formData.email,
        password: formData.password,
      });

      const loggedInUser = res?.data?.user;
      setSuccessMessage(`Hoş geldiniz, ${loggedInUser?.name || "Kullanıcı"}! Giriş başarılı.`);

      if (onAuthSuccess && loggedInUser) {
        onAuthSuccess(loggedInUser);
      }

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 800);
    } catch (err) {
      setGeneralError(err.message || "Giriş yapılamadı. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (email, password) => {
    setFormData((prev) => ({
      ...prev,
      email,
      password,
    }));
    setErrors({});
    setGeneralError("");
  };

  return (
    <div className="auth-page">
      <div className="container auth-page-container">
        {/* Left Branding Showcase (Desktop) */}
        <div className="auth-showcase">
          <div className="auth-showcase-content">
            <Link to="/" className="auth-brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span>Mini<span>Store</span></span>
            </Link>

            <h1 className="showcase-title">
              Alışverişin En Güvenli ve Hızlı Adresi
            </h1>
            <p className="showcase-desc">
              Binlerce kaliteli ürün, avantajlı fiyatlar ve güvenli ödeme altyapısıyla
              ayrıcalıklı e-ticaret deneyimini yaşayın.
            </p>

            <div className="showcase-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">🔒</div>
                <div>
                  <strong>256-Bit SSL Koruması</strong>
                  <p>Tüm işlemleriniz banka düzeyinde şifrelenir</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div>
                  <strong>Hızlı & Ücretsiz Kargo</strong>
                  <p>150 TL üzeri siparişlerde aynı gün kargo</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔄</div>
                <div>
                  <strong>14 Gün Kolay İade</strong>
                  <p>Koşulsuz şartsız hızlı iade güvencesi</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Giriş Yap</h2>
              <p>Siparişlerinizi ve sepetinizi yönetmek için hesabınıza giriş yapın.</p>
            </div>

            {generalError && (
              <div className="auth-alert error">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{generalError}</span>
              </div>
            )}

            {successMessage && (
              <div className="auth-alert success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form-body" noValidate>
              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="login-email">E-posta Adresi</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? "has-error" : ""}
                    autoComplete="email"
                  />
                </div>
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <div className="label-row">
                  <label htmlFor="login-password">Şifre</label>
                  <a
                    href="#forgot"
                    className="forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert("Şifre sıfırlama servisi ilerleyen aşamalarda aktif olacaktır. Demo hesaplarla giriş yapabilirsiniz.");
                    }}
                  >
                    Şifremi Unuttum
                  </a>
                </div>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Şifrenizi giriniz"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "has-error" : ""}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              {/* Remember Me */}
              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span>Beni Hatırla</span>
                </label>
              </div>

              {/* Quick Demo Credentials */}
              <div className="quick-demo-box">
                <span className="quick-demo-title">Hızlı Demo Girişi:</span>
                <div className="quick-demo-chips">
                  <button
                    type="button"
                    className="demo-chip-btn"
                    onClick={() => handleQuickDemo("musteri@miniecom.com", "Password123!")}
                  >
                    👤 Demo Müşteri
                  </button>
                  <button
                    type="button"
                    className="demo-chip-btn"
                    onClick={() => handleQuickDemo("admin@miniecom.com", "Password123!")}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-auth-submit"
                disabled={isLoading || !!successMessage}
              >
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  "Giriş Yap"
                )}
              </button>
            </form>

            <div className="auth-card-footer">
              <p>
                Henüz üye değil misiniz?{" "}
                <Link to="/register" className="auth-link">
                  Hemen Ücretsiz Kayıt Ol &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
