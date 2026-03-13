"use client";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Forces dark theme on the landing page ("/") and light theme on all other pages.
 * Must be placed inside the ThemeProvider.
 */
export function RouteThemeForcer() {
    const pathname = usePathname();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (pathname === "/") {
            setTheme("dark");
        } else {
            setTheme("light");
        }
    }, [pathname, setTheme]);

    return null;
}
