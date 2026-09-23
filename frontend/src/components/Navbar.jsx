import { useState } from "react";
import "./Navbar.css";

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-container">
        {/* Brand Logo */}
        <a href="/" className="brand-logo">
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
        </a>

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
          />
        </div>

        {/* Desktop Navigation Links */}
        <nav className={`nav-menu ${isMobileMenuOpen ? "is-open" : ""}`}>
          <a href="/" className="nav-link active">
            Ana Sayfa
          </a>
          <a href="#products" className="nav-link">
            Ürünler
          </a>
          <a href="#categories" className="nav-link">
            Kategoriler
          </a>
          <a href="#deals" className="nav-link">
            Fırsatlar
          </a>
        </nav>

        {/* Right Actions (Cart & Auth) */}
        <div className="header-actions">
          {/* Cart Icon with Badge */}
          <a href="#cart" className="action-cart" title="Sepetim">
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
          </a>

          {/* User Auth Buttons */}
          <div className="auth-buttons">
            <a href="#login" className="btn btn-outline btn-sm">
              Giriş Yap
            </a>
            <a href="#register" className="btn btn-primary btn-sm">
              Kayıt Ol
            </a>
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