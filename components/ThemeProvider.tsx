"use client";

import { createContext, useContext, useState, useEffect, useCallback, startTransition } from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  mounted: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  mounted: false,
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  // Sync with DOM attribute set by the inline script, then mark mounted
  useEffect(() => {
    const domTheme = document.documentElement.getAttribute("data-theme") as Theme | null;
    if (domTheme === "light" || domTheme === "dark") {
      startTransition(() => {
        setTheme(domTheme);
        setMounted(true);
      });
    } else {
      startTransition(() => setMounted(true));
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);

    const themeColor = theme === "dark" ? "#09090b" : "#ffffff";
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = themeColor;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
