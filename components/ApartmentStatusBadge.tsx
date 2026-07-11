"use client";

import type { ApartmentStatus } from "@/types/apartment";
import { useAuth } from "@/components/AuthProvider";
import { statusLabel } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

export function ApartmentStatusBadge({ apartmentId, baseStatus, locale = "ru" }: { apartmentId: string; baseStatus: ApartmentStatus; locale?: Locale }) {
  const { getApartmentStatus } = useAuth();
  const status = getApartmentStatus(apartmentId, baseStatus);
  return <span className={`status status-${status}`}>{statusLabel(status, locale)}</span>;
}
