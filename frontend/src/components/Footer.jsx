import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-container">
        {/* Brand Column */}
        <div className="footer-col footer-brand">
          <div className="footer-logo">
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
            <span>
              Mini<strong>Store</strong>
            </span>
          </div>
          <p className="footer-description">
            Modern, güvenilir ve kullanıcı dostu e-ticaret platformu. En kaliteli
            ürünler, hızlı kargo ve güvenli ödeme ile kapınızda.
          </p>
          <div className="footer-badge-list">
            <span className="badge badge-primary">256-Bit SSL Güvenlik</span>
            <span className="badge badge-success">Orijinal Ürün</span>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4 className="footer-title">Hızlı Bağlantılar</h4>
          <ul className="footer-links">
            <li>
              <a href="/">Ana Sayfa</a>
            </li>
            <li>
              <a href="#products">Tüm Ürünler</a>
            </li>
            <li>
              <a href="#categories">Popüler Kategoriler</a>
            </li>
            <li>
              <a href="#deals">Günün Fırsatları</a>
            </li>
          </ul>
        </div>

        {/* Customer Support */}
        <div className="footer-col">
          <h4 className="footer-title">Müşteri Hizmetleri</h4>
          <ul className="footer-links">
            <li>
              <a href="#faq">Sıkça Sorulan Sorular</a>
            </li>
            <li>
              <a href="#shipping">Kargo & Teslimat</a>
            </li>
            <li>
              <a href="#returns">İptal & İade Koşulları</a>
            </li>
            <li>
              <a href="#privacy">Gizlilik & Güvenlik Politikası</a>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div className="footer-col footer-newsletter">
          <h4 className="footer-title">E-Bülten Aboneliği</h4>
          <p className="newsletter-text">
            Yeni ürünler ve özel indirim fırsatlarından ilk siz haberdar olun.
          </p>
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Bülten aboneliğiniz alındı!");
            }}
          >
            <input
              type="email"
              placeholder="E-posta adresiniz..."
              required
              className="newsletter-input"
            />
            <button type="submit" className="btn btn-primary newsletter-btn">
              Abone Ol
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <div className="container bottom-container">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} MiniStore E-Commerce. Tüm hakları saklıdır. Staj Projesi kapsamında geliştirilmektedir.
          </p>
          <div className="payment-tags">
            <span>Visa</span>
            <span>Mastercard</span>
            <span>Troy</span>
            <span>Güvenli Alışveriş</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
