import Link from "next/link";
import { notFound } from "next/navigation";
import { ApartmentExperienceEn } from "@/components/ApartmentExperienceEn";
import { ApartmentPriceBox } from "@/components/ApartmentPriceBox";
import { ApartmentStatusBadge } from "@/components/ApartmentStatusBadge";
import { apartments, getApartmentById } from "@/lib/apartments";
import { formatArea } from "@/lib/format";
import {
  localizeApartment,
  translateComplexName,
  translatePlace,
  translateTag
} from "@/lib/i18n";
import { getResidentialComplexByApartmentId } from "@/lib/residential-complexes";

export function generateStaticParams() {
  return apartments.map((apartment) => ({ id: apartment.id }));
}

function translateFinishing(value: string) {
  const translations: Record<string, string> = {
    "Без отделки": "Shell condition",
    "Предчистовая": "White-box finish",
    "Чистовая": "Finished",
    "С отделкой": "Finished",
    "Дизайнерская": "Designer finish"
  };
  return translations[value] ?? value;
}

function translateAdvantage(value: string) {
  const translated = translateTag(value, "en");
  if (translated !== value) return translated;
  return value
    .replace(/вид на город/gi, "city views")
    .replace(/вид на реку/gi, "river views")
    .replace(/вид на парк/gi, "park views")
    .replace(/панорамные окна/gi, "panoramic windows")
    .replace(/просторная кухня-гостиная/gi, "spacious kitchen-living room")
    .replace(/гардеробная/gi, "walk-in closet")
    .replace(/мастер-спальня/gi, "primary bedroom")
    .replace(/два санузла/gi, "two bathrooms")
    .replace(/лоджия/gi, "loggia")
    .replace(/высокие потолки/gi, "high ceilings")
    .replace(/семейная планировка/gi, "family-friendly floor plan");
}

export default async function EnglishApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apartment = getApartmentById(id);
  if (!apartment) notFound();

  const displayApartment = localizeApartment(apartment, "en");
  const complex = getResidentialComplexByApartmentId(apartment.id, apartment.project);
  const complexName = translateComplexName(complex.name, "en");
  const district = translatePlace(complex.district, "en");

  return (
    <main>
      <section className="apartment-hero">
        <Link href="/en#apartments" className="back-link">
          ← Back to the catalog
        </Link>
        <div className="apartment-hero-grid">
          <div>
            <ApartmentStatusBadge apartmentId={apartment.id} baseStatus={apartment.status} locale="en" />
            <span className="apartment-complex-badge">{complexName}</span>
            <h1>{displayApartment.title}</h1>
            <p className="muted">
              {complexName}, {district}, {displayApartment.building}, {displayApartment.section}, floor {apartment.floor}.
            </p>
            <div className="apartment-feature-tags">
              {complex.tags.slice(0, 5).map((tag) => (
                <span className="apartment-feature-tag" key={tag}>
                  {translateTag(tag, "en")}
                </span>
              ))}
            </div>
          </div>
          <ApartmentPriceBox apartment={apartment} locale="en" />
        </div>

        <div className="metrics-strip">
          <div>
            <span>Project</span>
            <strong>{complexName.replace(/\s+Residential Complex$/i, "")}</strong>
          </div>
          <div>
            <span>Area</span>
            <strong>{formatArea(apartment.totalArea, "en")}</strong>
          </div>
          <div>
            <span>Rooms</span>
            <strong>{apartment.roomsCount}</strong>
          </div>
          <div>
            <span>Finish</span>
            <strong>{translateFinishing(apartment.finishing)}</strong>
          </div>
        </div>
      </section>

      <section className="section apartment-details">
        <div className="advantages-card">
          <span className="eyebrow">Advantages</span>
          <ul className="nice-list two-columns">
            {apartment.advantages.map((advantage) => (
              <li key={advantage}>{translateAdvantage(advantage)}</li>
            ))}
          </ul>
        </div>
        <ApartmentExperienceEn apartment={displayApartment} />
      </section>
    </main>
  );
}
