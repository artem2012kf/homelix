"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { MascotImage } from "@/components/MascotImage";
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
import { localizePath } from "@/lib/locale-path";
import { productText } from "@/lib/product-copy";
import { residentialComplexes } from "@/lib/residential-complexes";

export function LocalizedHomePage({ locale }: { locale: Locale }) {
  const text = productText[locale];
  const sharedText = siteText[locale].home;
  const intlLocale = getIntlLocale(locale);
  const { selectedCity, selectedProject, openChooser } = useCity();
  const anyProjectLabel = locale === "en" ? "Any demo project" : "Любой демо-ЖК";
  const recommendedComplexes = useMemo(
    () => residentialComplexes.filter((complex) => complex.district === selectedCity),
    [selectedCity]
  );

  return (
    <main>
      <section className="hero hall-hero">
        <div className="hero-content">
          <span className="eyebrow">{text.hero.eyebrow}</span>
          <h1>{text.hero.title}</h1>
          <p>{text.hero.intro}</p>
          <div className="hero-selected-location">
            <span>{text.hero.selectedLabel}</span>
            <strong>
              {translatePlace(selectedCity, locale)} · {selectedProject ? translateComplexName(selectedProject, locale) : anyProjectLabel}
            </strong>
            <button type="button" onClick={openChooser}>{text.hero.changeLabel}</button>
          </div>
          <div className="hero-actions">
            <Link className="button button-primary" href={localizePath(locale, "/ai")}>{text.hero.primaryButton}</Link>
            <button className="button button-ghost" type="button" onClick={openChooser}>{text.hero.demoButton}</button>
          </div>
          <div className="hero-stats" aria-label={text.hero.statsLabel}>
            {text.hero.stats.map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
        </div>

        <div className="hero-widget hall-mascot-card">
          <MascotImage width={270} priority alt={sharedText.mascotAlt} className="hall-hero-mascot" />
          <div>
            <strong>{text.hero.mascotTitle}</strong>
            <span>{text.hero.mascotBody}</span>
          </div>
        </div>
      </section>

      <section className="section product-capabilities" id="capabilities">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{text.capabilities.eyebrow}</span>
          <h2>{text.capabilities.title}</h2>
          <p>{text.capabilities.body}</p>
        </div>
        <div className="product-capability-grid">
          {text.capabilities.items.map(([title, body], index) => (
            <article className="product-capability-card" key={title}>
              <span className="product-capability-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="apartments">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{text.demo.catalogEyebrow}</span>
          <h2>{text.demo.catalogTitle}</h2>
          <p className="product-demo-note">{text.demo.catalogBody}</p>
        </div>
        <ApartmentCatalog apartments={apartments} locale={locale} />
      </section>

      <section className="section" id="complexes">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{recommendedComplexes.length} {text.demo.complexesEyebrow}</span>
          <h2>{text.demo.complexesTitle}</h2>
          <p>{text.demo.complexesBody}</p>
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
                <span>{complex.reviews?.toLocaleString(intlLocale) ?? "—"} {sharedText.reviews.toLowerCase()}</span>
              </div>
              <div className="complex-tags">
                {complex.tags.slice(0, 5).map((tag) => <span key={tag}>{translateTag(tag, locale)}</span>)}
              </div>
              <button className="button button-ghost" type="button" onClick={openChooser}>
                {text.hero.demoButton}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="section architecture" id="architecture">
        <div className="section-heading wide-heading">
          <span className="eyebrow">{text.workflow.eyebrow}</span>
          <h2>{text.workflow.title}</h2>
          <p>{text.workflow.body}</p>
        </div>
        <div className="workflow-panel">
          {text.workflow.items.map(([title, description], index) => (
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
