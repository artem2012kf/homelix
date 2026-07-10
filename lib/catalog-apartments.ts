import type { Apartment } from "@/types/apartment";
import { apartments as sourceApartments } from "./apartments";

/**
 * Единая точка публикации каталога. Удалённые объекты не попадают
 * в карточки, статические страницы, личный кабинет и ИИ-рекомендации.
 */
export const REMOVED_APARTMENT_IDS = [
  "apt-331",
  "apt-384",
  "apt-416",
  "apt-452",
  "apt-518",
  "apt-566",
  "apt-604",
  "apt-649",
  "apt-702",
  "apt-748",
  "apt-811",
  "apt-858",
  "apt-930",
  "apt-976",
  "apt-1004"
] as const;

const removedApartmentIds = new Set<string>(REMOVED_APARTMENT_IDS);

export const apartments: Apartment[] = sourceApartments.filter(
  (apartment) => !removedApartmentIds.has(apartment.id)
);

export function getApartmentById(id: string) {
  return apartments.find((apartment) => apartment.id === id);
}
