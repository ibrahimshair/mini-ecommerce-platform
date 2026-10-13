import { useState, useEffect } from "react";

/**
 * Custom hook to debounce rapidly changing values (e.g. search inputs, filter parameters)
 * Reduces unnecessary re-renders, filter calculations, and API network requests.
 * 
 * @param {any} value - The input value to debounce
 * @param {number} delay - The debounce delay in milliseconds (default: 300ms)
 * @returns {any} The debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
