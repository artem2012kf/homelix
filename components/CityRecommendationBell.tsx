"use client";

import { usePathname } from "next/navigation";
import type { Apartment } from "@/types/apartment";
import { SmartRecommendationBell } from "@/components/SmartRecommendationBell";
import { SmartRecommendationBellEn } from "@/components/SmartRecommendationBellEn";
import { useCity } from "@/components/CityProvider";
import { getLocaleFromPathname } from "@/lib/i18n";

export function CityRecommendationBell({ apartments }: { apartments: Apartment[] }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const { selectedCity, selectedProject } = useCity();
  const scoped = apartments.filter(
    (apartment) => apartment.city === selectedCity && (!selectedProject || apartment.project === selectedProject)
  );

  return locale === "en"
    ? <SmartRecommendationBellEn apartments={scoped} />
    : <SmartRecommendationBell apartments={scoped} />;
}
