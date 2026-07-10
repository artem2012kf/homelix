import type { Locale } from "@/lib/i18n";
import { getIntlLocale } from "@/lib/i18n";

export function formatPrice(value: number, locale: Locale = "ru") {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatArea(value: number, locale: Locale = "ru") {
  const unit = locale === "zh" ? "㎡" : "m²";
  return `${value.toLocaleString(getIntlLocale(locale))} ${unit}`;
}

export function statusLabel(status: string, locale: Locale = "ru") {
  const labels = {
    ru: { available: "Свободна", reserved: "Бронь", sold: "Продана" },
    en: { available: "Available", reserved: "Reserved", sold: "Sold" },
    zh: { available: "可售", reserved: "已预订", sold: "已售" }
  } as const;

  if (status === "available" || status === "reserved" || status === "sold") {
    return labels[locale][status];
  }

  return status;
}
