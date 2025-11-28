import { useState, useEffect } from 'react'

/**
 * Hook to persist state in localStorage
 * @param {string} key - Storage key
 * @param {any} initialValue - Initial value
 * @returns {[any, function]} State and setter
 */
export function useLocalStorage(key, initialValue) {
  // Get stored value or use initial
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export default useLocalStorage
