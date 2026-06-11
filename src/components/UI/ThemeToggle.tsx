"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Read theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to light or check system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initialTheme = systemPrefersDark ? "dark" : "light";
      setTheme(initialTheme);
      applyTheme(initialTheme);
    }
  }, []);

  const applyTheme = (t: "light" | "dark") => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-ghost btn-circle text-base-content hover:bg-base-200/50 dark:hover:bg-base-200/30 transition-all duration-300 relative z-50 flex items-center justify-center p-2 bg-white/80 dark:bg-base-300/80 backdrop-blur-md rounded-full shadow-md border border-gray-100 dark:border-base-200 w-10 h-10 cursor-pointer"
      aria-label="Toggle Theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {theme === "light" ? (
          <Sun className="w-5 h-5 text-amber-500 transition-all duration-300 hover:rotate-45" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-400 transition-all duration-300 hover:rotate-12" />
        )}
      </div>
    </button>
  );
}
