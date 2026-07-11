"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCity } from "@/components/CityProvider";
import { getLocaleFromPathname, translateComplexName, translatePlace } from "@/lib/i18n";
import { localizePath } from "@/lib/locale-path";
import { productText } from "@/lib/product-copy";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const isEnglish = locale === "en";
  const product = productText[locale];
  const { selectedCity, selectedProject, openChooser } = useCity();
  const cityLabel = translatePlace(selectedCity, locale);
  const projectLabel = selectedProject
    ? translateComplexName(selectedProject, locale)
    : isEnglish ? "Any demo project" : "Любой демо-ЖК";
  const homeHref = localizePath(locale, "/");

  return (
    <footer className="site-footer" id="contacts">
      <div className="site-footer-main">
        <div className="footer-brand">
          <strong>{isEnglish ? "HALL" : "ХОЛЛ"}</strong>
          <p>{product.footer.brandBody}</p>
        </div>

        <div className="footer-column">
          <span>{product.footer.demoTitle}</span>
          <strong>{cityLabel}</strong>
          <small>{projectLabel}</small>
          <button type="button" onClick={openChooser}>{product.footer.demoButton}</button>
        </div>

        <div className="footer-column">
          <span>{product.footer.capabilitiesTitle}</span>
          <Link href={`${homeHref}#capabilities`}>{product.footer.capabilitiesTitle}</Link>
          <Link href={`${homeHref}#apartments`}>{product.footer.demoLink}</Link>
          <Link href={localizePath(locale, "/ai")}>{product.footer.mascotLink}</Link>
          <Link href={localizePath(locale, "/furniture")}>{product.footer.furnitureLink}</Link>
        </div>

        <div className="footer-column">
          <span>{product.footer.agenciesTitle}</span>
          <a href="mailto:sales@hall-home.ru">sales@hall-home.ru</a>
          <p>{product.footer.agenciesBody}</p>
          <small>{product.footer.contactNote}</small>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} {isEnglish ? "HALL" : "ХОЛЛ"}</span>
        <span>{product.footer.bottom}</span>
      </div>
    </footer>
  );
}
