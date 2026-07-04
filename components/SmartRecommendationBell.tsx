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
  lastApartmentId?: string;
  lastPath?: string;
  lastSort?: string;
  seenRecommendationSignature?: string;
  updatedAt: number;
};

type TrackInterestDetail = {
  type?: "view" | "favorite" | "reserve" | "sort";
  apartmentId?: string;
  sort?: string;
};

const PROFILE_KEY = "sq-smart-recommendations-v1";
const COOKIE_CONSENT = "sq_cookie_recommendations";
const COOKIE_LAST_APARTMENT = "sq_last_apartment";
const COOKIE_INTEREST = "sq_interest_hint";
const MAX_VIEWED = 12;

const defaultProfile: InterestProfile = {
  acceptedCookies: false,
  viewedApartmentIds: [],
  favoriteApartmentIds: [],
  reservedApartmentIds: [],
  updatedAt: Date.now()
};

function readCookie(name: string) {
  if (typeof document === "undefined") return "";

  return document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
    ?.split("=")
    .slice(1)
    .join("=") ?? "";
}

function writeCookie(name: string, value: string, maxAgeDays = 180) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 24 * 60 * 60}; SameSite=Lax`;
}

function uniqueLatest(items: string[]) {
  const result: string[] = [];

  for (const item of items.reverse()) {
    if (item && !result.includes(item)) {
      result.push(item);
    }
  }

  return result.reverse().slice(-MAX_VIEWED);
}

function loadProfile(): InterestProfile {
  if (typeof window === "undefined") return defaultProfile;

  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<InterestProfile>) : {};
    const consent = readCookie(COOKIE_CONSENT) === "yes" || Boolean(parsed.acceptedCookies);

    return {
      ...defaultProfile,
      ...parsed,
      acceptedCookies: consent,
      viewedApartmentIds: Array.isArray(parsed.viewedApartmentIds) ? parsed.viewedApartmentIds : [],
      favoriteApartmentIds: Array.isArray(parsed.favoriteApartmentIds) ? parsed.favoriteApartmentIds : [],
      reservedApartmentIds: Array.isArray(parsed.reservedApartmentIds) ? parsed.reservedApartmentIds : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : Date.now()
    };
  } catch {
    return defaultProfile;
  }
}

function saveProfile(profile: InterestProfile) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

  if (profile.acceptedCookies) {
    writeCookie(COOKIE_CONSENT, "yes");
    if (profile.lastApartmentId) writeCookie(COOKIE_LAST_APARTMENT, profile.lastApartmentId);
    writeCookie(
      COOKIE_INTEREST,
      [profile.lastApartmentId ? `apt:${profile.lastApartmentId}` : "", profile.lastSort ? `sort:${profile.lastSort}` : ""]
        .filter(Boolean)
        .join("|")
    );
  }
}

function apartmentIdFromPath(pathname: string) {
  const match = pathname.match(/^\/apartment\/([^/]+)/);
  return match?.[1];
}

function roomLabel(count: number) {
  if (count === 0) return "студия";
  if (count === 1) return "1 комната";
  if (count >= 2 && count <= 4) return `${count} комнаты`;
  return `${count} комнат`;
}

function buildReason(apartment: Apartment, seed?: Apartment) {
  if (!seed) {
    return "Подходит как стартовый вариант для знакомства с каталогом.";
  }

  if (apartment.roomsCount === seed.roomsCount && apartment.price <= seed.price) {
    return "Похожа на ваш просмотренный вариант, но цена не выше.";
  }

  if (apartment.totalArea > seed.totalArea) {
    return "Больше площадь, чем у последнего просмотренного варианта.";
  }

  if (apartment.mortgagePayment < seed.mortgagePayment) {
    return "Ниже ориентировочный ипотечный платеж.";
  }

  return "Близка к вашим последним просмотрам по площади, комнатности и бюджету.";
}

function buildRecommendations({
  apartments,
  profile,
  favorites,
  reservations,
  getApartmentStatus
}: {
  apartments: Apartment[];
  profile: InterestProfile;
  favorites: string[];
  reservations: string[];
  getApartmentStatus: (apartmentId: string, baseStatus: Apartment["status"]) => Apartment["status"];
}) {
  const favoriteIds = favorites.length ? favorites : profile.favoriteApartmentIds;
  const reservedIds = reservations.length ? reservations : profile.reservedApartmentIds;
  const viewedIds = profile.viewedApartmentIds;
  const sourceIds = [...favoriteIds, ...viewedIds].filter(Boolean);

  const seeds = sourceIds
    .map((id) => apartments.find((apartment) => apartment.id === id))
    .filter((apartment): apartment is Apartment => Boolean(apartment));

  const mainSeed = seeds.at(-1);
  const averagePrice =
    seeds.length > 0 ? seeds.reduce((sum, apartment) => sum + apartment.price, 0) / seeds.length : undefined;
  const averageRooms =
    seeds.length > 0 ? seeds.reduce((sum, apartment) => sum + apartment.roomsCount, 0) / seeds.length : undefined;

  const ignored = new Set([...viewedIds, ...favoriteIds, ...reservedIds]);

  const available = apartments.filter((apartment) => getApartmentStatus(apartment.id, apartment.status) === "available");
  const baseList = available.filter((apartment) => !ignored.has(apartment.id));

  const scored = baseList.map((apartment) => {
    const priceScore = averagePrice ? Math.abs(apartment.price - averagePrice) / 100_000 : apartment.price / 100_000;
    const roomsScore = averageRooms !== undefined ? Math.abs(apartment.roomsCount - averageRooms) * 10 : 0;
    const seedScore = mainSeed ? Math.abs(apartment.totalArea - mainSeed.totalArea) * 1.3 : 0;
    const mortgageScore = apartment.mortgagePayment / 20_000;

    return {
      apartment,
      score: priceScore + roomsScore + seedScore + mortgageScore,
      reason: buildReason(apartment, mainSeed)
    };
  });

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((item) => item);
}

function signatureFor(recommendations: { apartment: Apartment }[]) {
  return recommendations.map((item) => item.apartment.id).join("|");
}

export function SmartRecommendationBell({ apartments }: { apartments: Apartment[] }) {
  const pathname = usePathname();
  const { favorites, reservations, getApartmentStatus } = useAuth();
  const [profile, setProfile] = useState<InterestProfile>(defaultProfile);
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loaded = loadProfile();
    setProfile(loaded);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady || !profile.acceptedCookies) return;

    const apartmentId = apartmentIdFromPath(pathname);

    setProfile((current) => {
      const next: InterestProfile = {
        ...current,
        lastPath: pathname,
        lastApartmentId: apartmentId ?? current.lastApartmentId,
        viewedApartmentIds: apartmentId ? uniqueLatest([...current.viewedApartmentIds, apartmentId]) : current.viewedApartmentIds,
        favoriteApartmentIds: favorites,
        reservedApartmentIds: reservations,
        updatedAt: Date.now()
      };

      saveProfile(next);
      return next;
    });
  }, [favorites, isReady, pathname, profile.acceptedCookies, reservations]);

  useEffect(() => {
    if (!isReady) return;

    function handleTrack(event: Event) {
      const detail = (event as CustomEvent<TrackInterestDetail>).detail ?? {};

      setProfile((current) => {
        if (!current.acceptedCookies) return current;

        const next: InterestProfile = {
          ...current,
          lastApartmentId: detail.apartmentId ?? current.lastApartmentId,
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
              : current.reservedApartmentIds,
          updatedAt: Date.now()
        };

        saveProfile(next);
        return next;
      });
    }

    window.addEventListener("sq-track-interest", handleTrack);
    return () => window.removeEventListener("sq-track-interest", handleTrack);
  }, [isReady]);

  const recommendations = useMemo(
    () =>
      buildRecommendations({
        apartments,
        profile,
        favorites,
        reservations,
        getApartmentStatus
      }),
    [apartments, favorites, getApartmentStatus, profile, reservations]
  );

  const recommendationSignature = signatureFor(recommendations);
  const hasUnread = profile.acceptedCookies && Boolean(recommendationSignature) && profile.seenRecommendationSignature !== recommendationSignature;

  function acceptCookies() {
    const next: InterestProfile = {
      ...profile,
      acceptedCookies: true,
      updatedAt: Date.now()
    };

    saveProfile(next);
    setProfile(next);
    setIsOpen(true);
  }

  function openPanel() {
    setIsOpen((current) => !current);

    if (!isOpen && profile.acceptedCookies) {
      const next = {
        ...profile,
        seenRecommendationSignature: recommendationSignature,
        updatedAt: Date.now()
      };

      saveProfile(next);
      setProfile(next);
    }
  }

  if (!isReady) return null;

  return (
    <div className="smart-reco-shell" aria-live="polite">
      {isOpen ? (
        <aside className="smart-reco-panel">
          <div className="smart-reco-panel-head">
            <span className="eyebrow">Персональные подсказки</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть рекомендации">
              ×
            </button>
          </div>

          {!profile.acceptedCookies ? (
            <div className="smart-reco-cookie-card">
              <h3>Включить рекомендации?</h3>
              <p>
                Сайт будет сохранять first-party cookies и историю просмотров только в этом браузере, чтобы показывать более
                подходящие квартиры.
              </p>
              <button type="button" className="button button-primary" onClick={acceptCookies}>
                Разрешить рекомендации
              </button>
            </div>
          ) : (
            <>
              <h3>ИИ нашел варианты, которые могут подойти</h3>
              <p>
                Рекомендации строятся по вашим просмотрам, избранному, бронированиям и выбранной сортировке.
              </p>

              <div className="smart-reco-list">
                {recommendations.map(({ apartment, reason }) => (
                  <Link href={`/apartment/${apartment.id}`} key={apartment.id} className="smart-reco-item">
                    <span>{statusLabel(getApartmentStatus(apartment.id, apartment.status))}</span>
                    <strong>{apartment.title}</strong>
                    <small>
                      {formatArea(apartment.totalArea)}, {roomLabel(apartment.roomsCount)}, {apartment.floor} этаж
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
          <strong>Cookies для рекомендаций</strong>
          <span>Сохраним просмотры в браузере и подскажем похожие квартиры.</span>
          <button type="button" onClick={acceptCookies}>
            ОК
          </button>
        </div>
      ) : null}

      <button
        type="button"
        className={`smart-reco-button ${hasUnread ? "has-unread" : ""}`}
        onClick={openPanel}
        aria-label="Открыть персональные рекомендации"
      >
        <span aria-hidden="true">🔔</span>
        {hasUnread ? <i aria-hidden="true" /> : null}
      </button>
    </div>
  );
}
