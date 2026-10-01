import { Navigate, useLocation } from "react-router-dom";
import api from "../services/api";

/**
 * ProtectedRoute Component
 * Guards client-side routes from unauthorized visitors.
 * If no valid token exists, redirects to home with auth modal intent.
 */
function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = api.getToken();

  if (!token) {
    return <Navigate to="/?auth=login" state={{ from: location }} replace />;
  }

  return children;
}

export default ProtectedRoute;
