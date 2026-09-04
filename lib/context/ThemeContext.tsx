"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isThemeSupported: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggleTheme: () => {},
    setTheme: () => {},
    isThemeSupported: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const pathname = usePathname();

    const isProtectedRoute = (path: string | null) => {
        const currentPath = path || (typeof window !== "undefined" ? window.location.pathname : "");
        if (!currentPath) return false;
        return (
            currentPath.startsWith("/client") ||
            currentPath.startsWith("/tailor") ||
            currentPath.startsWith("/admin")
        );
    };

    const isSupported = isProtectedRoute(pathname || (typeof window !== "undefined" ? window.location.pathname : null));

    useEffect(() => {
        const stored = localStorage.getItem("fiti-theme") as Theme | null;
        if (stored === "light" || stored === "dark") {
            setThemeState(stored);
        } else {
            setThemeState("light");
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const currentPath = pathname || window.location.pathname;
        const supported = isProtectedRoute(currentPath);
        const root = document.documentElement;
        if (supported && theme === "dark") {
            root.classList.add("dark");
            root.setAttribute("data-theme", "dark");
        } else {
            root.classList.remove("dark");
            root.setAttribute("data-theme", "light");
        }
    }, [pathname, theme]);

    const applyTheme = (t: Theme) => {
        if (typeof window === "undefined") return;
        const currentPath = pathname || window.location.pathname;
        const supported = isProtectedRoute(currentPath);
        const root = document.documentElement;
        if (supported && t === "dark") {
            root.classList.add("dark");
            root.setAttribute("data-theme", "dark");
        } else {
            root.classList.remove("dark");
            root.setAttribute("data-theme", "light");
        }
    };

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem("fiti-theme", t);
        applyTheme(t);
    };

    const toggleTheme = () => {
        const next = theme === "light" ? "dark" : "light";
        setTheme(next);
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isThemeSupported: isSupported }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
