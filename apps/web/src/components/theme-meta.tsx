import { useTheme } from "next-themes";
import { useEffect } from "react";

const THEME_COLOR_LIGHT = "oklch(0.98 0.005 15)";
const THEME_COLOR_DARK = "oklch(0.15 0.008 15)";

export const ThemeMeta = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        resolvedTheme === "dark" ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
      );
    }
  }, [resolvedTheme]);

  return null;
};
