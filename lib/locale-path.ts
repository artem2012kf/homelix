import type { Locale } from "@/lib/i18n";

export function localizePath(locale: Locale, path: string) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const withoutEnglishPrefix = clean === "/en" ? "/" : clean.startsWith("/en/") ? clean.slice(3) : clean;
  if (locale === "ru") return withoutEnglishPrefix || "/";
  return withoutEnglishPrefix === "/" ? "/en" : `/en${withoutEnglishPrefix}`;
}

export function switchLocalePath(pathname: string, locale: Locale) {
  return localizePath(locale, pathname);
}
