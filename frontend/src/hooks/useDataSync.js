import { useEffect, useCallback } from "react";

/**
 * Custom hook for Frontend-Backend Data Synchronization
 * Automatically triggers revalidation / sync callback when:
 * 1. The browser tab regains user focus (`window.focus`)
 * 2. Tab changes from background to active (`visibilitychange` -> `visible`)
 * 3. Network reconnects after offline state (`window.online`)
 * 
 * @param {Function} syncCallback - The async or sync function to call on re-focus
 * @param {Object} options - Configuration options
 * @param {boolean} options.enabled - Whether sync listener is active (default: true)
 * @param {number} options.minIntervalMs - Minimum throttle interval between syncs (default: 5000ms)
 */
export function useDataSync(syncCallback, options = {}) {
  const { enabled = true, minIntervalMs = 5000 } = options;

  const triggerSync = useCallback(() => {
    if (!enabled || typeof syncCallback !== "function") return;

    const now = Date.now();
    const lastSync = window._lastDataSyncTimestamp || 0;

    if (now - lastSync >= minIntervalMs) {
      window._lastDataSyncTimestamp = now;
      syncCallback();
    }
  }, [enabled, syncCallback, minIntervalMs]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };

    const handleWindowFocus = () => {
      triggerSync();
    };

    const handleOnline = () => {
      triggerSync();
    };

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", handleOnline);
    };
  }, [enabled, triggerSync]);

  return { triggerSync };
}

export default useDataSync;
