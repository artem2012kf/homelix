"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type CurrencyContextValue = {
  isEnglish: boolean;
  rubPerUsd: number;
  source: "live" | "fallback";
  updatedAt: string | null;
  format: (rubles: number) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  const [rubPerUsd, setRubPerUsd] = useState(90);
  const [source, setSource] = useState<"live" | "fallback">("fallback");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!isEnglish) return;
    let cancelled = false;
    fetch("/api/exchange-rate", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        const rate = Number(data?.rubPerUsd);
        if (Number.isFinite(rate) && rate > 0) setRubPerUsd(rate);
        setSource(data?.source === "live" ? "live" : "fallback");
        setUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [isEnglish]);

  const value = useMemo<CurrencyContextValue>(() => ({
    isEnglish,
    rubPerUsd,
    source,
    updatedAt,
    format: (rubles) => isEnglish
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(rubles / rubPerUsd)
      : new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(rubles)
  }), [isEnglish, rubPerUsd, source, updatedAt]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
}

export function CurrencyPrice({ value, className }: { value: number; className?: string }) {
  const { format } = useCurrency();
  return <span className={className}>{format(value)}</span>;
}