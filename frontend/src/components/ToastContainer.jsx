import { useToast } from "../context/ToastContext";
import "./ToastContainer.css";

const ToastIcon = ({ type }) => {
  switch (type) {
    case "success":
      return (
        <svg className="toast-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "error":
      return (
        <svg className="toast-icon error" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case "warning":
      return (
        <svg className="toast-icon warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return (
        <svg className="toast-icon info" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
};

export default function ToastContainer() {
  const { toasts, removeToast, pauseToast, resumeToast } = useToast();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-portal-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type} ${toast.isPaused ? "is-paused" : ""}`}
          onMouseEnter={() => pauseToast(toast.id)}
          onMouseLeave={() => resumeToast(toast.id)}
          role="alert"
        >
          <div className="toast-icon-wrap">
            <ToastIcon type={toast.type} />
          </div>

          <div className="toast-content">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
            {toast.action && (
              <button
                type="button"
                className="toast-action-btn"
                onClick={() => {
                  toast.action.onClick();
                  removeToast(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
          </div>

          <button
            type="button"
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            aria-label="Kapat"
          >
            ✕
          </button>

          {toast.duration > 0 && (
            <div
              className="toast-progress-bar"
              style={{
                animationDuration: `${toast.duration}ms`,
                animationPlayState: toast.isPaused ? "paused" : "running",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
