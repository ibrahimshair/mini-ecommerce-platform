import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import api from "./services/api";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState("Tümü");
  const [searchQuery, setSearchQuery] = useState("");

  // Authentication modal state with persistent user initialization
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState("register");
  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser());

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

  const handleNavigate = (page, category = "Tümü") => {
    setCurrentPage(page);
    if (category) {
      setSelectedCategory(category);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    if (currentPage !== "products") {
      setCurrentPage("products");
    }
  };

  const handleOpenAuth = (mode = "register") => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  return (
    <div className="app-container">
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
      />
      <main className="main-content">
        {currentPage === "home" ? (
          <HomePage
            onNavigateToProducts={(category) =>
              handleNavigate("products", category || "Tümü")
            }
          />
        ) : (
          <ProductsPage
            initialCategory={selectedCategory}
            searchQuery={searchQuery}
            onNavigateHome={() => handleNavigate("home")}
          />
        )}
      </main>
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    </div>
  );
}

export default App;