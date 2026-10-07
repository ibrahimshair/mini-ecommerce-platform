import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./CartToast.css";

function CartToast() {
  const { toast, hideToast } = useCart();

  if (!toast) return null;

  return (
    <div className={`cart-toast cart-toast-${toast.type || "success"}`} role="alert">
      <div className="toast-icon-wrap">
        {toast.type === "error" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        ) : toast.type === "info" ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        )}
      </div>

      <div className="toast-content">
        <p className="toast-message">{toast.message}</p>
        {toast.type === "success" && (
          <Link to="/cart" className="toast-action-link" onClick={hideToast}>
            Sepete Git &rarr;
          </Link>
        )}
      </div>

      <button
        type="button"
        className="toast-close-btn"
        onClick={hideToast}
        aria-label="Kapat"
      >
        &times;
      </button>
    </div>
  );
}

export default CartToast;
