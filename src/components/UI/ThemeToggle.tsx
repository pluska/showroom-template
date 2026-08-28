"use client";

import { useEffect } from "react";

// Theme is locked to light mode — this component forces light and renders nothing.
export default function ThemeToggle() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
    localStorage.removeItem("theme");
  }, []);

  return null;
}
