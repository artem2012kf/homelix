"use client";

import { useMemo } from "react";
import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { MascotImage } from "@/components/MascotImage";
import { CurrencyPrice } from "@/components/CurrencyProvider";
import { useCity } from "@/components/CityProvider";
import { apartments } from "@/lib/apartments";
import {
  getIntlLocale,
  siteText,
  translateComplexName,
  translatePlace,
  translateTag,
  type Locale
} from "@/lib/i18n";
import { residentialComplexes } from "@/lib/residential-complexes";

export function LocalizedHomePage({ locale }: { locale: Locale }) {
  const text = siteText[locale].home;
  const intlLocale = getIntlLocale(locale);
  const { selectedCity, selectedProject, openChooser } = useCity();

  const cityApartments = useMemo(
    () => apartments.filter((item) => item.city === selectedCity),
    [selectedCity]
  );
  const recommendedComplexes = useMemo(
    () => residentialComplexes.filter((complex) => complex.district === selectedCity),
    [selectedCity]
  );
  const availableCount = cityApartments.filter((item) => item.status === "available").length;
  const minPrice = Math.min(...cityApartments.map((item) => item.price));

  return (
    <main>
      <section className="hero hall-hero">
        <div className="hero-content">
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          <div className="hero-selected-location">
            <span>{locale === "en" ? "Selected" : "Выбрано"}</span>
            <strong>{translatePlace(selectedCity, locale)} · {translateComplexName(selectedProject, locale)}</strong>
            <button type="button" onClick={openChooser}>{locale === "en" ? "Change" : "Изменить"}</button>
          </div>
          <div className="hero-actions">
            <a className="button button-primary" href="#apartments">{text.apartmentsButton}</a>
            <button className="button button-ghost" type="button" onClick={openChooser}>{text.complexesButton}</button>
          </div>
          <div className="hero-stats" aria-label={text.statsLabel}>
            <div><strong>{cityApartments.length}</strong><span>{text.apartmentsInDatabase}</span></div>
            <div><strong>{availableCount}</strong><span>{text.availableNow}</span></div>
            <div>
              <strong>{text.from} <CurrencyPrice value={Number.isFinite(minPrice) ? minPrice : 0} /></strong>
              <span>{text.startingPrice}</span>
            </div>
          </div>
        </div>

        <div className="hero-widget hall-mascot-card">
          <MascotImage width={270} priority alt={text.mascotAlt} className="hall-hero-mascot" />
          <div>
            <strong>{text.mascotTitle}</strong>
            <span>{text.mascotBody}</span>
          </div>
        </div>
      </section>

      <section className="section" id="apartments">
        <div className="section-heading">
          <span className="eyebrow">{text.catalogEyebrow}</span>
          <h2>{text.catalogTitle}</h2>
          <p>{text.catalogBody}</p>
        </div>
        <ApartmentCatalog apartments={apartments} locale={locale} />
      </section>

      <section className="section" id="complexes">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{recommendedComplexes.length} {text.complexesEyebrow}</span>
          <h2>{text.complexesTitle}: {translatePlace(selectedCity, locale)}</h2>
          <p>{text.complexesBody}</p>
        </div>

        <div className="complexes-grid">
          {recommendedComplexes.map((complex, index) => (
            <article className="complex-card" key={complex.id}>
              <div className="complex-card-index">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <h3>{translateComplexName(complex.name, locale)}</h3>
                <p>{translatePlace(complex.microdistrict ?? complex.district, locale)}</p>
              </div>
              <div className="complex-card-metrics">
                <span>★ {complex.rating ?? "—"}</span>
                <span>{complex.reviews?.toLocaleString(intlLocale) ?? "—"} {text.reviews.toLowerCase()}</span>
              </div>
              <div className="complex-tags">
                {complex.tags.slice(0, 5).map((tag) => <span key={tag}>{translateTag(tag, locale)}</span>)}
              </div>
              <button className="button button-ghost" type="button" onClick={openChooser}>
                {locale === "en" ? "Selected project" : "Выбран ЖК"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture" id="architecture">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{text.workflowEyebrow}</span>
          <h2>{text.workflowTitle}</h2>
          <p>{text.workflowBody}</p>
        </div>
        <div className="workflow-panel">
          {text.workflow.map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
