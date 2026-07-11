"use client";

import Link from "next/link";
import { useMemo } from "react";
import { AiOnlyChat } from "@/components/AiOnlyChat";
import { useCity } from "@/components/CityProvider";
import { apartments } from "@/lib/apartments";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";

export default function AiPage() {
  const { selectedCity, selectedProject, openChooser } = useCity();
  const projectLabel = selectedProject || "Любой ЖК";
  const scopedApartments = useMemo(
    () =>
      apartments.filter(
        (apartment) =>
          apartment.city === selectedCity && (!selectedProject || apartment.project === selectedProject)
      ),
    [selectedCity, selectedProject]
  );

  return (
    <main>
      <section className="ai-page-hero">
        <Link href="/" className="back-link">
          ← На главную
        </Link>
        <span className="eyebrow">ИИ-консультант ХОЛЛ</span>
        <h1>{selectedProject ? "Рекомендации по выбранному ЖК" : "Рекомендации по всем ЖК выбранного города"}</h1>
        <p>
          Текущий контекст: <strong>{selectedCity}</strong> · <strong>{projectLabel}</strong>. Можно сразу написать бюджет,
          комнатность, этаж или цель покупки — повторно указывать город не нужно.
        </p>
        <button type="button" className="button button-ghost" onClick={openChooser}>
          Изменить город и ЖК
        </button>
      </section>

      <section className="section ai-page-grid">
        <AiOnlyChat />

        <aside className="available-list-card">
          <span className="eyebrow">{scopedApartments.length} предложений</span>
          <h2>{selectedProject || `Все ЖК · ${selectedCity}`}</h2>
          <div className="available-list">
            {scopedApartments.map((apartment) => (
              <article key={apartment.id}>
                <div>
                  <span className={`status status-${apartment.status}`}>{statusLabel(apartment.status)}</span>
                  <h3>{apartment.title}</h3>
                  <p>
                    {apartment.project}, {apartment.building}, {apartment.floor} этаж · {formatArea(apartment.totalArea)}
                  </p>
                </div>
                <strong>{formatPrice(apartment.price)}</strong>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
