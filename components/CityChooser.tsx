"use client";

import { usePathname } from "next/navigation";
import { useCity } from "@/components/CityProvider";
import { getLocaleFromPathname } from "@/lib/i18n";

export function CityChooser() {
  const pathname = usePathname();
  const isEnglish = getLocaleFromPathname(pathname) === "en";
  const {
    cities,
    projects,
    selectedCity,
    selectedProject,
    isChooserOpen,
    isReady,
    closeChooser,
    selectCity,
    selectProject,
    confirmSelection
  } = useCity();

  if (!isReady || !isChooserOpen) return null;

  return (
    <div className="city-dialog-backdrop" role="presentation" onMouseDown={closeChooser}>
      <section
        className="city-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="city-dialog-head">
          <div>
            <span className="eyebrow">{isEnglish ? "Set up the catalog" : "Настройте каталог"}</span>
            <h2 id="city-dialog-title">{isEnglish ? "Where are you looking for an apartment?" : "Где вы ищете квартиру?"}</h2>
            <p>{isEnglish
              ? "Choose a city and a specific residential project, or select “Any project” to browse every listing in the city."
              : "Выберите город и конкретный жилой комплекс либо вариант «Любой ЖК», чтобы смотреть предложения по всему городу."}</p>
          </div>
          <button className="icon-button" type="button" onClick={closeChooser} aria-label={isEnglish ? "Close" : "Закрыть"}>
            ×
          </button>
        </div>

        <div className="city-picker-grid" aria-label={isEnglish ? "Cities" : "Города"}>
          {cities.map((city) => (
            <button
              type="button"
              key={city}
              className={city === selectedCity ? "is-active" : ""}
              onClick={() => selectCity(city)}
            >
              {city}
            </button>
          ))}
        </div>

        <label className="project-picker">
          <span>{isEnglish ? "Residential project" : "Жилой комплекс"}</span>
          <select value={selectedProject} onChange={(event) => selectProject(event.target.value)}>
            <option value="">{isEnglish ? "Any project" : "Любой ЖК"}</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>

        <button className="button button-primary city-confirm" type="button" onClick={confirmSelection}>
          {isEnglish ? `Show listings in ${selectedCity}` : `Показать предложения в ${selectedCity}`}
        </button>
      </section>
    </div>
  );
}
