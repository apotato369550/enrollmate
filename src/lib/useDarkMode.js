'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for managing dark mode state across pages
 * Uses localStorage to persist the preference
 */
export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Read from localStorage on mount
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      // Save to localStorage
      localStorage.setItem('darkMode', newValue.toString());
      return newValue;
    });
  };

  return { isDarkMode, setIsDarkMode, toggleDarkMode };
}



