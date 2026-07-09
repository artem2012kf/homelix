import Link from "next/link";
import { notFound } from "next/navigation";
import { ApartmentExperience } from "@/components/ApartmentExperience";
import { ApartmentPriceBox } from "@/components/ApartmentPriceBox";
import { ApartmentStatusBadge } from "@/components/ApartmentStatusBadge";
import { apartments, getApartmentById } from "@/lib/apartments";
import { formatArea } from "@/lib/format";
import { getResidentialComplexByApartmentId } from "@/lib/residential-complexes";

export function generateStaticParams() {
  return apartments.map((apartment) => ({ id: apartment.id }));
}

export default async function ApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apartment = getApartmentById(id);

  if (!apartment) notFound();

  const complex = getResidentialComplexByApartmentId(apartment.id, apartment.project);

  return (
    <main>
      <section className="apartment-hero">
        <Link href="/" className="back-link">
          ← Назад к каталогу
        </Link>
        <div className="apartment-hero-grid">
          <div>
            <ApartmentStatusBadge apartmentId={apartment.id} baseStatus={apartment.status} />
            <span
              style={{
                display: "inline-flex",
                margin: "0 0 14px 10px",
                padding: "8px 12px",
                borderRadius: 999,
                color: "var(--primary-dark)",
                background: "rgba(249, 62, 62, 0.08)",
                fontSize: 13,
                fontWeight: 900
              }}
            >
              {complex.name}
            </span>
            <h1>{apartment.title}</h1>
            <p className="muted">
              {complex.name}, {complex.district}, {apartment.building}, {apartment.section}, {apartment.floor} этаж.
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 16
              }}
            >
              {complex.tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: "7px 10px",
                    border: "1px solid var(--line)",
                    borderRadius: 999,
                    color: "var(--muted)",
                    background: "#ffffff",
                    fontSize: 12,
                    fontWeight: 800
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <ApartmentPriceBox apartment={apartment} />
        </div>
        <div className="metrics-strip">
          <div>
            <span>ЖК</span>
            <strong>{complex.name.replace(/^ЖК\s+/i, "")}</strong>
          </div>
          <div>
            <span>Площадь</span>
            <strong>{formatArea(apartment.totalArea)}</strong>
          </div>
          <div>
            <span>Комнат</span>
            <strong>{apartment.roomsCount}</strong>
          </div>
          <div>
            <span>Отделка</span>
            <strong>{apartment.finishing}</strong>
          </div>
        </div>
      </section>

      <section className="section apartment-details">
        <div className="advantages-card">
          <span className="eyebrow">Преимущества</span>
          <ul className="nice-list two-columns">
            {apartment.advantages.map((advantage) => (
              <li key={advantage}>{advantage}</li>
            ))}
          </ul>
        </div>
        <ApartmentExperience apartment={apartment} />
      </section>
    </main>
  );
}
