"use client";

import Link from "next/link";
import type { Apartment } from "@/types/apartment";
import { ApartmentCardActions } from "@/components/ApartmentCardActions";
import { ApartmentMiniPlan } from "@/components/ApartmentMiniPlan";
import { useAuth } from "@/components/AuthProvider";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";
import { getResidentialComplexByApartmentId } from "@/lib/residential-complexes";

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const { getApartmentStatus } = useAuth();
  const effectiveStatus = getApartmentStatus(apartment.id, apartment.status);
  const complex = getResidentialComplexByApartmentId(apartment.id, apartment.project);

  return (
    <article className="apartment-card">
      <div className="card-topline">
        <span className={`status status-${effectiveStatus}`}>{statusLabel(effectiveStatus)}</span>
        <span>{apartment.floor} этаж</span>
      </div>

      <Link href={`/apartment/${apartment.id}`} aria-label={`Открыть планировку: ${apartment.title}`}>
        <ApartmentMiniPlan apartment={apartment} />
      </Link>

      <div>
        <span
          style={{
            display: "inline-flex",
            marginBottom: 10,
            padding: "7px 11px",
            borderRadius: 999,
            color: "var(--primary-dark)",
            background: "rgba(249, 62, 62, 0.08)",
            fontSize: 13,
            fontWeight: 900
          }}
        >
          {complex.name}
        </span>
        <h3>{apartment.title}</h3>
      </div>

      <p className="muted">
        {complex.name}, {complex.district}, {apartment.building}, {apartment.section}. Вид: {apartment.windowView}.
      </p>

      <div className="card-metrics">
        <div>
          <small>Площадь</small>
          <strong>{formatArea(apartment.totalArea)}</strong>
        </div>
        <div>
          <small>Цена</small>
          <strong>{formatPrice(apartment.price)}</strong>
        </div>
      </div>

      <ApartmentCardActions apartment={apartment} effectiveStatus={effectiveStatus} />
    </article>
  );
}
