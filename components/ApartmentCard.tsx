"use client";

import Link from "next/link";
import type { Apartment } from "@/types/apartment";
import { ApartmentCardActions } from "@/components/ApartmentCardActions";
import { ApartmentMiniPlan } from "@/components/ApartmentMiniPlan";
import { useAuth } from "@/components/AuthProvider";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  const { getApartmentStatus } = useAuth();
  const effectiveStatus = getApartmentStatus(apartment.id, apartment.status);

  return (
    <article className="apartment-card">
      <div className="card-topline">
        <span className={`status status-${effectiveStatus}`}>{statusLabel(effectiveStatus)}</span>
        <span>{apartment.floor} этаж</span>
      </div>

      <Link href={`/apartment/${apartment.id}`} aria-label={`Открыть планировку: ${apartment.title}`}>
        <ApartmentMiniPlan apartment={apartment} />
      </Link>

      <h3>{apartment.title}</h3>
      <p className="muted">
        {apartment.building}, {apartment.section}. Вид: {apartment.windowView}.
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
