"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useCity } from "@/components/CityProvider";
import { getCityInfo, getOpenStreetMapEmbedUrl } from "@/lib/city-data";
import { getLocaleFromPathname, translateComplexName, translatePlace } from "@/lib/i18n";

export function CityMap() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const isEnglish = locale === "en";
  const { selectedCity, selectedProject } = useCity();
  const [open, setOpen] = useState(false);
  const city = getCityInfo(selectedCity);
  const cityLabel = translatePlace(selectedCity, locale);
  const projectLabel = selectedProject
    ? translateComplexName(selectedProject, locale)
    : isEnglish ? "Selected residential project" : "Выбранный жилой комплекс";

  return (
    <>
      <button
        className="city-map-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={isEnglish ? `Open the map of ${cityLabel}` : `Открыть карту города ${cityLabel}`}
        title={isEnglish ? `Map: ${cityLabel}` : `Карта: ${cityLabel}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.7 7-12A7 7 0 1 0 5 9c0 6.3 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
      </button>

      {open ? (
        <div className="map-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="map-modal" role="dialog" aria-modal="true" aria-label={isEnglish ? `Map of ${cityLabel}` : `Карта ${cityLabel}`} onMouseDown={(event) => event.stopPropagation()}>
            <div className="map-modal-head">
              <div>
                <span className="eyebrow">{isEnglish ? "City map" : "Карта города"}</span>
                <h2>{cityLabel}</h2>
                <p>{projectLabel} · {isEnglish ? "sales office" : "офис продаж"}: {city.officeAddress}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label={isEnglish ? "Close map" : "Закрыть карту"}>×</button>
            </div>
            <iframe
              title={isEnglish ? `Interactive map of ${cityLabel}` : `Интерактивная карта ${cityLabel}`}
              className="city-map-frame"
              src={getOpenStreetMapEmbedUrl(selectedCity)}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="map-modal-footer">
              <span>{isEnglish ? "Drag and zoom the map." : "Карту можно перемещать и масштабировать."}</span>
              <a
                className="button button-ghost"
                href={`https://www.openstreetmap.org/?mlat=${city.lat}&mlon=${city.lon}#map=${city.zoom}/${city.lat}/${city.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                {isEnglish ? "Open full map" : "Открыть большую карту"}
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
