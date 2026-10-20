// src/lib/theme.ts

export type Theme = "dark" | "light";

export function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "dark";
    try {
        const stored = localStorage.getItem("apex_theme");
        if (stored === "light" || stored === "dark") {
            return stored;
        }
    } catch {
        // Fallback default
    }
    return "dark";
}

export function setSiteTheme(theme: Theme): void {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem("apex_theme", theme);
        const root = document.documentElement;
        root.classList.remove("dark", "light");
        root.classList.add(theme);
        window.dispatchEvent(new CustomEvent("apex_theme_change", { detail: { theme } }));
    } catch (e) {
        console.error("Failed to update theme:", e);
    }
}
