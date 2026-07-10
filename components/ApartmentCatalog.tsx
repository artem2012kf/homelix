"use client";

import { useEffect, useMemo, useState } from "react";
import { ApartmentCard } from "@/components/ApartmentCard";
import { CurrencyPrice } from "@/components/CurrencyProvider";
import { useAuth } from "@/components/AuthProvider";
import { useCity } from "@/components/CityProvider";
import type { Apartment } from "@/types/apartment";
import { formatArea } from "@/lib/format";
import { siteText, type Locale } from "@/lib/i18n";

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

type StatusFilter = "all" | Apartment["status"];
const PAGE_SIZE = 12;

const statusWeight: Record<Apartment["status"], number> = { available: 0, reserved: 1, sold: 2 };

function compareInsideStatus(a: Apartment, b: Apartment, sort: SortOption) {
  if (sort === "price-asc" || sort === "recommended") return a.price - b.price || a.floor - b.floor;
  if (sort === "price-desc") return b.price - a.price || a.floor - b.floor;
  if (sort === "area-asc") return a.totalArea - b.totalArea || a.price - b.price;
  if (sort === "area-desc") return b.totalArea - a.totalArea || a.price - b.price;
  if (sort === "floor-asc") return a.floor - b.floor || a.price - b.price;
  if (sort === "floor-desc") return b.floor - a.floor || a.price - b.price;
  if (sort === "rooms-asc") return a.roomsCount - b.roomsCount || a.totalArea - b.totalArea;
  if (sort === "rooms-desc") return b.roomsCount - a.roomsCount || b.totalArea - a.totalArea;
  return a.mortgagePayment - b.mortgagePayment || a.price - b.price;
}

function sortApartments(items: Apartment[], sort: SortOption) {
  return [...items].sort((a, b) => {
    const statusCompare = statusWeight[a.status] - statusWeight[b.status];
    return statusCompare !== 0 ? statusCompare : compareInsideStatus(a, b, sort);
  });
}

function loadMoreLabel(locale: Locale) {
  return locale === "en" ? "Show more apartments" : "Показать ещё квартиры";
}

