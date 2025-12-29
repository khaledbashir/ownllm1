import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * DarkModeToggle Component
 * 
 * Premium dark mode toggle with:
 * - Smooth color transition
 * - Persist preference in localStorage
 * - Follow system preference by default
 */

const DarkModeToggle = ({
  position = 'header', // 'header' | 'sidebar' | 'floating'
  size = 'md', // 'sm' | 'md' | 'lg'
  className = ''
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Check for system preference and localStorage
  useEffect(() => {
    setIsMounted(true);

    // Check localStorage first
    const storedPreference = localStorage.getItem('darkMode');
    
    if (storedPreference !== null) {
      setIsDark(storedPreference === 'true');
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (!isMounted) return;

    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Persist preference
    localStorage.setItem('darkMode', isDark.toString());
  }, [isDark, isMounted]);

  // Listen for system preference changes
  useEffect(() => {
    if (!isMounted) return;

    // Only listen if no manual preference set
    const storedPreference = localStorage.getItem('darkMode');
    if (storedPreference !== null) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      setIsDark(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isMounted]);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
  };

  // Size configurations
  const sizes = {
    sm: 'w-8 h-8 p-1.5',
    md: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-2.5'
  };

  // Position styles
  const positions = {
    header: 'relative',
    sidebar: 'absolute right-4 top-4',
    floating: 'fixed right-4 top-4 z-40'
  };

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        ${positions[position]} ${sizes[size]}
        bg-white dark:bg-gray-800
        border border-gray-300 dark:border-gray-600
        rounded-xl shadow-sm hover:shadow-md
        transform transition-all duration-300
        hover:scale-105 active:scale-95
        flex items-center justify-center
        focus:outline-none focus:ring-2 focus:ring-purple-500
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Moon className="w-full h-full text-purple-400 dark:text-purple-400" />
      ) : (
        <Sun className="w-full h-full text-amber-500" />
      )}
    </button>
  );
};

export default DarkModeToggle;