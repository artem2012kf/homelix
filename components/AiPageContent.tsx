"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AiOnlyChat } from "@/components/AiOnlyChat";
import { CurrencyPrice } from "@/components/CurrencyProvider";
import { useCity } from "@/components/CityProvider";
import { apartments } from "@/lib/apartments";
import { formatArea, statusLabel } from "@/lib/format";
import { localizePath } from "@/lib/locale-path";
import type { Locale } from "@/lib/i18n";

export function AiPageContent({ locale }: { locale: Locale }) {
  const { selectedCity, selectedProject, openChooser } = useCity();
  const isEnglish = locale === "en";
  const projectLabel = selectedProject || (isEnglish ? "Any project" : "Любой ЖК");
  const scopedApartments = useMemo(
    () => apartments.filter((apartment) => apartment.city === selectedCity && (!selectedProject || apartment.project === selectedProject)),
    [selectedCity, selectedProject]
  );

  return (
    <main>
      <section className="ai-page-hero">
        <Link href={localizePath(locale, "/")} className="back-link">
          {isEnglish ? "← Back to home" : "← На главную"}
        </Link>
        <span className="eyebrow">{isEnglish ? "HALL AI assistant" : "ИИ-консультант ХОЛЛ"}</span>
        <h1>
          {isEnglish
            ? selectedProject ? "Recommendations for the selected project" : "Recommendations across all projects in the selected city"
            : selectedProject ? "Рекомендации по выбранному ЖК" : "Рекомендации по всем ЖК выбранного города"}
        </h1>
        <p>
          {isEnglish ? "Current context: " : "Текущий контекст: "}
          <strong>{selectedCity}</strong> · <strong>{projectLabel}</strong>. {isEnglish
            ? "Enter your budget, preferred number of rooms, floor or purchase goal — you do not need to repeat the city."
            : "Можно сразу написать бюджет, комнатность, этаж или цель покупки — повторно указывать город не нужно."}
        </p>
        <button type="button" className="button button-ghost" onClick={openChooser}>
          {isEnglish ? "Change city and project" : "Изменить город и ЖК"}
        </button>
      </section>

      <section className="section ai-page-grid">
        <AiOnlyChat locale={locale} />

        <aside className="available-list-card">
          <span className="eyebrow">{scopedApartments.length} {isEnglish ? "listings" : "предложений"}</span>
          <h2>{selectedProject || (isEnglish ? `All projects · ${selectedCity}` : `Все ЖК · ${selectedCity}`)}</h2>
          <div className="available-list">
            {scopedApartments.map((apartment) => (
              <article key={apartment.id}>
                <div>
                  <span className={`status status-${apartment.status}`}>{statusLabel(apartment.status, locale)}</span>
                  <h3>{apartment.title}</h3>
                  <p>
                    {apartment.project}, {apartment.building}, {apartment.floor} {isEnglish ? "floor" : "этаж"} · {formatArea(apartment.totalArea, locale)}
                  </p>
                </div>
                <strong><CurrencyPrice value={apartment.price} /></strong>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
