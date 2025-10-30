import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    setLocalStorageItem(key, storedValue);
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export function setLocalStorageItem<T>(key: string, value: T) {
  try {
    if (value == null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.warn(`Error setting localStorage key “${key}”:`, error);
  }
}
