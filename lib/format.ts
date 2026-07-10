import type { Locale } from "@/lib/i18n";
import { getIntlLocale } from "@/lib/i18n";

const FALLBACK_RUB_PER_USD = 90;

export function formatPrice(value: number, locale: Locale = "ru") {
  if (locale === "en") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(value / FALLBACK_RUB_PER_USD);
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(value: number, locale: Locale = "ru") {
  return `${value.toLocaleString(getIntlLocale(locale))} m²`;
}

export function statusLabel(status: string, locale: Locale = "ru") {
  const labels = {
    ru: { available: "Свободна", reserved: "Бронь", sold: "Продана" },
    en: { available: "Available", reserved: "Reserved", sold: "Sold" }
  } as const;

  if (status === "available" || status === "reserved" || status === "sold") return labels[locale][status];
  return status;
}