"use client";

import { useEffect, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment } from "@/types/apartment";
import { formatArea, formatPrice } from "@/lib/format";
import { siteText, translatePlace, type Locale } from "@/lib/i18n";

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

const PAGE_SIZE = 12;

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

function trackSortInterest(sort: SortOption) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("sq-track-interest", { detail: { type: "sort", sort } }));
}

function sortApartments(items: Apartment[], sort: SortOption) {
  return [...items].sort((a, b) => {
    const statusCompare = statusWeight[a.status] - statusWeight[b.status];
    return statusCompare !== 0 ? statusCompare : compareInsideStatus(a, b, sort);
  });
}

function loadMoreLabel(locale: Locale) {
  if (locale === "en") return "Show more apartments";
  if (locale === "zh") return "显示更多房源";
  return "Показать ещё квартиры";
}

export function ApartmentCatalog({ apartments, locale = "ru" }: { apartments: Apartment[]; locale?: Locale }) {
  const [sort, setSort] = useState<SortOption>("recommended");
  const [city, setCity] = useState("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { getApartmentStatus, reservedApartmentIds } = useAuth();
  const text = siteText[locale].catalog;
  const sortLabels = text.sortLabels;

  const cities = useMemo(
    () => [...new Set(apartments.map((apartment) => apartment.city))].sort((a, b) => a.localeCompare(b, "ru")),
    [apartments]
  );

  const effectiveApartments = useMemo(
    () =>
      apartments.map((apartment) => ({
        ...apartment,
        status: getApartmentStatus(apartment.id, apartment.status)
      })),
    [apartments, getApartmentStatus, reservedApartmentIds]
  );

  const filteredApartments = useMemo(
    () => (city === "all" ? effectiveApartments : effectiveApartments.filter((apartment) => apartment.city === city)),
    [city, effectiveApartments]
  );

  const sortedApartments = useMemo(() => sortApartments(filteredApartments, sort), [filteredApartments, sort]);
  const visibleApartments = sortedApartments.slice(0, visibleCount);
  const hasMore = visibleApartments.length < sortedApartments.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [city, sort]);

  const availableApartments = useMemo(
    () => filteredApartments.filter((apartment) => apartment.status === "available"),
    [filteredApartments]
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
          <strong>
            {sortedApartments.length} {text.apartmentWord}
          </strong>
          <span>
            {text.sorting}: {sortLabels[sort]}
          </span>
        </div>

        <div className="catalog-filter-group">
          <label className="sort-control">
            <span>{text.cityFilter}</span>
            <select value={city} onChange={(event) => setCity(event.target.value)}>
              <option value="all">{text.allCities}</option>
              {cities.map((cityName) => (
                <option value={cityName} key={cityName}>
                  {translatePlace(cityName, locale)}
                </option>
              ))}
            </select>
          </label>

          <label className="sort-control">
            <span>{text.sortControl}</span>
            <select
              value={sort}
              onChange={(event) => {
                const nextSort = event.target.value as SortOption;
                setSort(nextSort);
                trackSortInterest(nextSort);
              }}
            >
              {(Object.entries(sortLabels) as [SortOption, string][]).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="quick-sort-row" aria-label={text.quickSortAria}>
        <button
          type="button"
          onClick={() => {
            setSort("price-asc");
            trackSortInterest("price-asc");
          }}
        >
          {text.cheaper}
          {cheapestApartment ? (
            <small>
              {siteText[locale].home.from} {formatPrice(cheapestApartment.price, locale)}
            </small>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            setSort("area-desc");
            trackSortInterest("area-desc");
          }}
        >
          {text.larger}
          {largestApartment ? (
            <small>
              {text.upTo} {formatArea(largestApartment.totalArea, locale)}
            </small>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            setSort("floor-desc");
            trackSortInterest("floor-desc");
          }}
        >
          {text.higher}
          {highestFloorApartment ? (
            <small>
              {text.upTo} {highestFloorApartment.floor} {text.floorUpTo}
            </small>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => {
            setSort("mortgage-asc");
            trackSortInterest("mortgage-asc");
          }}
        >
          {text.lowerMortgage}
          <small>{text.byPayment}</small>
        </button>
      </div>

      <div className="cards-grid">
        {visibleApartments.map((apartment) => (
          <ApartmentCard apartment={apartment} locale={locale} key={apartment.id} />
        ))}
      </div>

      {hasMore ? (
        <div className="catalog-load-more">
          <button className="button button-ghost" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            {loadMoreLabel(locale)}
          </button>
        </div>
      ) : null}
    </div>
  );
}
