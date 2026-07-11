"use client";

import { useEffect, useMemo, useState } from "react";
import type { Apartment } from "@/types/apartment";
import type { FurniturePlacement } from "@/types/furniture-placement";
import { ApartmentCardActions } from "@/components/ApartmentCardActions";
import { CurrencyPrice } from "@/components/CurrencyProvider";
import type { Locale } from "@/lib/i18n";

type FurniturePriceEvent = {
  apartmentId: string;
  furnitureTotal: number;
  totalWithFurniture: number;
};

function getDeviceId() {
  if (typeof window === "undefined") return "server";

  const key = "sq-device-id";
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;

  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, next);
  return next;
}

function readFurnitureTotal(apartmentId: string) {
  if (typeof window === "undefined") return 0;

  try {
    const key = `sq-furniture-plan-${getDeviceId()}-${apartmentId}`;
    const raw = window.localStorage.getItem(key);
    const saved = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(saved)) return 0;

    return saved.reduce((sum: number, placement: Partial<FurniturePlacement>) => {
      const price = typeof placement.price === "number" ? placement.price : 0;
      return sum + price;
    }, 0);
  } catch {
    return 0;
  }
}

export function ApartmentPriceBox({ apartment, locale = "ru" }: { apartment: Apartment; locale?: Locale }) {
  const [furnitureTotal, setFurnitureTotal] = useState(0);
  const isEnglish = locale === "en";

  useEffect(() => {
    setFurnitureTotal(readFurnitureTotal(apartment.id));

    function onFurniturePriceUpdated(event: Event) {
      const detail = (event as CustomEvent<FurniturePriceEvent>).detail;
      if (!detail || detail.apartmentId !== apartment.id) return;
      setFurnitureTotal(detail.furnitureTotal);
    }

    window.addEventListener("sq-furniture-price-updated", onFurniturePriceUpdated);
    return () => window.removeEventListener("sq-furniture-price-updated", onFurniturePriceUpdated);
  }, [apartment.id]);

  const totalWithFurniture = useMemo(() => apartment.price + furnitureTotal, [apartment.price, furnitureTotal]);

  return (
    <div className="price-box">
      <span>{furnitureTotal > 0 ? (isEnglish ? "Price with furniture" : "Стоимость с мебелью") : (isEnglish ? "Price" : "Стоимость")}</span>
      <strong><CurrencyPrice value={totalWithFurniture} /></strong>

      {furnitureTotal > 0 ? (
        <small>
          {isEnglish ? "apartment" : "квартира"} <CurrencyPrice value={apartment.price} /> + {isEnglish ? "furniture" : "мебель"} <CurrencyPrice value={furnitureTotal} />
        </small>
      ) : (
        <small>{isEnglish ? "from" : "от"} <CurrencyPrice value={apartment.mortgagePayment} /> / {isEnglish ? "month" : "мес."}</small>
      )}

      <ApartmentCardActions apartment={apartment} showPlanLink={false} locale={locale} />
    </div>
  );
}
