"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { FurnitureItem } from "@/types/furniture";
import { useCity } from "@/components/CityProvider";
import { useAuth } from "@/components/AuthProvider";
import { furnitureItems } from "@/lib/furniture";
import { getLocaleFromPathname } from "@/lib/i18n";

type CartLine = { item: FurnitureItem; quantity: number };
type StoredLine = { itemId: string; quantity: number };
type AccountCartResponse = {
  lines?: StoredLine[];
  selectedApartmentId?: string;
  updatedAt?: string;
  error?: string;
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  deliveryWindow: string;
  selectedApartmentId: string;
  isOpen: boolean;
  storageMode: "account" | "browser";
  isSyncing: boolean;
  addItem: (item: FurnitureItem) => void;
  removeItem: (itemId: string) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
  setSelectedApartmentId: (value: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "hall-furniture-cart";
const APARTMENT_KEY = "hall-delivery-apartment";
const itemById = new Map(furnitureItems.map((item) => [item.id, item]));

function cleanQuantity(value: unknown) {
  const quantity = Number(value);
  if (!Number.isFinite(quantity)) return 0;
  return Math.min(20, Math.max(0, Math.round(quantity)));
}

function normalizeCartLines(value: unknown): CartLine[] {
  if (!Array.isArray(value)) return [];
  const quantities = new Map<string, number>();

  for (const rawLine of value) {
    if (!rawLine || typeof rawLine !== "object") continue;
    const object = rawLine as { item?: { id?: unknown }; itemId?: unknown; quantity?: unknown };
    const itemId = typeof object.itemId === "string" ? object.itemId : String(object.item?.id ?? "");
    if (!itemById.has(itemId)) continue;
    const quantity = cleanQuantity(object.quantity);
    if (!quantity) continue;
    quantities.set(itemId, Math.min(20, (quantities.get(itemId) ?? 0) + quantity));
  }

  return Array.from(quantities, ([itemId, quantity]) => ({ item: itemById.get(itemId)!, quantity }));
}

function mergeCartLines(accountLines: CartLine[], browserLines: CartLine[]) {
  return normalizeCartLines([
    ...accountLines.map((line) => ({ itemId: line.item.id, quantity: line.quantity })),
    ...browserLines.map((line) => ({ itemId: line.item.id, quantity: line.quantity }))
  ]);
}

function serializeLines(lines: CartLine[]): StoredLine[] {
  return lines.map((line) => ({ itemId: line.item.id, quantity: line.quantity }));
}

function readBrowserCart() {
  try {
    return {
      lines: normalizeCartLines(JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]")),
      selectedApartmentId: window.localStorage.getItem(APARTMENT_KEY) ?? ""
    };
  } catch {
    return { lines: [] as CartLine[], selectedApartmentId: "" };
  }
}

function deliveryForCity(city: string) {
  if (city === "Москва" || city === "Санкт-Петербург") return 1990;
  if (["Владивосток", "Калининград", "Красноярск"].includes(city)) return 6990;
  return 3990;
}

function maxDeliveryDays(lines: CartLine[]) {
  let max = 0;
  for (const line of lines) {
    const values = line.item.delivery.match(/\d+/g)?.map(Number) ?? [];
    max = Math.max(max, ...values, 0);
  }
  return max || 7;
}

async function putAccountCart(lines: CartLine[], selectedApartmentId: string) {
  const response = await fetch("/api/user/cart", {
    method: "PUT",
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lines: serializeLines(lines), selectedApartmentId })
  });
  const data = (await response.json().catch(() => ({}))) as AccountCartResponse;
  if (!response.ok) throw new Error(data.error || "Не удалось сохранить корзину аккаунта.");
  return data;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const { selectedCity } = useCity();
  const { user, isReady: authReady } = useAuth();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [selectedApartmentId, setSelectedApartmentIdState] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [browserLoaded, setBrowserLoaded] = useState(false);
  const [readyScope, setReadyScope] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const saveSequence = useRef(0);

  useEffect(() => {
    const browserCart = readBrowserCart();
    setLines(browserCart.lines);
    setSelectedApartmentIdState(browserCart.selectedApartmentId);
    setBrowserLoaded(true);
  }, []);

  useEffect(() => {
    if (!browserLoaded || !authReady) return;
    const scope = user?.id ?? "guest";
    let cancelled = false;
    setReadyScope("");

    if (!user) {
      const browserCart = readBrowserCart();
      setLines(browserCart.lines);
      setSelectedApartmentIdState(browserCart.selectedApartmentId);
      setIsSyncing(false);
      setReadyScope(scope);
      return;
    }

    setIsSyncing(true);
    void (async () => {
      try {
        const response = await fetch("/api/user/cart", { credentials: "same-origin", cache: "no-store" });
        const data = (await response.json().catch(() => ({}))) as AccountCartResponse;
        if (!response.ok) throw new Error(data.error || "Не удалось загрузить корзину аккаунта.");

        const browserCart = readBrowserCart();
        const accountLines = normalizeCartLines(data.lines ?? []);
        const mergedLines = mergeCartLines(accountLines, browserCart.lines);
        const mergedApartmentId = data.selectedApartmentId || browserCart.selectedApartmentId;

        if (cancelled) return;
        setLines(mergedLines);
        setSelectedApartmentIdState(mergedApartmentId);

        await putAccountCart(mergedLines, mergedApartmentId);
        if (cancelled) return;
        window.localStorage.removeItem(CART_KEY);
        window.localStorage.removeItem(APARTMENT_KEY);
      } catch (error) {
        console.error("Account cart hydration failed", error instanceof Error ? error.message : "unknown error");
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
          setReadyScope(scope);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authReady, browserLoaded, user?.id]);

  useEffect(() => {
    if (!browserLoaded || !authReady) return;
    const scope = user?.id ?? "guest";
    if (readyScope !== scope) return;

    if (!user) {
      window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
      if (selectedApartmentId) window.localStorage.setItem(APARTMENT_KEY, selectedApartmentId);
      else window.localStorage.removeItem(APARTMENT_KEY);
      return;
    }

    const sequence = ++saveSequence.current;
    setIsSyncing(true);
    const timerId = window.setTimeout(() => {
      void putAccountCart(lines, selectedApartmentId)
        .then(() => {
          if (sequence === saveSequence.current) {
            window.localStorage.removeItem(CART_KEY);
            window.localStorage.removeItem(APARTMENT_KEY);
          }
        })
        .catch((error) => {
          console.error("Account cart save failed", error instanceof Error ? error.message : "unknown error");
        })
        .finally(() => {
          if (sequence === saveSequence.current) setIsSyncing(false);
        });
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [authReady, browserLoaded, lines, readyScope, selectedApartmentId, user]);

  function addItem(item: FurnitureItem) {
    setLines((current) => {
      const existing = current.find((line) => line.item.id === item.id);
      if (existing) {
        return current.map((line) =>
          line.item.id === item.id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line
        );
      }
      return [...current, { item, quantity: 1 }];
    });
    setOpen(true);
  }

  function setQuantity(itemId: string, quantity: number) {
    const next = cleanQuantity(quantity);
    setLines((current) =>
      next === 0
        ? current.filter((line) => line.item.id !== itemId)
        : current.map((line) => (line.item.id === itemId ? { ...line, quantity: next } : line))
    );
  }

  function setSelectedApartmentId(value: string) {
    setSelectedApartmentIdState(value);
  }

  function clear() {
    setLines([]);
    setSelectedApartmentIdState("");
  }

  const subtotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0),
    [lines]
  );
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const deliveryPrice = lines.length ? deliveryForCity(selectedCity) : 0;
  const minimumDays = Math.max(2, maxDeliveryDays(lines) - 2);
  const maximumDays = maxDeliveryDays(lines) + 3;
  const deliveryWindow = locale === "en" ? `${minimumDays}–${maximumDays} days` : `${minimumDays}–${maximumDays} дней`;

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotal,
      deliveryPrice,
      total: subtotal + deliveryPrice,
      deliveryWindow,
      selectedApartmentId,
      isOpen,
      storageMode: user ? "account" : "browser",
      isSyncing,
      addItem,
      removeItem: (itemId) => setLines((current) => current.filter((line) => line.item.id !== itemId)),
      setQuantity,
      clear,
      openCart: () => setOpen(true),
      closeCart: () => setOpen(false),
      setSelectedApartmentId
    }),
    [lines, count, subtotal, deliveryPrice, deliveryWindow, selectedApartmentId, isOpen, user, isSyncing]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
