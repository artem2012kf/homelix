"use client";

import { useCity } from "@/components/CityProvider";

export function CityChooser() {
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
            <span className="eyebrow">Настройте каталог</span>
            <h2 id="city-dialog-title">Где вы ищете квартиру?</h2>
            <p>Выберите город и конкретный жилой комплекс либо вариант «Любой ЖК», чтобы смотреть предложения по всему городу.</p>
          </div>
          <button className="icon-button" type="button" onClick={closeChooser} aria-label="Закрыть">
            ×
          </button>
        </div>

        <div className="city-picker-grid" aria-label="Города">
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
          <span>Жилой комплекс</span>
          <select value={selectedProject} onChange={(event) => selectProject(event.target.value)}>
            <option value="">Любой ЖК</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </label>

        <button className="button button-primary city-confirm" type="button" onClick={confirmSelection}>
          Показать предложения в {selectedCity}
        </button>
      </section>
    </div>
  );
}
