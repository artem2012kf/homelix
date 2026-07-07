import Link from "next/link";
import { notFound } from "next/navigation";
import { ApartmentExperience } from "@/components/ApartmentExperience";
import { ApartmentCardActions } from "@/components/ApartmentCardActions";
import { ApartmentStatusBadge } from "@/components/ApartmentStatusBadge";
import { apartments, getApartmentById } from "@/lib/apartments";
import { formatArea, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return apartments.map((apartment) => ({ id: apartment.id }));
}

export default async function ApartmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const apartment = getApartmentById(id);

  if (!apartment) notFound();

  return (
    <main>
      <section className="apartment-hero">
        <Link href="/" className="back-link">
          ← Назад к каталогу
        </Link>
        <div className="apartment-hero-grid">
          <div>
            <ApartmentStatusBadge apartmentId={apartment.id} baseStatus={apartment.status} />
            <h1>{apartment.title}</h1>
            <p className="muted">
              {apartment.project}, {apartment.building}, {apartment.section}, {apartment.floor} этаж.
            </p>
          </div>
          <div className="price-box">
            <span>Стоимость</span>
            <strong>{formatPrice(apartment.price)}</strong>
            <small>от {formatPrice(apartment.mortgagePayment)} / мес.</small>
            <ApartmentCardActions apartment={apartment} showPlanLink={false} />
          </div>
        </div>
        <div className="metrics-strip">
          <div>
            <span>Площадь</span>
            <strong>{formatArea(apartment.totalArea)}</strong>
          </div>
          <div>
            <span>Комнат</span>
            <strong>{apartment.roomsCount}</strong>
          </div>
          <div>
            <span>Потолки</span>
            <strong>{apartment.ceilingHeight} м</strong>
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
