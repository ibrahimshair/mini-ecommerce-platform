import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Navbar.css";

function Navbar({ currentUser: propUser, onOpenAuth, onLogout: propLogout }) {
  const { currentUser: authUser, logout: authLogout } = useAuth();
  const { itemCount } = useCart();
  const currentUser = propUser !== undefined ? propUser : authUser;
  const onLogout = propLogout || authLogout;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchValue.trim())}`);
    } else {
      navigate("/products");
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <Link
          to="/"
          className="brand-logo"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <svg
            className="brand-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
            <path d="M3 6h18" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
          <span className="brand-name">
            Mini<span>Store</span>
          </span>
        </Link>

        {/* Search Bar Form */}
        <form className="header-search" onSubmit={handleSearchSubmit}>
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Ürün, kategori veya marka ara..."
            className="search-input"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </form>

        {/* Desktop Navigation Links */}
        <nav className={`nav-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Ana Sayfa
          </NavLink>
          <NavLink
            to="/products"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Ürün Kataloğu
          </NavLink>
          <Link
            to="/products?category=Elektronik"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Elektronik
          </Link>
          <Link
            to="/products?category=Giyim%20%26%20Moda"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Moda
          </Link>
        </nav>

        {/* Right Actions (Cart & Auth) */}
        <div className="header-actions">
          {/* Cart Icon with Dynamic Badge */}
          <Link
            to="/cart"
            className="action-cart"
            title="Sepetim"
            aria-label={`Sepetim (${itemCount} ürün)`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg
              className="action-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>

          {/* User Auth Buttons / User Profile */}
          <div className="auth-buttons">
            {currentUser ? (
              <div className="user-profile-menu" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link
                  to="/profile"
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    textDecoration: "none",
                  }}
                  title="Profilimi Görüntüle"
                >
                  👋 {currentUser.name?.split(" ")[0]}
                  {currentUser.role === "admin" && (
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "9999px",
                        background: "rgba(99, 102, 241, 0.12)",
                        color: "#4f46e5",
                        fontWeight: "700",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                      }}
                    >
                      Admin
                    </span>
                  )}
                </Link>
                <Link
                  to="/profile"
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: "none" }}
                >
                  Profilim
                </Link>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={onLogout}
                  title="Çıkış Yap"
                >
                  Çıkış
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: "none" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Giriş Yap
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary btn-sm"
                  style={{ textDecoration: "none" }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menüyü Aç/Kapat"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMobileMenuOpen ? (
                <path d="M18 6 6 18M6 6l12 12" />
              ) : (
                <path d="M4 12h16M4 6h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;