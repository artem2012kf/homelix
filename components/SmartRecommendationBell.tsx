"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment } from "@/types/apartment";
import { formatArea, formatPrice, statusLabel } from "@/lib/format";

type InterestProfile = {
  acceptedCookies: boolean;
  viewedApartmentIds: string[];
  favoriteApartmentIds: string[];
  reservedApartmentIds: string[];
  lastSort?: string;
  seenSignature?: string;
};

type TrackInterestDetail = {
  type?: "view" | "favorite" | "reserve" | "sort";
  apartmentId?: string;
  sort?: string;
};

type Recommendation = {
  apartment: Apartment;
  match: number;
  tag: string;
  reason: string;
};

const PROFILE_KEY = "homelix-smart-recommendations-v3";
const CONSENT_COOKIE = "homelix_recommendations_consent";
const MAX_VIEWED = 16;

const emptyProfile: InterestProfile = {
  acceptedCookies: false,
  viewedApartmentIds: [],
  favoriteApartmentIds: [],
  reservedApartmentIds: []
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${name}=`))
      ?.split("=")
      .slice(1)
      .join("=") ?? ""
  );
}

function writeConsentCookie() {
  document.cookie = `${CONSENT_COOKIE}=yes; path=/; max-age=${180 * 24 * 60 * 60}; SameSite=Lax`;
}

function uniqueLatest(items: string[]) {
  return [...new Set(items.filter(Boolean))].slice(-MAX_VIEWED);
}

function loadProfile(): InterestProfile {
  if (typeof window === "undefined" || readCookie(CONSENT_COOKIE) !== "yes") return emptyProfile;

  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROFILE_KEY) ?? "{}") as Partial<InterestProfile>;
    return {
      acceptedCookies: true,
      viewedApartmentIds: Array.isArray(parsed.viewedApartmentIds) ? parsed.viewedApartmentIds : [],
      favoriteApartmentIds: Array.isArray(parsed.favoriteApartmentIds) ? parsed.favoriteApartmentIds : [],
      reservedApartmentIds: Array.isArray(parsed.reservedApartmentIds) ? parsed.reservedApartmentIds : [],
      lastSort: parsed.lastSort,
      seenSignature: parsed.seenSignature
    };
  } catch {
    return { ...emptyProfile, acceptedCookies: true };
  }
}

function saveProfile(profile: InterestProfile) {
  if (typeof window === "undefined" || !profile.acceptedCookies) return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function apartmentIdFromPath(pathname: string) {
  return pathname.match(/^\/apartment\/([^/]+)/)?.[1];
}

function roomLabel(count: number) {
  if (count <= 1) return count === 0 ? "студия" : "1-комнатная";
  return `${count}-комнатная`;
}

function buildRecommendations(
  apartments: Apartment[],
  profile: InterestProfile,
  favorites: string[],
  reservations: string[],
  getApartmentStatus: (id: string, base: Apartment["status"]) => Apartment["status"]
): Recommendation[] {
  const unavailable = new Set([...reservations, ...profile.reservedApartmentIds]);
  const available = apartments.filter(
    (apartment) => getApartmentStatus(apartment.id, apartment.status) === "available" && !unavailable.has(apartment.id)
  );
  const signalIds = uniqueLatest([...profile.viewedApartmentIds, ...profile.favoriteApartmentIds, ...favorites]);
  const signals = signalIds.map((id) => apartments.find((item) => item.id === id)).filter((item): item is Apartment => Boolean(item));

  if (!signals.length) {
    return [...available]
      .sort((a, b) => a.price - b.price)
      .slice(0, 3)
      .map((apartment, index) => ({
        apartment,
        match: 82 - index * 3,
        tag: index === 0 ? "Доступный вариант" : "Для сравнения",
        reason: index === 0 ? "Одна из самых доступных свободных квартир каталога." : "Свободный вариант для первого сравнения."
      }));
  }

  const avgPrice = signals.reduce((sum, item) => sum + item.price, 0) / signals.length;
  const avgArea = signals.reduce((sum, item) => sum + item.totalArea, 0) / signals.length;
  const avgRooms = Math.round(signals.reduce((sum, item) => sum + item.roomsCount, 0) / signals.length);

  return available
    .map((apartment) => {
      const priceDelta = Math.abs(apartment.price - avgPrice) / Math.max(avgPrice, 1);
      const areaDelta = Math.abs(apartment.totalArea - avgArea) / Math.max(avgArea, 1);
      const roomDelta = Math.abs(apartment.roomsCount - avgRooms);
      let match = 96 - priceDelta * 28 - areaDelta * 24 - roomDelta * 8;
      if (favorites.includes(apartment.id) || profile.favoriteApartmentIds.includes(apartment.id)) match += 5;
      if (profile.lastSort === "price-asc" && apartment.price <= avgPrice) match += 3;
      if (profile.lastSort === "area-desc" && apartment.totalArea >= avgArea) match += 3;
      match = Math.max(65, Math.min(98, Math.round(match)));

      return {
        apartment,
        match,
        tag: apartment.roomsCount === avgRooms ? "Похожий формат" : apartment.price <= avgPrice ? "В бюджете" : "Подходит вам",
        reason:
          apartment.roomsCount === avgRooms
            ? "Совпадает с просмотренными вариантами по комнатности."
            : apartment.price <= avgPrice
              ? "Цена не выше средней по вашим сохранённым и просмотренным вариантам."
              : "Близка к вашим интересам по площади и формату."
      };
    })
    .sort((a, b) => b.match - a.match || a.apartment.price - b.apartment.price)
    .slice(0, 3);
}

export function SmartRecommendationBell({ apartments }: { apartments: Apartment[] }) {
  const pathname = usePathname();
  const { favorites, reservations, getApartmentStatus } = useAuth();
  const [profile, setProfile] = useState<InterestProfile>(emptyProfile);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !profile.acceptedCookies) return;
    const apartmentId = apartmentIdFromPath(pathname);

    setProfile((current) => {
      const next = {
        ...current,
        viewedApartmentIds: apartmentId ? uniqueLatest([...current.viewedApartmentIds, apartmentId]) : current.viewedApartmentIds,
        favoriteApartmentIds: favorites,
        reservedApartmentIds: reservations
      };
      saveProfile(next);
      return next;
    });
  }, [favorites, isReady, pathname, profile.acceptedCookies, reservations]);

  useEffect(() => {
    if (!isReady || !profile.acceptedCookies) return;

    function handleTrack(event: Event) {
      const detail = (event as CustomEvent<TrackInterestDetail>).detail ?? {};
      setProfile((current) => {
        const next = {
          ...current,
          lastSort: detail.sort ?? current.lastSort,
          viewedApartmentIds:
            detail.type === "view" && detail.apartmentId
              ? uniqueLatest([...current.viewedApartmentIds, detail.apartmentId])
              : current.viewedApartmentIds,
          favoriteApartmentIds:
            detail.type === "favorite" && detail.apartmentId
              ? uniqueLatest([...current.favoriteApartmentIds, detail.apartmentId])
              : current.favoriteApartmentIds,
          reservedApartmentIds:
            detail.type === "reserve" && detail.apartmentId
              ? uniqueLatest([...current.reservedApartmentIds, detail.apartmentId])
              : current.reservedApartmentIds
        };
        saveProfile(next);
        return next;
      });
    }

    window.addEventListener("sq-track-interest", handleTrack);
    return () => window.removeEventListener("sq-track-interest", handleTrack);
  }, [isReady, profile.acceptedCookies]);

  const recommendations = useMemo(
    () => buildRecommendations(apartments, profile, favorites, reservations, getApartmentStatus),
    [apartments, favorites, getApartmentStatus, profile, reservations]
  );
  const signature = recommendations.map((item) => `${item.apartment.id}:${item.match}`).join("|");
  const hasUnread = Boolean(signature) && profile.seenSignature !== signature;

  function acceptRecommendations() {
    writeConsentCookie();
    const next = { ...emptyProfile, acceptedCookies: true };
    saveProfile(next);
    setProfile(next);
    setIsOpen(true);
  }

  function togglePanel() {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen && profile.acceptedCookies) {
      setProfile((current) => {
        const next = { ...current, seenSignature: signature };
        saveProfile(next);
        return next;
      });
    }
  }

  if (!isReady) return null;

  return (
    <div className="smart-reco-shell" aria-live="polite">
      {isOpen ? (
        <aside className="smart-reco-panel">
          <div className="smart-reco-panel-head">
            <span className="eyebrow">Умные рекомендации</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть рекомендации">
              ×
            </button>
          </div>

          {!profile.acceptedCookies ? (
            <div className="smart-reco-cookie-card">
              <h3>Включить персональный подбор?</h3>
              <p>Только после согласия мы сохраним просмотры, избранное и сортировку в localStorage этого браузера.</p>
              <button type="button" className="button button-primary" onClick={acceptRecommendations}>
                Разрешить рекомендации
              </button>
            </div>
          ) : (
            <>
              <h3>Подборка под ваши интересы</h3>
              <p className="smart-reco-profile">Данные хранятся только в этом браузере и не передаются рекламодателям.</p>
              <div className="smart-reco-list">
                {recommendations.map(({ apartment, reason, tag, match }) => (
                  <Link href={`/apartment/${apartment.id}`} key={apartment.id} className="smart-reco-item">
                    <div className="smart-reco-item-top">
                      <span>{tag}</span>
                      <b>{match}% совпадение</b>
                    </div>
                    <strong>{apartment.city}, {apartment.title}</strong>
                    <small>
                      {formatArea(apartment.totalArea)}, {roomLabel(apartment.roomsCount)}, {apartment.floor} этаж · {statusLabel(getApartmentStatus(apartment.id, apartment.status))}
                    </small>
                    <em>{formatPrice(apartment.price)}</em>
                    <p>{reason}</p>
                  </Link>
                ))}
              </div>
              <Link href="/ai" className="smart-reco-ai-link">
                Написать ИИ-консультанту
              </Link>
            </>
          )}
        </aside>
      ) : null}

      {!profile.acceptedCookies ? (
        <div className="smart-reco-consent">
          <strong>Персональные рекомендации</strong>
          <span>Отслеживание начнётся только после вашего согласия.</span>
          <button type="button" onClick={acceptRecommendations}>ОК</button>
        </div>
      ) : null}

      {profile.acceptedCookies && recommendations.length ? (
        <button
          type="button"
          className={`smart-reco-button ${hasUnread ? "has-unread" : ""}`}
          onClick={togglePanel}
          aria-label="Открыть персональные рекомендации"
        >
          <span aria-hidden="true">🔔</span>
          {hasUnread ? <i aria-hidden="true" /> : null}
        </button>
      ) : null}
    </div>
  );
}
