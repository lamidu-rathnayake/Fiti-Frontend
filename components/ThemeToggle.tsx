"use client";

import { useTheme } from "@/lib/context/ThemeContext";

interface ThemeToggleProps {
    className?: string;
    showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = true }: ThemeToggleProps) {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            type="button"
            aria-label="Toggle Light and Dark Theme"
            title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
            className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cream-bg/80 dark:bg-card-bg/80 border border-accent/40 text-earth-text hover:border-accent hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer ${className}`}
        >
            {theme === "dark" ? (
                // Sun Icon (Switch to Light)
                <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon (Switch to Dark)
                <svg className="w-4 h-4 text-earth-text shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
            {showLabel && (
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase select-none">
                    {theme === "dark" ? "Dark" : "Light"}
                </span>
            )}
        </button>
    );
}
