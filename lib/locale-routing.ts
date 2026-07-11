import type { Locale } from "@/lib/i18n";

function stripLocalePrefix(pathname: string) {
  if (pathname === "/en") return "/";
  if (pathname.startsWith("/en/")) return pathname.slice(3) || "/";
  return pathname || "/";
}

export function getLocalizedPath(locale: Locale, pathname: string, hash = "") {
  const cleanPath = stripLocalePrefix(pathname).replace(/\/$/, "") || "/";
  const localizedPath = locale === "en"
    ? cleanPath === "/" ? "/en" : `/en${cleanPath}`
    : cleanPath;
  return `${localizedPath}${hash}`;
}

export function switchLocalePath(pathname: string, locale: Locale, hash = "") {
  return getLocalizedPath(locale, pathname, hash);
}
