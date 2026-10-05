import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthModal.css";

function AuthModal({ isOpen, initialMode = "register", onClose, onAuthSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode); // 'login' | 'register'
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    passwordConfirm: "",
  });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrors({});
    setGeneralError("");
    setSuccessMessage("");
  }, [initialMode, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setGeneralError("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (mode === "register") {
      if (!formData.name.trim() || formData.name.trim().length < 2) {
        newErrors.name = "Ad ve soyad en az 2 karakter olmalıdır.";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      newErrors.email = "Lütfen geçerli bir e-posta adresi giriniz.";
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır.";
    }

    if (mode === "register" && formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = "Girdiğiniz şifreler birbiriyle eşleşmiyor.";
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
      if (mode === "register") {
        const payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        };

        const res = await register(payload);

        setSuccessMessage(`Tebrikler ${res?.data?.name || "Kullanıcı"}! Hesabınız başarıyla oluşturuldu.`);
        if (onAuthSuccess && res?.data) {
          onAuthSuccess(res.data);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        // Login mode
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
          onClose();
        }, 1200);
      }
    } catch (err) {
      setGeneralError(err.message || "Bir hata oluştu. Lütfen tekrar deneyiniz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Kapat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => {
              setMode("login");
              setErrors({});
              setGeneralError("");
            }}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => {
              setMode("register");
              setErrors({});
              setGeneralError("");
            }}
          >
            Kayıt Ol
          </button>
        </div>

        <div className="auth-modal-body">
          <div className="auth-header">
            <h2>{mode === "register" ? "Yeni Hesap Oluştur" : "Tekrar Hoş Geldiniz"}</h2>
            <p>
              {mode === "register"
                ? "Ayrıcalıklı alışveriş dünyasına katılmak için formu doldurun."
                : "Siparişlerinizi ve sepetinizi görüntülemek için giriş yapın."}
            </p>
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

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="reg-name">Ad ve Soyad</label>
                <div className="input-wrapper">
                  <input
                    id="reg-name"
                    type="text"
                    name="name"
                    placeholder="Örn: Ahmet Yılmaz"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? "has-error" : ""}
                  />
                </div>
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reg-email">E-posta Adresi</label>
              <div className="input-wrapper">
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  placeholder="ornek@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? "has-error" : ""}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="reg-phone">Telefon Numarası (İsteğe Bağlı)</label>
                <div className="input-wrapper">
                  <input
                    id="reg-phone"
                    type="tel"
                    name="phone"
                    placeholder="0555 123 45 67"
                    value={formData.phone}
                    onChange={handleChange}
                    className={errors.phone ? "has-error" : ""}
                  />
                </div>
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reg-password">Şifre</label>
              <div className="input-wrapper">
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  placeholder="En az 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "has-error" : ""}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            {mode === "register" && (
              <div className="form-group">
                <label htmlFor="reg-password-confirm">Şifre Tekrar</label>
                <div className="input-wrapper">
                  <input
                    id="reg-password-confirm"
                    type="password"
                    name="passwordConfirm"
                    placeholder="Şifrenizi doğrulayın"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className={errors.passwordConfirm ? "has-error" : ""}
                  />
                </div>
                {errors.passwordConfirm && (
                  <span className="field-error">{errors.passwordConfirm}</span>
                )}
              </div>
            )}

            {mode === "login" && (
              <div className="auth-demo-hint">
                <span className="auth-demo-label">Hızlı Demo Girişi:</span>
                <div className="auth-demo-chips">
                  <button
                    type="button"
                    className="auth-chip"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        email: "musteri@miniecom.com",
                        password: "Password123!",
                      }));
                      setErrors({});
                      setGeneralError("");
                    }}
                  >
                    👤 Demo Müşteri
                  </button>
                  <button
                    type="button"
                    className="auth-chip"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        email: "admin@miniecom.com",
                        password: "Password123!",
                      }));
                      setErrors({});
                      setGeneralError("");
                    }}
                  >
                    🛡️ Admin
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-auth-submit"
              disabled={isLoading || !!successMessage}
            >
              {isLoading ? (
                <span className="auth-spinner" />
              ) : mode === "register" ? (
                "Hesap Oluştur"
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>

          <div className="auth-footer-prompt">
            {mode === "register" ? (
              <p>
                Zaten bir hesabınız var mı?{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setMode("login");
                    setErrors({});
                    setGeneralError("");
                  }}
                >
                  Giriş Yap
                </button>
              </p>
            ) : (
              <p>
                Henüz üye değil misiniz?{" "}
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setMode("register");
                    setErrors({});
                    setGeneralError("");
                  }}
                >
                  Hemen Kayıt Ol
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
