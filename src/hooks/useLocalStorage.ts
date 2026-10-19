'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const initialValueRef = useRef(initialValue);
  initialValueRef.current = initialValue;

  // Estado inicial perezoso
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sincronización reactiva controlada
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readFromStorage = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          const parsed = JSON.parse(item);
          setStoredValue((prev) => {
            // Evita re-render si el valor JSON es idéntico
            if (JSON.stringify(prev) === item) {
              return prev;
            }
            return parsed;
          });
        }
      } catch (error) {
        console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      }
    };

    // Lectura única al montar en cliente
    readFromStorage();

    const handleCustomUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ key?: string }>;
      if (!customEvent.detail || customEvent.detail.key === key) {
        readFromStorage();
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === null || e.key === key) {
        readFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage-update', handleCustomUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage-update', handleCustomUpdate);
    };
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          const serialized = JSON.stringify(valueToStore);
          const current = window.localStorage.getItem(key);
          if (current !== serialized) {
            window.localStorage.setItem(key, serialized);
            window.dispatchEvent(new CustomEvent('local-storage-update', { detail: { key } }));
          }
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`[useLocalStorage] Error saving key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
