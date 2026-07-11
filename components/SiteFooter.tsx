"use client";

import Link from "next/link";
import { useCity } from "@/components/CityProvider";
import { getCityInfo } from "@/lib/city-data";

export function SiteFooter() {
  const { selectedCity, selectedProject, openChooser } = useCity();
  const city = getCityInfo(selectedCity);

  return (
    <footer className="site-footer" id="contacts">
      <div className="site-footer-main">
        <div className="footer-brand">
          <strong>ХОЛЛ</strong>
          <p>Квартиры в новостройках России, интерактивные планы и мебель с доставкой в выбранную квартиру.</p>
        </div>

        <div className="footer-column">
          <span>Офис продаж · {selectedCity}</span>
          <strong>{city.officeAddress}</strong>
          <a href={`tel:${city.phone.replace(/[^+\d]/g, "")}`}>{city.phone}</a>
          <small>{selectedProject || "Любой ЖК города"}</small>
        </div>

        <div className="footer-column">
          <span>Разделы</span>
          <Link href="/#apartments">Квартиры</Link>
          <Link href="/furniture">Мебель и доставка</Link>
          <Link href="/account">Личный кабинет</Link>
          <button type="button" onClick={openChooser}>Сменить город и ЖК</button>
        </div>

        <div className="footer-column">
          <span>Связь</span>
          <a href="mailto:sales@hall-home.ru">sales@hall-home.ru</a>
          <p>Ежедневно, 09:00–21:00 по местному времени</p>
          <small>Адреса и предложения в демонстрационной версии требуют подтверждения менеджером.</small>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} ХОЛЛ</span>
        <span>Федеральный демонстрационный каталог недвижимости</span>
      </div>
    </footer>
  );
}
