"use client";

import Link from "next/link";
import type { Apartment } from "@/types/apartment";
import { ApartmentCardActions } from "@/components/ApartmentCardActions";
import { ApartmentMiniPlan } from "@/components/ApartmentMiniPlan";
import { useAuth } from "@/components/AuthProvider";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";
import { getResidentialComplexByApartmentId } from "@/lib/residential-complexes";
import {
  localizeApartment,
  siteText,
  translateComplexName,
  translatePlace,
  type Locale
} from "@/lib/i18n";

export function ApartmentCard({ apartment, locale = "ru" }: { apartment: Apartment; locale?: Locale }) {
  const { getApartmentStatus } = useAuth();
  const effectiveStatus = getApartmentStatus(apartment.id, apartment.status);
  const complex = getResidentialComplexByApartmentId(apartment.id, apartment.project);
  const displayApartment = localizeApartment(apartment, locale);
  const complexName = translateComplexName(complex.name, locale);
  const district = translatePlace(complex.microdistrict ?? complex.district, locale);
  const city = translatePlace(apartment.city, locale);
  const text = siteText[locale].card;

  return (
    <article className="apartment-card">
      <div className="card-topline">
        <span className={`status status-${effectiveStatus}`}>{statusLabel(effectiveStatus, locale)}</span>
        <span>
          {city} · {apartment.floor} {text.floor}
        </span>
      </div>

      <Link href={`/apartment/${apartment.id}`} aria-label={`${text.openPlanAria}: ${displayApartment.title}`}>
        <ApartmentMiniPlan apartment={displayApartment} />
      </Link>

      <div>
        <span className="apartment-complex-badge">
          {city} · {complexName}
        </span>
        <h3>{displayApartment.title}</h3>
      </div>

      <p className="muted">
        {district}, {displayApartment.building}, {displayApartment.section}. {text.view}: {displayApartment.windowView}.
      </p>

      <div className="card-metrics">
        <div>
          <small>{text.area}</small>
          <strong>{formatArea(apartment.totalArea, locale)}</strong>
        </div>
        <div>
          <small>{text.price}</small>
          <strong>{formatPrice(apartment.price, locale)}</strong>
        </div>
      </div>

      <ApartmentCardActions apartment={apartment} effectiveStatus={effectiveStatus} locale={locale} />
    </article>
  );
}
