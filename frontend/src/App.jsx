import { useState, useEffect } from "react";
import { Routes, Route, useSearchParams, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import NotFoundPage from "./pages/NotFoundPage";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import CartToast from "./components/CartToast";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { currentUser, logout, updateUser } = useAuth();

  // Authentication modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Listen for global session expiration event emitted by api interceptor
  useEffect(() => {
    const handleUnauthorized = (e) => {
      setSessionExpiredNotice(true);
      setTimeout(() => setSessionExpiredNotice(false), 5000);
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={logout}
      />

      <main className="main-content">
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
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

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