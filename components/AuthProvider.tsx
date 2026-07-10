"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ApartmentStatus } from "@/types/apartment";

type PublicUser = {
  id: string;
  email: string;
  createdAt: string;
};

type AuthContextValue = {
  user: PublicUser | null;
  isReady: boolean;
  favorites: string[];
  reservations: string[];
  reservedApartmentIds: string[];
  register: (email: string, password: string, website?: string) => Promise<{ ok: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshStatuses: () => Promise<void>;
  getApartmentStatus: (apartmentId: string, baseStatus: ApartmentStatus) => ApartmentStatus;
  isFavorite: (apartmentId: string) => boolean;
  toggleFavorite: (apartmentId: string) => Promise<{ ok: boolean; error?: string }>;
  isReservedByUser: (apartmentId: string) => boolean;
  reserveApartment: (apartmentId: string, baseStatus?: ApartmentStatus) => Promise<{ ok: boolean; error?: string }>;
  cancelReservation: (apartmentId: string) => Promise<{ ok: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function requestJson<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = new URL(endpoint, window.location.origin);
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store"
  });

  const text = await response.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: "Сервер вернул некорректный ответ." };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? String((data as { error?: string }).error)
        : "Не удалось выполнить запрос.";
    throw new Error(message);
  }

  return data as T;
}

type SessionResponse = {
  user: PublicUser | null;
  favorites: string[];
  reservations: string[];
  reservedApartmentIds?: string[];
};

type StatusResponse = {
  reservedApartmentIds: string[];
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<PublicUser | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reservations, setReservations] = useState<string[]>([]);
  const [reservedApartmentIds, setReservedApartmentIds] = useState<string[]>([]);

  const refreshStatuses = useCallback(async () => {
    try {
      const data = await requestJson<StatusResponse>("/api/apartment-statuses");
      setReservedApartmentIds(data.reservedApartmentIds ?? []);
    } catch {
      // Сохраняем последний успешно загруженный статус.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const data = await requestJson<SessionResponse>("/api/auth/me");
        if (cancelled) return;
        setUser(data.user ?? null);
        setFavorites(data.favorites ?? []);
        setReservations(data.reservations ?? []);
        setReservedApartmentIds(data.reservedApartmentIds ?? []);
      } catch {
        if (cancelled) return;
        setUser(null);
        setFavorites([]);
        setReservations([]);
        await refreshStatuses();
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [refreshStatuses]);

  useEffect(() => {
    if (!isReady) return;
    const interval = window.setInterval(() => void refreshStatuses(), 15000);
    return () => window.clearInterval(interval);
  }, [isReady, refreshStatuses]);

  const register = useCallback(
    async (email: string, password: string, website = "") => {
      try {
        const data = await requestJson<SessionResponse>("/api/auth/register", {
          method: "POST",
          body: JSON.stringify({ email, password, website })
        });

        setUser(data.user);
        setFavorites(data.favorites ?? []);
        setReservations(data.reservations ?? []);
        await refreshStatuses();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Не удалось зарегистрироваться." };
      }
    },
    [refreshStatuses]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const data = await requestJson<SessionResponse>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        setUser(data.user);
        setFavorites(data.favorites ?? []);
        setReservations(data.reservations ?? []);
        await refreshStatuses();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Не удалось войти." };
      }
    },
    [refreshStatuses]
  );

  const logout = useCallback(async () => {
    try {
      await requestJson<{ ok: boolean }>("/api/auth/logout", { method: "POST" });
    } catch {
      // Локальное состояние очищается даже при временной сетевой ошибке.
    } finally {
      setUser(null);
      setFavorites([]);
      setReservations([]);
      await refreshStatuses();
    }
  }, [refreshStatuses]);

  const toggleFavorite = useCallback(
    async (apartmentId: string) => {
      if (!user) return { ok: false, error: "Для добавления в избранное необходимо войти." };
      try {
        const data = await requestJson<{ favorites: string[] }>("/api/user/favorites", {
          method: "POST",
          body: JSON.stringify({ apartmentId })
        });
        setFavorites(data.favorites ?? []);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Не удалось обновить избранное." };
      }
    },
    [user]
  );

  const reserveApartment = useCallback(
    async (apartmentId: string, baseStatus: ApartmentStatus = "available") => {
      if (!user) return { ok: false, error: "Для бронирования необходимо войти." };
      if (baseStatus === "sold") return { ok: false, error: "Эта квартира уже продана." };

      try {
        const data = await requestJson<{ reservations: string[]; reservedApartmentIds: string[] }>(
          "/api/user/reservations",
          { method: "POST", body: JSON.stringify({ apartmentId, action: "reserve" }) }
        );
        setReservations(data.reservations ?? []);
        setReservedApartmentIds(data.reservedApartmentIds ?? []);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Не удалось забронировать квартиру." };
      }
    },
    [user]
  );

  const cancelReservation = useCallback(
    async (apartmentId: string) => {
      if (!user) return { ok: false, error: "Для отмены брони необходимо войти." };
      try {
        const data = await requestJson<{ reservations: string[]; reservedApartmentIds: string[] }>(
          "/api/user/reservations",
          { method: "POST", body: JSON.stringify({ apartmentId, action: "cancel" }) }
        );
        setReservations(data.reservations ?? []);
        setReservedApartmentIds(data.reservedApartmentIds ?? []);
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Не удалось отменить бронь." };
      }
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      favorites,
      reservations,
      reservedApartmentIds,
      register,
      login,
      logout,
      refreshStatuses,
      getApartmentStatus: (apartmentId, baseStatus) => {
        if (baseStatus === "sold") return "sold";
        if (baseStatus === "reserved") return "reserved";
        return reservedApartmentIds.includes(apartmentId) ? "reserved" : "available";
      },
      isFavorite: (apartmentId) => favorites.includes(apartmentId),
      toggleFavorite,
      isReservedByUser: (apartmentId) => reservations.includes(apartmentId),
      reserveApartment,
      cancelReservation
    }),
    [
      cancelReservation,
      favorites,
      isReady,
      login,
      logout,
      refreshStatuses,
      register,
      reservations,
      reservedApartmentIds,
      reserveApartment,
      toggleFavorite,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
