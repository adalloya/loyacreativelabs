'use client';

import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Estado inicial perezoso para leer de inmediato de localStorage en el cliente
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sincronización reactiva entre instancias y pestañas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const readFromStorage = () => {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          setStoredValue(initialValue);
        }
      } catch (error) {
        console.warn(`[useLocalStorage] Error reading key "${key}":`, error);
      }
    };

    // Lectura inicial por si el montaje en cliente cambió
    readFromStorage();

    window.addEventListener('storage', readFromStorage);
    window.addEventListener('local-storage-update', readFromStorage);

    return () => {
      window.removeEventListener('storage', readFromStorage);
      window.removeEventListener('local-storage-update', readFromStorage);
    };
  }, [key, initialValue]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          window.dispatchEvent(new Event('local-storage-update'));
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`[useLocalStorage] Error saving key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}
