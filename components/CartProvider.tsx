"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FurnitureItem } from "@/types/furniture";
import { useCity } from "@/components/CityProvider";

type CartLine = { item: FurnitureItem; quantity: number };

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  deliveryPrice: number;
  total: number;
  deliveryWindow: string;
  selectedApartmentId: string;
  isOpen: boolean;
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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { selectedCity } = useCity();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [selectedApartmentId, setSelectedApartmentIdState] = useState("");
  const [isOpen, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(CART_KEY) ?? "[]") as CartLine[];
      setLines(Array.isArray(saved) ? saved.filter((line) => line?.item?.id && line.quantity > 0) : []);
      setSelectedApartmentIdState(window.localStorage.getItem(APARTMENT_KEY) ?? "");
    } catch {
      setLines([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, [lines, loaded]);

  function addItem(item: FurnitureItem) {
    setLines((current) => {
      const existing = current.find((line) => line.item.id === item.id);
      if (existing) return current.map((line) => line.item.id === item.id ? { ...line, quantity: Math.min(20, line.quantity + 1) } : line);
      return [...current, { item, quantity: 1 }];
    });
    setOpen(true);
  }

  function setQuantity(itemId: string, quantity: number) {
    const next = Math.max(0, Math.min(20, Math.round(quantity)));
    setLines((current) => next === 0 ? current.filter((line) => line.item.id !== itemId) : current.map((line) => line.item.id === itemId ? { ...line, quantity: next } : line));
  }

  function setSelectedApartmentId(value: string) {
    setSelectedApartmentIdState(value);
    if (value) window.localStorage.setItem(APARTMENT_KEY, value);
    else window.localStorage.removeItem(APARTMENT_KEY);
  }

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.item.price * line.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const deliveryPrice = lines.length ? deliveryForCity(selectedCity) : 0;
  const deliveryWindow = `${Math.max(2, maxDeliveryDays(lines) - 2)}–${maxDeliveryDays(lines) + 3} дней`;

  const value = useMemo<CartContextValue>(() => ({
    lines,
    count,
    subtotal,
    deliveryPrice,
    total: subtotal + deliveryPrice,
    deliveryWindow,
    selectedApartmentId,
    isOpen,
    addItem,
    removeItem: (itemId) => setLines((current) => current.filter((line) => line.item.id !== itemId)),
    setQuantity,
    clear: () => setLines([]),
    openCart: () => setOpen(true),
    closeCart: () => setOpen(false),
    setSelectedApartmentId
  }), [lines, count, subtotal, deliveryPrice, deliveryWindow, selectedApartmentId, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}