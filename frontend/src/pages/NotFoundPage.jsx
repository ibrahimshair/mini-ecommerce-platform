import { Link } from "react-router-dom";
import "./NotFoundPage.css";

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="container not-found-container">
        <div className="not-found-badge">HATA 404</div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Aradığınız Sayfa Bulunamadı</h2>
        <p className="not-found-desc">
          Görünüşe göre ulaşmaya çalıştığınız sayfa taşınmış, silinmiş veya adresi yanlış yazılmış olabilir.
          Aşağıdaki bağlantıları kullanarak güvenli alışveriş dünyamıza geri dönebilirsiniz.
        </p>

        <div className="not-found-actions">
          <Link to="/" className="btn btn-primary not-found-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Ana Sayfaya Dön
          </Link>
          <Link to="/products" className="btn btn-outline not-found-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Ürün Kataloğunu Keşfet
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
