import { useState, useEffect } from "react";

/**
 * Custom hook that syncs a state value with localStorage.
 * @param {string} key - localStorage key
 * @param {*} initialValue - fallback value if nothing in storage or parsing fails
 * @returns {[*, Function]} - [value, setValue] like useState
 */
export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`useLocalStorage: error reading key "${key}", using initialValue`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.warn(`useLocalStorage: error writing key "${key}"`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
