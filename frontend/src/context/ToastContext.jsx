import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

/**
 * Global Toast Notification Provider
 * Manages toast queue, auto-dismiss timers, pausing on hover, and global events.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  // Remove a specific toast by its unique ID
  const removeToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Remove all active toasts
  const clearToasts = useCallback(() => {
    Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    timersRef.current = {};
    setToasts([]);
  }, []);

  // Add a new toast notification
  const addToast = useCallback(
    ({
      type = "info",
      title = "",
      message = "",
      duration = 4000,
      action = null,
    }) => {
      const id = `toast-${Date.now()}-${++toastIdCounter}`;
      const newToast = {
        id,
        type, // 'success' | 'error' | 'warning' | 'info'
        title,
        message,
        duration,
        action,
        createdAt: Date.now(),
        isPaused: false,
      };

      setToasts((prev) => {
        // Limit max stacked toasts to 5
        const updated = [newToast, ...prev];
        return updated.slice(0, 5);
      });

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  // Pause auto-dismiss timer on mouse enter
  const pauseToast = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isPaused: true } : t))
      );
    }
  }, []);

  // Resume auto-dismiss timer on mouse leave
  const resumeToast = useCallback(
    (id) => {
      setToasts((prev) => {
        const target = prev.find((t) => t.id === id);
        if (target && target.duration > 0) {
          timersRef.current[id] = setTimeout(() => {
            removeToast(id);
          }, 2000); // 2s remaining buffer
          return prev.map((t) => (t.id === id ? { ...t, isPaused: false } : t));
        }
        return prev;
      });
    },
    [removeToast]
  );

  // Helper convenience methods
  const success = useCallback(
    (message, options = {}) =>
      addToast({ type: "success", title: options.title || "Başarılı", message, ...options }),
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) =>
      addToast({ type: "error", title: options.title || "Hata", message, duration: 5000, ...options }),
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) =>
      addToast({ type: "warning", title: options.title || "Uyarı", message, ...options }),
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) =>
      addToast({ type: "info", title: options.title || "Bilgi", message, ...options }),
    [addToast]
  );

  // Global event listener for non-React contexts / background services
  useEffect(() => {
    const handleGlobalToast = (event) => {
      if (event.detail) {
        const { type = "info", message = "", title = "", duration = 4000 } = event.detail;
        addToast({ type, message, title, duration });
      }
    };

    window.addEventListener("toast:notify", handleGlobalToast);
    return () => {
      window.removeEventListener("toast:notify", handleGlobalToast);
    };
  }, [addToast]);

  const value = {
    toasts,
    addToast,
    removeToast,
    clearToasts,
    pauseToast,
    resumeToast,
    success,
    error,
    warning,
    info,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

/**
 * Custom hook to consume the Toast notification context.
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastContext;