export function ApartmentCatalog({ apartments, locale = "ru" }: { apartments: Apartment[]; locale?: Locale }) {
  const { selectedCity, selectedProject } = useCity();
  const { getApartmentStatus, reservedApartmentIds } = useAuth();
  const text = siteText[locale].catalog;
  const [sort, setSort] = useState<SortOption>("recommended");
  const [project, setProject] = useState(selectedProject || "all");
  const [rooms, setRooms] = useState<number[]>([]);
  const [floor, setFloor] = useState<number | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [minArea, setMinArea] = useState(0);
  const [maxArea, setMaxArea] = useState(Number.POSITIVE_INFINITY);
  const [maxPrice, setMaxPrice] = useState(Number.POSITIVE_INFINITY);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const cityApartments = useMemo(
    () => apartments.filter((apartment) => apartment.city === selectedCity),
    [apartments, selectedCity]
  );
  const projects = useMemo(
    () => [...new Set(cityApartments.map((item) => item.project))].sort((a, b) => a.localeCompare(b, "ru")),
    [cityApartments]
  );
  const floors = useMemo(
    () => [...new Set(cityApartments.map((item) => item.floor))].sort((a, b) => a - b),
    [cityApartments]
  );
  const roomOptions = useMemo(
    () => [...new Set(cityApartments.map((item) => item.roomsCount))].sort((a, b) => a - b),
    [cityApartments]
  );
  const areaOptions = useMemo(() => {
    const min = Math.floor(Math.min(...cityApartments.map((item) => item.totalArea)) / 10) * 10;
    const max = Math.ceil(Math.max(...cityApartments.map((item) => item.totalArea)) / 10) * 10;
    return { min, max };
  }, [cityApartments]);
  const priceOptions = useMemo(() => {
    const max = Math.max(...cityApartments.map((item) => item.price));
    const step = max > 20_000_000 ? 5_000_000 : 2_000_000;
    return Array.from({ length: Math.max(1, Math.ceil(max / step)) }, (_, index) => (index + 1) * step);
  }, [cityApartments]);

  useEffect(() => {
    setProject(selectedProject && projects.includes(selectedProject) ? selectedProject : "all");
    setRooms([]);
    setFloor("all");
    setStatus("all");
    setMinArea(0);
    setMaxArea(Number.POSITIVE_INFINITY);
    setMaxPrice(Number.POSITIVE_INFINITY);
    setVisibleCount(PAGE_SIZE);
  }, [selectedCity, selectedProject, projects]);

  const effectiveApartments = useMemo(
    () => cityApartments.map((apartment) => ({ ...apartment, status: getApartmentStatus(apartment.id, apartment.status) })),
    [cityApartments, getApartmentStatus, reservedApartmentIds]
  );

  const filteredApartments = useMemo(() => effectiveApartments.filter((apartment) => {
    if (project !== "all" && apartment.project !== project) return false;
    if (rooms.length && !rooms.includes(apartment.roomsCount)) return false;
    if (floor !== "all" && apartment.floor !== floor) return false;
    if (status !== "all" && apartment.status !== status) return false;
    if (apartment.totalArea < minArea || apartment.totalArea > maxArea) return false;
    if (apartment.price > maxPrice) return false;
    return true;
  }), [effectiveApartments, project, rooms, floor, status, minArea, maxArea, maxPrice]);

  const sortedApartments = useMemo(() => sortApartments(filteredApartments, sort), [filteredApartments, sort]);
  const visibleApartments = sortedApartments.slice(0, visibleCount);
  const hasMore = visibleApartments.length < sortedApartments.length;

  useEffect(() => setVisibleCount(PAGE_SIZE), [project, rooms, floor, status, minArea, maxArea, maxPrice, sort]);

  function toggleRoom(value: number) {
    setRooms((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function resetFilters() {
    setProject(selectedProject && projects.includes(selectedProject) ? selectedProject : "all");
    setRooms([]);
    setFloor("all");
    setStatus("all");
    setMinArea(0);
    setMaxArea(Number.POSITIVE_INFINITY);
    setMaxPrice(Number.POSITIVE_INFINITY);
    setSort("recommended");
  }

  return (
    <div className="catalog-block">
      <div className="catalog-filter-panel">
        <div className="filter-row">
          <strong>{locale === "en" ? "Rooms" : "Комнатность"}</strong>
          <div className="floor-filter-pills">
            <button type="button" className={!rooms.length ? "is-active" : ""} onClick={() => setRooms([])}>{locale === "en" ? "Any" : "Любая"}</button>
            {roomOptions.map((value) => (
              <button type="button" className={rooms.includes(value) ? "is-active" : ""} key={value} onClick={() => toggleRoom(value)}>
                {value === 1 ? (locale === "en" ? "Studio / 1" : "Студия / 1") : value}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <strong>{locale === "en" ? "Floor" : "Этаж"}</strong>
          <div className="floor-filter-pills">
            <button type="button" className={floor === "all" ? "is-active" : ""} onClick={() => setFloor("all")}>{locale === "en" ? "Any" : "Любой"}</button>
            {floors.map((value) => <button type="button" className={floor === value ? "is-active" : ""} key={value} onClick={() => setFloor(value)}>{value}</button>)}
          </div>
        </div>

        <div className="filter-selects">
          <label>
            {locale === "en" ? "Project" : "Жилой комплекс"}
            <select value={project} onChange={(event) => setProject(event.target.value)}>
              <option value="all">{locale === "en" ? "All projects in the city" : "Все ЖК города"}</option>
              {projects.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label>
            {locale === "en" ? "Status" : "Статус"}
            <select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
              <option value="all">{locale === "en" ? "Any" : "Любой"}</option>
              <option value="available">{locale === "en" ? "Available" : "Свободна"}</option>
              <option value="reserved">{locale === "en" ? "Reserved" : "Забронирована"}</option>
              <option value="sold">{locale === "en" ? "Sold" : "Продана"}</option>
            </select>
          </label>
          <label>
            {locale === "en" ? "Area from" : "Площадь от"}
            <select value={minArea} onChange={(event) => setMinArea(Number(event.target.value))}>
              <option value="0">{locale === "en" ? "Any" : "Любая"}</option>
              {[areaOptions.min, areaOptions.min + 20, areaOptions.min + 40, areaOptions.min + 60].filter((value) => value < areaOptions.max).map((value) => <option key={value} value={value}>{value} m²</option>)}
            </select>
          </label>
          <label>
            {locale === "en" ? "Area to" : "Площадь до"}
            <select value={Number.isFinite(maxArea) ? maxArea : "all"} onChange={(event) => setMaxArea(event.target.value === "all" ? Number.POSITIVE_INFINITY : Number(event.target.value))}>
              <option value="all">{locale === "en" ? "Any" : "Любая"}</option>
              {[areaOptions.min + 30, areaOptions.min + 50, areaOptions.min + 80, areaOptions.max].filter((value, index, array) => value <= areaOptions.max && array.indexOf(value) === index).map((value) => <option key={value} value={value}>{value} m²</option>)}
            </select>
          </label>
          <label>
            {locale === "en" ? "Price up to" : "Цена до"}
            <select value={Number.isFinite(maxPrice) ? maxPrice : "all"} onChange={(event) => setMaxPrice(event.target.value === "all" ? Number.POSITIVE_INFINITY : Number(event.target.value))}>
              <option value="all">{locale === "en" ? "Any" : "Любая"}</option>
              {priceOptions.map((value) => <option key={value} value={value}>{Math.round(value / 1_000_000)} {locale === "en" ? "M RUB equivalent" : "млн ₽"}</option>)}
            </select>
          </label>
          <label>
            {text.sortControl}
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
              {(Object.entries(text.sortLabels) as [SortOption, string][]).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <div className="filter-summary">
          <div>
            <strong>{sortedApartments.length} {text.apartmentWord}</strong>
            <span> · {selectedCity}</span>
            {Number.isFinite(maxPrice) ? <span> · {locale === "en" ? "up to" : "до"} <CurrencyPrice value={maxPrice} /></span> : null}
            {minArea > 0 ? <span> · {locale === "en" ? "from" : "от"} {formatArea(minArea, locale)}</span> : null}
          </div>
          <button type="button" onClick={resetFilters}>{locale === "en" ? "Reset filters" : "Сбросить фильтры"}</button>
        </div>
      </div>

      {visibleApartments.length ? (
        <div className="cards-grid">
          {visibleApartments.map((apartment) => <ApartmentCard apartment={apartment} locale={locale} key={apartment.id} />)}
        </div>
      ) : (
        <div className="empty-catalog-state">
          <strong>{locale === "en" ? "No apartments match these filters" : "По этим фильтрам квартир нет"}</strong>
          <button className="button button-ghost" type="button" onClick={resetFilters}>{locale === "en" ? "Reset" : "Сбросить"}</button>
        </div>
      )}

      {hasMore ? <div className="catalog-load-more"><button className="button button-ghost" type="button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>{loadMoreLabel(locale)}</button></div> : null}
    </div>
  );
}