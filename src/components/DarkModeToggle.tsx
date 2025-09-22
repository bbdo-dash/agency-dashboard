"use client";

import { useState, useEffect } from "react";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved preferences on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    
    if (savedDarkMode === null) {
      // Default to light mode (false)
      setDarkMode(false);
      localStorage.setItem("darkMode", "false");
      applyDarkMode(false);
    } else {
      const isDark = savedDarkMode === "true";
      setDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, []);

  const applyDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Save preferences to localStorage
    localStorage.setItem("darkMode", String(newDarkMode));
    
    // Apply or remove dark mode class
    applyDarkMode(newDarkMode);
  };

  return (
    <div className="flex items-center">
      {/* Dark mode toggle */}
      <button
        onClick={toggleDarkMode}
        className="rounded-full bg-white dark:bg-gray-800 p-2 shadow-md hover:shadow-lg transition-all"
        aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        title={darkMode ? "Zu hellem Modus wechseln" : "Zu dunklem Modus wechseln"}
      >
        {darkMode ? (
          // Sun icon for light mode
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-yellow-400"
            suppressHydrationWarning
          >
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          // Moon icon for dark mode
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-slate-800"
            suppressHydrationWarning
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>
    </div>
  );
} 