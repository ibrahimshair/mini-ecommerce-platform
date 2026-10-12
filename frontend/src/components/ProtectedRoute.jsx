import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute Component
 * Guards client-side routes from unauthorized visitors.
 * Supports optional allowedRoles array (e.g. ['admin']) for role-based access control.
 */
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid #e2e8f0",
            borderTopColor: "var(--primary, #4f46e5)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", fontWeight: 600 }}>
          Oturum doğrulanıyor...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization if allowedRoles specified
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = currentUser?.role || "user";
    if (!allowedRoles.includes(userRole)) {
      return (
        <div
          style={{
            minHeight: "65vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              background: "#ffffff",
              borderRadius: "16px",
              padding: "2.5rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
              border: "1px solid #fee2e2",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                margin: "0 auto 1.25rem",
              }}
            >
              ⛔
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1e293b", marginBottom: "0.5rem" }}>
              403 - Yetkisiz Erişim
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Bu yönetim sayfasına erişebilmek için <strong>Yönetici (Admin)</strong> yetkisine sahip olmanız gerekmektedir.
              <br />
              Mevcut kullanıcı rolünüz: <span style={{ color: "#dc2626", fontWeight: 700 }}>{userRole}</span>
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <Link
                to="/"
                style={{
                  padding: "0.75rem 1.5rem",
                  background: "#4f46e5",
                  color: "#ffffff",
                  borderRadius: "10px",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontSize: "0.9rem",
                }}
              >
                🏠 Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  return children;
}

export default ProtectedRoute;
