"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthHeaderActions } from "@/components/AuthHeaderActions";
import { MascotLogo } from "@/components/MascotLogo";
import { useCity } from "@/components/CityProvider";
import { useCart } from "@/components/CartProvider";
import { getHomeHref, getLocaleFromPathname, localeNames, siteText, type Locale } from "@/lib/i18n";

const languageOrder: Locale[] = ["ru", "en"];

export function Header() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const text = siteText[locale];
  const { selectedCity, selectedProject, openChooser } = useCity();
  const { count, openCart } = useCart();
  const projectLabel = selectedProject || (locale === "en" ? "Any project" : "Любой ЖК");

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <header className="site-header hall-header">
      <Link href={getHomeHref(locale)} className="brand" aria-label={text.brand}>
        <span className="brand-mark">
          <MascotLogo />
        </span>
        <span>
          <strong>{text.brand}</strong>
          <small>{text.brandSubtitle}</small>
        </span>
      </Link>

      <button className="selected-project-button" type="button" onClick={openChooser}>
        <span>{locale === "en" ? "Selected project" : "Выбран ЖК"}</span>
        <strong>{projectLabel}</strong>
        <small>{selectedCity}</small>
      </button>

      <nav className="header-nav" aria-label={text.brandSubtitle}>
        <Link href={getHomeHref(locale, "#apartments")}>{text.nav.apartments}</Link>
        <Link href={getHomeHref(locale, "#complexes")}>{text.nav.complexes}</Link>
        <Link href="/ai">{text.nav.ai}</Link>
        <Link href="/furniture">{text.nav.furniture}</Link>
        <Link href={getHomeHref(locale, "#contacts")}>{text.nav.contacts}</Link>
        <button className="header-cart-button" type="button" onClick={openCart} aria-label={locale === "en" ? `Furniture cart, ${count} items` : `Корзина мебели, товаров: ${count}`}>
          {locale === "en" ? "Cart" : "Корзина"}<span>{count}</span>
        </button>
        <AuthHeaderActions locale={locale} />
        <div className="language-switch" aria-label="Language selector">
          {languageOrder.map((language) => (
            <Link
              key={language}
              href={getHomeHref(language)}
              className={`language-link ${locale === language ? "is-active" : ""}`}
              lang={language}
              aria-current={locale === language ? "page" : undefined}
            >
              {localeNames[language]}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
