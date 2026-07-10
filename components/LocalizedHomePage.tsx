import { ApartmentCatalog } from "@/components/ApartmentCatalog";
import { MascotImage } from "@/components/MascotImage";
import { apartments } from "@/lib/apartments";
import { formatPrice } from "@/lib/format";
import {
  getIntlLocale,
  siteText,
  translateComplexName,
  translatePlace,
  translateTag,
  type Locale
} from "@/lib/i18n";
import { residentialComplexes } from "@/lib/residential-complexes";

const availableCount = apartments.filter((item) => item.status === "available").length;
const totalCount = apartments.length;
const minPrice = Math.min(...apartments.map((item) => item.price));

export function LocalizedHomePage({ locale }: { locale: Locale }) {
  const text = siteText[locale].home;
  const intlLocale = getIntlLocale(locale);

  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <span className="eyebrow">{text.eyebrow}</span>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#apartments">
              {text.apartmentsButton}
            </a>
            <a className="button button-ghost" href="#complexes">
              {text.complexesButton}
            </a>
          </div>
          <div className="hero-stats" aria-label={text.statsLabel}>
            <div>
              <strong>{totalCount}</strong>
              <span>{text.apartmentsInDatabase}</span>
            </div>
            <div>
              <strong>{availableCount}</strong>
              <span>{text.availableNow}</span>
            </div>
            <div>
              <strong>
                {text.from} {formatPrice(minPrice, locale)}
              </strong>
              <span>{text.startingPrice}</span>
            </div>
          </div>
        </div>

        <div
          className="hero-widget"
          style={{
            position: "relative",
            minHeight: 520,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "min(100%, 430px)",
              minHeight: 470,
              display: "grid",
              placeItems: "center",
              padding: 34,
              border: "1px solid var(--line)",
              borderRadius: 42,
              background:
                "radial-gradient(circle at 50% 28%, rgba(249, 62, 62, 0.12), transparent 13rem), #ffffff",
              boxShadow: "var(--shadow)",
              textAlign: "center"
            }}
          >
            <MascotImage
              width={255}
              priority
              alt={text.mascotAlt}
              style={{
                width: "min(76%, 255px)",
                height: "auto",
                filter: "drop-shadow(0 26px 36px rgba(249, 62, 62, 0.24))"
              }}
            />
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              <strong style={{ fontSize: 30, lineHeight: 1, color: "var(--text)" }}>{text.mascotTitle}</strong>
              <span style={{ color: "var(--muted)", lineHeight: 1.45 }}>{text.mascotBody}</span>
            </div>
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
          <span className="eyebrow">
            {residentialComplexes.length} {text.complexesEyebrow}
          </span>
          <h2>{text.complexesTitle}</h2>
          <p>{text.complexesBody}</p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18
          }}
        >
          {residentialComplexes.map((complex, index) => (
            <article
              key={complex.id}
              style={{
                display: "grid",
                gap: 14,
                padding: 22,
                border: "1px solid var(--line)",
                borderRadius: "var(--radius-xl)",
                background: "rgba(255, 255, 255, 0.86)",
                boxShadow: "0 18px 56px rgba(65, 45, 20, 0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    display: "grid",
                    minWidth: 42,
                    height: 42,
                    placeItems: "center",
                    borderRadius: 14,
                    color: "#ffffff",
                    background: "var(--primary)",
                    fontWeight: 900
                  }}
                >
                  {index + 1}
                </span>
                {typeof complex.rating === "number" ? (
                  <strong style={{ color: "var(--text)" }}>★ {complex.rating}</strong>
                ) : null}
              </div>

              <div>
                <h3 style={{ margin: 0, fontSize: 25, letterSpacing: "-0.04em" }}>
                  {translateComplexName(complex.name, locale)}
                </h3>
                <p style={{ margin: "8px 0 0", color: "var(--muted)", lineHeight: 1.45 }}>
                  {translatePlace(complex.district, locale)}
                  {complex.microdistrict ? ` · ${translatePlace(complex.microdistrict, locale)}` : ""}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10
                }}
              >
                <div style={{ padding: 12, borderRadius: 18, background: "#fbf7ef" }}>
                  <small style={{ display: "block", color: "var(--muted)" }}>{text.score}</small>
                  <strong>{complex.score?.toLocaleString(intlLocale) ?? "—"}</strong>
                </div>
                <div style={{ padding: 12, borderRadius: 18, background: "#fbf7ef" }}>
                  <small style={{ display: "block", color: "var(--muted)" }}>{text.reviews}</small>
                  <strong>{complex.reviews?.toLocaleString(intlLocale) ?? "—"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {complex.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "7px 9px",
                      border: "1px solid var(--line)",
                      borderRadius: 999,
                      color: "var(--muted)",
                      background: "#ffffff",
                      fontSize: 12,
                      fontWeight: 800
                    }}
                  >
                    {translateTag(tag, locale)}
                  </span>
                ))}
              </div>
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

      <section className="section contacts-section" id="contacts">
        <div className="section-heading">
          <span className="eyebrow">{text.contactsEyebrow}</span>
          <h2>{text.contactsTitle}</h2>
          <p>{text.contactsBody}</p>
        </div>
        <div className="contacts-grid">
          <article>
            <span>{text.phone}</span>
            <strong>+7 (900) 000-00-00</strong>
            <p>{text.phoneHours}</p>
          </article>
          <article>
            <span>{text.address}</span>
            <strong>{text.city}</strong>
            <p>{text.addressBody}</p>
          </article>
          <article>
            <span>Email</span>
            <strong>sales@sunny-quarter.ru</strong>
            <p>{text.emailBody}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
