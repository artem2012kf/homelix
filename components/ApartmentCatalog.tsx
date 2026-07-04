"use client";

import { useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment } from "@/types/apartment";
import { formatArea, formatPrice } from "@/lib/format";

type SortOption =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "area-asc"
  | "area-desc"
  | "floor-asc"
  | "floor-desc"
  | "rooms-asc"
  | "rooms-desc"
  | "mortgage-asc";

const sortLabels: Record<SortOption, string> = {
  recommended: "Свободные → бронь → проданные",
  "price-asc": "Цена: сначала дешевле",
  "price-desc": "Цена: сначала дороже",
  "area-asc": "Площадь: сначала меньше",
  "area-desc": "Площадь: сначала больше",
  "floor-asc": "Этаж: сначала ниже",
  "floor-desc": "Этаж: сначала выше",
  "rooms-asc": "Комнатность: сначала меньше",
  "rooms-desc": "Комнатность: сначала больше",
  "mortgage-asc": "Платеж по ипотеке: сначала ниже"
};

const statusWeight: Record<Apartment["status"], number> = {
  available: 0,
  reserved: 1,
  sold: 2
};

function compareInsideStatus(a: Apartment, b: Apartment, sort: SortOption) {
  if (sort === "price-asc" || sort === "recommended") return a.price - b.price || a.floor - b.floor;
  if (sort === "price-desc") return b.price - a.price || a.floor - b.floor;
  if (sort === "area-asc") return a.totalArea - b.totalArea || a.price - b.price;
  if (sort === "area-desc") return b.totalArea - a.totalArea || a.price - b.price;
  if (sort === "floor-asc") return a.floor - b.floor || a.price - b.price;
  if (sort === "floor-desc") return b.floor - a.floor || a.price - b.price;
  if (sort === "rooms-asc") return a.roomsCount - b.roomsCount || a.totalArea - b.totalArea;
  if (sort === "rooms-desc") return b.roomsCount - a.roomsCount || b.totalArea - a.totalArea;
  if (sort === "mortgage-asc") return a.mortgagePayment - b.mortgagePayment || a.price - b.price;

  return a.price - b.price;
}

function sortApartments(items: Apartment[], sort: SortOption) {
  return [...items].sort((a, b) => {
    const statusCompare = statusWeight[a.status] - statusWeight[b.status];

    if (statusCompare !== 0) {
      return statusCompare;
    }

    return compareInsideStatus(a, b, sort);
  });
}

export function ApartmentCatalog({ apartments }: { apartments: Apartment[] }) {
  const [sort, setSort] = useState<SortOption>("recommended");
  const { getApartmentStatus, reservedApartmentIds } = useAuth();

  const effectiveApartments = useMemo(
    () =>
      apartments.map((apartment) => ({
        ...apartment,
        status: getApartmentStatus(apartment.id, apartment.status)
      })),
    [apartments, getApartmentStatus, reservedApartmentIds]
  );

  const sortedApartments = useMemo(() => sortApartments(effectiveApartments, sort), [effectiveApartments, sort]);

  const availableApartments = useMemo(
    () => effectiveApartments.filter((apartment) => apartment.status === "available"),
    [effectiveApartments]
  );

  const cheapestApartment = useMemo(
    () => [...availableApartments].sort((a, b) => a.price - b.price)[0],
    [availableApartments]
  );

  const largestApartment = useMemo(
    () => [...availableApartments].sort((a, b) => b.totalArea - a.totalArea)[0],
    [availableApartments]
  );

  const highestFloorApartment = useMemo(
    () => [...availableApartments].sort((a, b) => b.floor - a.floor)[0],
    [availableApartments]
  );

  return (
    <div className="catalog-block">
      <div className="catalog-toolbar">
        <div>
          <strong>{sortedApartments.length} квартир</strong>
          <span>Сортировка: {sortLabels[sort]}</span>
        </div>

        <label className="sort-control">
          <span>Сортировать</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
            {Object.entries(sortLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>


      <div className="quick-sort-row" aria-label="Быстрая сортировка квартир">
        <button type="button" onClick={() => setSort("price-asc")}>
          Дешевле
          {cheapestApartment ? <small>от {formatPrice(cheapestApartment.price)}</small> : null}
        </button>
        <button type="button" onClick={() => setSort("area-desc")}>
          Больше площадь
          {largestApartment ? <small>до {formatArea(largestApartment.totalArea)}</small> : null}
        </button>
        <button type="button" onClick={() => setSort("floor-desc")}>
          Выше этаж
          {highestFloorApartment ? <small>до {highestFloorApartment.floor} этажа</small> : null}
        </button>
        <button type="button" onClick={() => setSort("mortgage-asc")}>
          Ниже ипотека
          <small>по платежу</small>
        </button>
      </div>

      <div className="cards-grid">
        {sortedApartments.map((apartment) => (
          <ApartmentCard apartment={apartment} key={apartment.id} />
        ))}
      </div>
    </div>
  );
}
