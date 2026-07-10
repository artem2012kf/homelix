"use client";

import { useState } from "react";
import { useCity } from "@/components/CityProvider";
import { getCityInfo, getOpenStreetMapEmbedUrl } from "@/lib/city-data";

export function CityMap() {
  const { selectedCity, selectedProject } = useCity();
  const [open, setOpen] = useState(false);
  const city = getCityInfo(selectedCity);

  return (
    <>
      <button
        className="city-map-trigger"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Открыть карту города ${selectedCity}`}
        title={`Карта: ${selectedCity}`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 21s7-5.7 7-12A7 7 0 1 0 5 9c0 6.3 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.4" />
        </svg>
      </button>

      {open ? (
        <div className="map-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="map-modal" role="dialog" aria-modal="true" aria-label={`Карта ${selectedCity}`} onMouseDown={(event) => event.stopPropagation()}>
            <div className="map-modal-head">
              <div>
                <span className="eyebrow">Карта города</span>
                <h2>{selectedCity}</h2>
                <p>{selectedProject || "Выбранный жилой комплекс"} · офис продаж: {city.officeAddress}</p>
              </div>
              <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Закрыть карту">
                ×
              </button>
            </div>
            <iframe
              title={`Интерактивная карта ${selectedCity}`}
              className="city-map-frame"
              src={getOpenStreetMapEmbedUrl(selectedCity)}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="map-modal-footer">
              <span>Карту можно перемещать и масштабировать.</span>
              <a
                className="button button-ghost"
                href={`https://www.openstreetmap.org/?mlat=${city.lat}&mlon=${city.lon}#map=${city.zoom}/${city.lat}/${city.lon}`}
                target="_blank"
                rel="noreferrer"
              >
                Открыть большую карту
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}