import { useState } from "react";
import "./Navbar.css";

function Navbar({ currentPage = "home", onNavigate, searchQuery = "", onSearchChange }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavClick = (page, category = "Tümü") => {
    if (onNavigate) {
      onNavigate(page, category);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <button
          type="button"
          onClick={() => handleNavClick("home")}
          className="brand-logo"
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
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
        </button>

        {/* Search Bar */}
        <div className="header-search">
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
            value={searchQuery}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
            }}
            onFocus={() => {
              if (currentPage !== "products" && onNavigate) {
                onNavigate("products");
              }
            }}
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className={`nav-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          <button
            type="button"
            className={`nav-link ${currentPage === "home" ? "active" : ""}`}
            onClick={() => handleNavClick("home")}
          >
            Ana Sayfa
          </button>
          <button
            type="button"
            className={`nav-link ${currentPage === "products" ? "active" : ""}`}
            onClick={() => handleNavClick("products")}
          >
            Ürün Kataloğu
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("products", "Elektronik")}
          >
            Elektronik
          </button>
          <button
            type="button"
            className="nav-link"
            onClick={() => handleNavClick("products", "Giyim & Moda")}
          >
            Moda
          </button>
        </nav>

        {/* Right Actions (Cart & Auth) */}
        <div className="header-actions">
          {/* Cart Icon with Badge */}
          <button
            type="button"
            className="action-cart"
            title="Sepetim"
            onClick={() => alert("Sepet özelliği Milestone 4'te aktif olacaktır.")}
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
            <span className="cart-badge">2</span>
          </button>

          {/* User Auth Buttons */}
          <div className="auth-buttons">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => alert("Giriş yapma özelliği Milestone 3'te aktif olacaktır.")}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => alert("Kayıt olma özelliği Milestone 3'te aktif olacaktır.")}
            >
              Kayıt Ol
            </button>
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