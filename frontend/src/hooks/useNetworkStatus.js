import { useState, useEffect, useCallback } from "react";

/**
 * Custom React Hook for monitoring network connectivity & offline state
 * Provides real-time online/offline transitions, reconnection banners,
 * and ping-based active health check capability.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [lastChangedAt, setLastChangedAt] = useState(null);

  const handleOnline = useCallback(() => {
    setIsOnline((prev) => {
      if (!prev) {
        // We were previously offline, now reconnected
        setWasOffline(true);
      }
      return true;
    });
    setLastChangedAt(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(false);
    setLastChangedAt(new Date());
  }, []);

  const dismissReconnected = useCallback(() => {
    setWasOffline(false);
  }, []);

  // Auto-dismiss the reconnection banner after 4 seconds
  useEffect(() => {
    if (wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [wasOffline]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Also listen for internal API client offline signals
    const handleApiOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("api:offline", handleApiOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("api:offline", handleApiOffline);
    };
  }, [handleOnline, handleOffline]);

  /**
   * Actively ping the backend health endpoint to verify end-to-end connectivity
   */
  const checkConnection = useCallback(async (healthUrl = "http://localhost:5000/api/health") => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(healthUrl, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutId);

      const reachable = res.ok;
      setIsOnline(reachable);
      return reachable;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  return {
    isOnline,
    wasOffline,
    lastChangedAt,
    dismissReconnected,
    checkConnection,
  };
}

export default useNetworkStatus;
