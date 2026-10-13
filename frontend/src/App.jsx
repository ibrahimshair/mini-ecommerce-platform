import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, useSearchParams, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import CartToast from "./components/CartToast";
import ToastContainer from "./components/ToastContainer";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./context/AuthContext";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { useDataSync } from "./hooks/useDataSync";

// Lazy-loaded pages for optimized bundle splitting & performance (Day 28)
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
// Dynamic route imports for code splitting & bundle performance (Milestone 6 Day 28)
// import CheckoutPage from "./pages/CheckoutPage";
// import OrdersPage from "./pages/OrdersPage";
const CartPage = lazy(() => import("./pages/CartPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages/OrdersPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

// Route suspense loader
function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "50vh",
        gap: "1rem",
        color: "var(--text-secondary, #64748b)",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          border: "3px solid #e2e8f0",
          borderTopColor: "var(--primary, #4f46e5)",
          borderRadius: "50%",
          animation: "routeSpin 0.75s linear infinite",
        }}
      />
      <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Sayfa yükleniyor...</span>
      <style>{`
        @keyframes routeSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { currentUser, logout, updateUser } = useAuth();
  const { isOnline, wasOffline, dismissReconnected } = useNetworkStatus();

  // Day 28: Automatic data synchronization on window focus and network reconnection
  useDataSync(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("app:sync-data"));
    }
  });

  // Authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const [rateLimitNotice, setRateLimitNotice] = useState(null);
  const [retryNotice, setRetryNotice] = useState(null);

  // Listen for global session expiration, rate limit, and API retry events
  useEffect(() => {
    const handleUnauthorized = (e) => {
      setSessionExpiredNotice(true);
      setTimeout(() => setSessionExpiredNotice(false), 5000);
    };

    const handleRateLimit = (e) => {
      setRateLimitNotice(e.detail?.message || "İstek kotası aşıldı. Lütfen bekleyiniz.");
      setTimeout(() => setRateLimitNotice(null), 6000);
    };

    const handleRetry = (e) => {
      const detail = e.detail || {};
      setRetryNotice(
        `Ağ bağlantısı dalgalanması tespit edildi. İstek yeniden deneniyor (${detail.attempt}/${detail.maxRetries})...`
      );
      setTimeout(() => setRetryNotice(null), 4000);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    window.addEventListener("api:ratelimit", handleRateLimit);
    window.addEventListener("api:retry", handleRetry);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
      window.removeEventListener("api:ratelimit", handleRateLimit);
      window.removeEventListener("api:retry", handleRetry);
    };
  }, []);

  // Listen to URL query parameter (?auth=login or ?auth=register)
  useEffect(() => {
    const authParam = searchParams.get("auth");
    if (authParam === "login" || authParam === "register") {
      setAuthMode(authParam);
      setIsAuthModalOpen(true);
    }
  }, [searchParams]);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleOpenAuth = (mode = "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleCloseAuth = () => {
    setIsAuthModalOpen(false);
    if (searchParams.get("auth")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("auth");
      setSearchParams(newParams, { replace: true });
    }
  };

  return (
    <div className="app-container">
      {/* Offline Network Warning Banner */}
      {!isOnline && (
        <div
          className="network-offline-banner"
          style={{
            backgroundColor: "#7f1d1d",
            color: "#fef2f2",
            borderBottom: "1px solid #991b1b",
            padding: "0.75rem 1rem",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            position: "sticky",
            top: 0,
            zIndex: 1150,
          }}
          role="alert"
        >
          <span>📡 İnternet bağlantısı kesildi. Çevrimdışı moddasınız. Bağlantı kurulduğunda otomatik senkronize edilecektir.</span>
        </div>
      )}

      {/* Network Reconnection Success Banner */}
      {wasOffline && (
        <div
          className="network-reconnected-banner"
          style={{
            backgroundColor: "#065f46",
            color: "#ecfdf5",
            borderBottom: "1px solid #047857",
            padding: "0.75rem 1rem",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            position: "sticky",
            top: 0,
            zIndex: 1140,
          }}
          role="status"
        >
          <span>✅ İnternet bağlantısı yeniden sağlandı. Çevrimiçi durumdasınız.</span>
          <button
            type="button"
            onClick={dismissReconnected}
            style={{
              background: "transparent",
              border: "none",
              color: "#ecfdf5",
              cursor: "pointer",
              fontWeight: "bold",
              marginLeft: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Network / API Transient Retry Notification Banner */}
      {retryNotice && (
        <div
          className="network-retry-banner"
          style={{
            backgroundColor: "#eff6ff",
            color: "#1e40af",
            borderBottom: "1px solid #bfdbfe",
            padding: "0.65rem 1rem",
            textAlign: "center",
            fontSize: "0.85rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            position: "sticky",
            top: 0,
            zIndex: 1130,
          }}
        >
          <span>🔄 {retryNotice}</span>
        </div>
      )}

      {sessionExpiredNotice && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            color: "#991b1b",
            borderBottom: "1px solid #fecaca",
            padding: "0.75rem 1rem",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            position: "sticky",
            top: 0,
            zIndex: 1100,
          }}
        >
          <span>⚠️ Oturum süreniz sona erdi. Güvenliğiniz için lütfen tekrar giriş yapın.</span>
          <button
            type="button"
            onClick={() => setSessionExpiredNotice(false)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              marginLeft: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {rateLimitNotice && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            color: "#b45309",
            borderBottom: "1px solid #fde68a",
            padding: "0.75rem 1rem",
            textAlign: "center",
            fontSize: "0.875rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            position: "sticky",
            top: sessionExpiredNotice ? "40px" : 0,
            zIndex: 1099,
          }}
        >
          <span>🛡️ {rateLimitNotice}</span>
          <button
            type="button"
            onClick={() => setRateLimitNotice(null)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              marginLeft: "1rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={logout}
      />

      <main className="main-content">
        <ErrorBoundary>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route
                path="/login"
                element={
                  <LoginPage
                    onAuthSuccess={(user) => {
                      updateUser(user);
                    }}
                  />
                }
              />
              <Route
                path="/register"
                element={
                  <RegisterPage
                    onAuthSuccess={(user) => {
                      updateUser(user);
                    }}
                  />
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage currentUser={currentUser} onLogout={logout} />
                  </ProtectedRoute>
                }
              />
              <Route path="/cart" element={<CartPage />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <CheckoutPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id"
                element={
                  <ProtectedRoute>
                    <OrdersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Global Shopping Cart Toast Notification */}
      <CartToast />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={handleCloseAuth}
        onAuthSuccess={(user) => {
          updateUser(user);
        }}
      />
    </div>
  );
}

export default App;