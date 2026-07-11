"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCity } from "@/components/CityProvider";
import { getCityInfo } from "@/lib/city-data";
import { getLocaleFromPathname, translateComplexName, translatePlace } from "@/lib/i18n";
import { localizePath } from "@/lib/locale-path";

export function SiteFooter() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const isEnglish = locale === "en";
  const { selectedCity, selectedProject, openChooser } = useCity();
  const city = getCityInfo(selectedCity);
  const cityLabel = translatePlace(selectedCity, locale);
  const projectLabel = selectedProject
    ? translateComplexName(selectedProject, locale)
    : isEnglish ? "Any project in the city" : "Любой ЖК города";

  return (
    <footer className="site-footer" id="contacts">
      <div className="site-footer-main">
        <div className="footer-brand">
          <strong>{isEnglish ? "HALL" : "ХОЛЛ"}</strong>
          <p>{isEnglish
            ? "New-build apartments across Russia, interactive floor plans and furniture delivered to the selected apartment."
            : "Квартиры в новостройках России, интерактивные планы и мебель с доставкой в выбранную квартиру."}</p>
        </div>

        <div className="footer-column">
          <span>{isEnglish ? `Sales office · ${cityLabel}` : `Офис продаж · ${cityLabel}`}</span>
          <strong>{city.officeAddress}</strong>
          <a href={`tel:${city.phone.replace(/[^+\d]/g, "")}`}>{city.phone}</a>
          <small>{projectLabel}</small>
        </div>

        <div className="footer-column">
          <span>{isEnglish ? "Sections" : "Разделы"}</span>
          <Link href={`${localizePath(locale, "/")}#apartments`}>{isEnglish ? "Apartments" : "Квартиры"}</Link>
          <Link href={localizePath(locale, "/furniture")}>{isEnglish ? "Furniture & delivery" : "Мебель и доставка"}</Link>
          <Link href={localizePath(locale, "/account")}>{isEnglish ? "Account" : "Личный кабинет"}</Link>
          <button type="button" onClick={openChooser}>{isEnglish ? "Change city and project" : "Сменить город и ЖК"}</button>
        </div>

        <div className="footer-column">
          <span>{isEnglish ? "Contact" : "Связь"}</span>
          <a href="mailto:sales@hall-home.ru">sales@hall-home.ru</a>
          <p>{isEnglish ? "Daily, 9:00 AM–9:00 PM local time" : "Ежедневно, 09:00–21:00 по местному времени"}</p>
          <small>{isEnglish
            ? "Addresses and listings in this demonstration version must be confirmed by a manager."
            : "Адреса и предложения в демонстрационной версии требуют подтверждения менеджером."}</small>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} {isEnglish ? "HALL" : "ХОЛЛ"}</span>
        <span>{isEnglish ? "Nationwide demonstration real-estate catalog" : "Федеральный демонстрационный каталог недвижимости"}</span>
      </div>
    </footer>
  );
}
