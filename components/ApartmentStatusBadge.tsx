"use client";

import type { ApartmentStatus } from "@/types/apartment";
import { useAuth } from "@/components/AuthProvider";
import { statusLabel } from "@/lib/format";

export function ApartmentStatusBadge({
  apartmentId,
  baseStatus
}: {
  apartmentId: string;
  baseStatus: ApartmentStatus;
}) {
  const { getApartmentStatus } = useAuth();
  const status = getApartmentStatus(apartmentId, baseStatus);

  return <span className={`status status-${status}`}>{statusLabel(status)}</span>;
}
