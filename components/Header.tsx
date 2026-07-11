"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AuthHeaderActions } from "@/components/AuthHeaderActions";
import { MascotLogo } from "@/components/MascotLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCity } from "@/components/CityProvider";
import { useCart } from "@/components/CartProvider";
import {
  getHomeHref,
  getLocaleFromPathname,
  localeNames,
  siteText,
  translateComplexName,
  translatePlace,
  type Locale
} from "@/lib/i18n";
import { localizePath, switchLocalePath } from "@/lib/locale-path";

const languageOrder: Locale[] = ["ru", "en"];
const homeSectionIds = ["apartments", "complexes", "contacts"] as const;
type HomeSectionId = (typeof homeSectionIds)[number];

export function Header() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const text = siteText[locale];
  const { selectedCity, selectedProject, openChooser } = useCity();
  const { count, openCart } = useCart();
  const [activeSection, setActiveSection] = useState<HomeSectionId | "">("");
  const isHomePage = pathname === "/" || pathname === "/en";
  const aiHref = localizePath(locale, "/ai");
  const furnitureHref = localizePath(locale, "/furniture");
  const cityLabel = translatePlace(selectedCity, locale);
  const projectLabel = selectedProject
    ? translateComplexName(selectedProject, locale)
    : locale === "en" ? "Any project" : "Любой ЖК";
  const cartLabel = locale === "en"
    ? count > 0 ? `Furniture cart, ${count} items` : "Furniture cart"
    : count > 0 ? `Корзина мебели, товаров: ${count}` : "Корзина мебели";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (!isHomePage) {
      setActiveSection("");
      return;
    }

    const sections = homeSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    const hashSection = window.location.hash.slice(1) as HomeSectionId;
    if (homeSectionIds.includes(hashSection)) setActiveSection(hashSection);
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible && homeSectionIds.includes(visible.target.id as HomeSectionId)) {
          setActiveSection(visible.target.id as HomeSectionId);
        }
      },
      { rootMargin: "-24% 0px -58%", threshold: [0.01, 0.15, 0.35] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isHomePage, pathname]);

  function handleSectionClick(event: MouseEvent<HTMLAnchorElement>, sectionId: HomeSectionId) {
    if (!isHomePage) return;
    const target = document.getElementById(sectionId);
    if (!target) return;

    event.preventDefault();
    setActiveSection(sectionId);
    window.history.pushState(null, "", `${pathname}#${sectionId}`);

    target.classList.remove("hall-section-arrive");
    void target.offsetWidth;
    target.classList.add("hall-section-arrive");
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => target.classList.remove("hall-section-arrive"), 900);
  }

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
        <strong>{projectLabel} · {cityLabel}</strong>
      </button>

      <nav className="header-nav" aria-label={text.brandSubtitle}>
        <Link
          href={getHomeHref(locale, "#apartments")}
          className={`header-tab ${activeSection === "apartments" ? "is-current" : ""}`}
          aria-current={activeSection === "apartments" ? "location" : undefined}
          onClick={(event) => handleSectionClick(event, "apartments")}
        >
          {text.nav.apartments}
        </Link>
        <Link
          href={getHomeHref(locale, "#complexes")}
          className={`header-tab ${activeSection === "complexes" ? "is-current" : ""}`}
          aria-current={activeSection === "complexes" ? "location" : undefined}
          onClick={(event) => handleSectionClick(event, "complexes")}
        >
          {text.nav.complexes}
        </Link>
        <Link className={`header-tab ${pathname.startsWith(aiHref) ? "is-current" : ""}`} href={aiHref} aria-current={pathname.startsWith(aiHref) ? "page" : undefined}>{text.nav.ai}</Link>
        <Link className={`header-tab ${pathname.startsWith(furnitureHref) ? "is-current" : ""}`} href={furnitureHref} aria-current={pathname.startsWith(furnitureHref) ? "page" : undefined}>{text.nav.furniture}</Link>
        <Link
          href={getHomeHref(locale, "#contacts")}
          className={`header-tab ${activeSection === "contacts" ? "is-current" : ""}`}
          aria-current={activeSection === "contacts" ? "location" : undefined}
          onClick={(event) => handleSectionClick(event, "contacts")}
        >
          {text.nav.contacts}
        </Link>
        <button className="header-cart-button" type="button" onClick={openCart} aria-label={cartLabel}>
          {locale === "en" ? "Cart" : "Корзина"}
          {count > 0 ? <span aria-hidden="true">{count}</span> : null}
        </button>
        <AuthHeaderActions locale={locale} />
        <ThemeToggle locale={locale} />
        <div className="language-switch" aria-label={locale === "en" ? "Language selector" : "Выбор языка"}>
          {languageOrder.map((language) => (
            <Link
              key={language}
              href={switchLocalePath(pathname, language)}
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
