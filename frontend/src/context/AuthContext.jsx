import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => api.getCurrentUser());
  const [token, setToken] = useState(() => api.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Validate active session on mount with /api/auth/me
  const refreshUser = useCallback(async () => {
    const activeToken = api.getToken();
    if (!activeToken) {
      setCurrentUser(null);
      setToken(null);
      setIsLoading(false);
      return null;
    }

    try {
      const res = await api.getMe();
      if (res?.data) {
        setCurrentUser(res.data);
        setToken(activeToken);
        api.setCurrentUser(res.data);
        return res.data;
      }
    } catch (err) {
      console.warn("[AuthContext] Session validation failed or token expired:", err.message);
      // Clean up invalid session
      api.logout();
      setCurrentUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen to 401 unauthorized events emitted from api.js interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
      setToken(null);
    };

    const unsubscribe = api.onUnauthorized(handleUnauthorized);
    return () => {
      unsubscribe();
    };
  }, []);

  // Login handler
  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      if (res?.data?.user) {
        setCurrentUser(res.data.user);
        setToken(res.data.token);
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  // Register handler
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const res = await api.register(userData);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    api.logout();
    setCurrentUser(null);
    setToken(null);
  };

  // Update user state (e.g. after profile edit)
  const updateUser = (updatedUserData) => {
    setCurrentUser(updatedUserData);
    api.setCurrentUser(updatedUserData);
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: !!currentUser && !!token,
    isAdmin: currentUser?.role === "admin",
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
