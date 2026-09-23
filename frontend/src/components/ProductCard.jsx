import "./ProductCard.css";

function ProductCard({ product }) {
  const {
    name,
    category,
    price,
    oldPrice,
    rating,
    reviewCount,
    image,
    discount,
  } = product;

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        {discount && <span className="product-discount-badge">%{discount}</span>}
        <img src={image} alt={name} className="product-image" loading="lazy" />
        <button
          type="button"
          className="product-wishlist-btn"
          title="Favorilere Ekle"
          aria-label="Favorilere Ekle"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
        </button>
      </div>

      <div className="product-content">
        <div className="product-meta">
          <span className="product-category">{category}</span>
          <div className="product-rating">
            <svg
              className="star-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="rating-value">{rating}</span>
            <span className="rating-count">({reviewCount})</span>
          </div>
        </div>

        <h3 className="product-title" title={name}>
          {name}
        </h3>

        <div className="product-footer">
          <div className="product-price-box">
            <span className="product-price">{price.toLocaleString("tr-TR")} ₺</span>
            {oldPrice && (
              <span className="product-old-price">
                {oldPrice.toLocaleString("tr-TR")} ₺
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-add-cart"
            title="Sepete Ekle"
            aria-label="Sepete Ekle"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M12 5v14" />
            </svg>
            <span>Ekle</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
