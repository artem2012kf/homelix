"use client";

import type { Apartment } from "@/types/apartment";
import { SmartRecommendationBell } from "@/components/SmartRecommendationBell";
import { useCity } from "@/components/CityProvider";

export function CityRecommendationBell({ apartments }: { apartments: Apartment[] }) {
  const { selectedCity } = useCity();
  return <SmartRecommendationBell apartments={apartments.filter((apartment) => apartment.city === selectedCity)} />;
}