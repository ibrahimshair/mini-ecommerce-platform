import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./RegisterPage.css";

function RegisterPage({ onAuthSuccess }) {
  const navigate = useNavigate();
  const { register, login, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
    acceptTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to profile
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/profile", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

  // Calculate password strength score (0 to 4)
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass) || /[A-Z]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 1, label: "Zayıf", color: "#ef4444" };
      case 2:
        return { score: 2, label: "Orta", color: "#f59e0b" };
      case 3:
        return { score: 3, label: "İyi", color: "#3b82f6" };
      case 4:
        return { score: 4, label: "Güçlü", color: "#10b981" };
      default:
        return { score: 0, label: "Çok Zayıf", color: "#ef4444" };
    }
  };

  const strength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      newErrors.name = "Ad ve soyad en az 2 karakter olmalıdır.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Lütfen geçerli bir e-posta adresi giriniz.";
    }

    if (formData.phone && formData.phone.trim().length > 0) {
      const phoneRegex = /^(\+90|0)?[1-9][0-9]{9}$/;
      const cleanPhone = formData.phone.replace(/[\s()-]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        newErrors.phone = "Lütfen geçerli bir telefon numarası giriniz (örn: 05551234567).";
      }
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır.";
    }

    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "Girdiğiniz şifreler birbiriyle eşleşmiyor.";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Kayıt olmak için kullanım koşullarını onaylamalısınız.";
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
      const res = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone?.trim() || undefined,
      });

      setSuccessMessage(`Tebrikler ${res?.data?.name || "Kullanıcı"}! Hesabınız oluşturuldu. Yönlendiriliyorsunuz...`);

      // Try automatic login with same credentials
      try {
        const loginRes = await login({
          email: formData.email.trim(),
          password: formData.password,
        });
        if (onAuthSuccess && loginRes?.data?.user) {
          onAuthSuccess(loginRes.data.user);
        }
        setTimeout(() => {
          navigate("/profile", { replace: true });
        }, 1000);
      } catch {
        // Fallback to manual login
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 1200);
      }
    } catch (err) {
      setGeneralError(err.message || "Kayıt işlemi başarısız. Lütfen bilgilerinizi kontrol ediniz.");
    } finally {
      setIsLoading(false);
    }
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
              Aramıza Katılın, Avantajları Yakalayın!
            </h1>
            <p className="showcase-desc">
              Ücretsiz hesap oluşturarak özel indirim kuponlarından, kişiselleştirilmiş
              ürün önerilerinden ve hızlı sipariş takibinden anında yararlanın.
            </p>

            <div className="showcase-benefits">
              <div className="benefit-item">
                <div className="benefit-icon">🎁</div>
                <div>
                  <strong>İlk Alışverişe %15 İndirim</strong>
                  <p>Kayıt olan tüm yeni üyelere özel karşılama kuponu</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">⭐</div>
                <div>
                  <strong>Puan ve Sadakat Ayrıcalığı</strong>
                  <p>Her siparişinizde biriktirebileceğiniz puan sistemi</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📦</div>
                <div>
                  <strong>Tek Tıkla Kolay Takip</strong>
                  <p>Tüm kargo ve iade süreçlerinizi anlık izleyin</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <div className="auth-card-header">
              <h2>Yeni Hesap Oluştur</h2>
              <p>Formu doldurarak dakikalar içinde üyeliğinizi başlatın.</p>
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
              {/* Name Input */}
              <div className="form-group">
                <label htmlFor="reg-name">Ad ve Soyad</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "has-error" : ""}
                    autoComplete="name"
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              {/* Email Input */}
              <div className="form-group">
                <label htmlFor="reg-email">E-posta Adresi</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    id="reg-email"
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

              {/* Phone Input (Optional) */}
              <div className="form-group">
                <label htmlFor="reg-phone">Telefon Numarası (İsteğe Bağlı)</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    placeholder="0555 123 45 67"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "has-error" : ""}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label htmlFor="reg-password">Şifre</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="En az 6 karakter"
                    value={formData.password}
                    onChange={handleChange}
                    className={errors.password ? "has-error" : ""}
                    autoComplete="new-password"
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

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="strength-meter">
                    <div className="strength-bar-track">
                      <div
                        className="strength-bar-fill"
                        style={{
                          width: `${(strength.score / 4) * 100}%`,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <span className="strength-label" style={{ color: strength.color }}>
                      Güvenlik: {strength.label}
                    </span>
                  </div>
                )}

                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>

              {/* Password Confirm Input */}
              <div className="form-group">
                <label htmlFor="reg-confirm">Şifre Tekrar</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    id="reg-confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    name="passwordConfirm"
                    placeholder="Şifrenizi tekrar giriniz"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className={errors.passwordConfirm ? "has-error" : ""}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Şifreyi Gizle" : "Şifreyi Göster"}
                    tabIndex="-1"
                  >
                    {showConfirmPassword ? (
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
                {errors.passwordConfirm && (
                  <span className="field-error">{errors.passwordConfirm}</span>
                )}
              </div>

              {/* Accept Terms Checkbox */}
              <div className="form-checkbox-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                  />
                  <span className="checkbox-custom" />
                  <span>
                    <a
                      href="#terms"
                      onClick={(e) => {
                        e.preventDefault();
                        alert("Kullanım Koşulları ve Gizlilik Sözleşmesi: Bilgileriniz güvenle saklanmaktadır.");
                      }}
                      className="terms-link"
                    >
                      Kullanım Koşulları ve Gizlilik Politikası
                    </a>
                    'nı kabul ediyorum.
                  </span>
                </label>
              </div>
              {errors.acceptTerms && (
                <span className="field-error">{errors.acceptTerms}</span>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-auth-submit"
                disabled={isLoading || !!successMessage}
              >
                {isLoading ? (
                  <span className="auth-spinner" />
                ) : (
                  "Hesap Oluştur"
                )}
              </button>
            </form>

            <div className="auth-card-footer">
              <p>
                Zaten bir hesabınız var mı?{" "}
                <Link to="/login" className="auth-link">
                  Giriş Yap &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
