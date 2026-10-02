import { useState, useEffect } from "react";
import { Routes, Route, useSearchParams, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFoundPage from "./pages/NotFoundPage";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/ProtectedRoute";
import api from "./services/api";

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Authentication modal state with persistent user initialization
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser());

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

  // Validate active session with backend /api/auth/me on mount
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then((res) => {
          if (res?.data) {
            setCurrentUser(res.data);
            api.setCurrentUser(res.data);
          }
        })
        .catch(() => {
          // Token expired or invalid: reset current user
          setCurrentUser(null);
        });
    }
  }, []);

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

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      <Navbar
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
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
                  setCurrentUser(user);
                }}
              />
            }
          />
          <Route
            path="/register"
            element={
              <RegisterPage
                onAuthSuccess={(user) => {
                  setCurrentUser(user);
                }}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage currentUser={currentUser} onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={handleCloseAuth}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}

export default App;