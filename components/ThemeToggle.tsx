"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";

type Theme = "light" | "dark";
const THEME_KEY = "hall-theme";

function resolveTheme(): Theme {
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = resolveTheme();
    setTheme(next);
    applyTheme(next);
    setReady(true);
  }, []);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
  }

  const isDark = ready && theme === "dark";
  const label = locale === "en"
    ? isDark ? "Switch to light theme" : "Switch to dark theme"
    : isDark ? "Включить светлую тему" : "Включить тёмную тему";

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      <span className="theme-toggle-label">{label}</span>
    </button>
  );
}
