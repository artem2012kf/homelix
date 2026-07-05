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

type Recommendation = {
  apartment: Apartment;
  score: number;
  match: number;
  tag: string;
  reason: string;
  details: string[];
};

type PreferenceStats = {
  hasSignal: boolean;
  avgPrice?: number;
  avgArea?: number;
  avgFloor?: number;
  preferredRooms?: number;
  lastApartment?: Apartment;
  profileLabel: string;
};

const PROFILE_KEY = "sq-smart-recommendations-v2";
const COOKIE_CONSENT = "sq_cookie_recommendations";
const COOKIE_LAST_APARTMENT = "sq_last_apartment";
const COOKIE_INTEREST = "sq_interest_hint";
const MAX_VIEWED = 16;
const MIN_NOTIFICATION_MATCH = 80;

const defaultProfile: InterestProfile = {
  acceptedCookies: false,
  viewedApartmentIds: [],
  favoriteApartmentIds: [],
  reservedApartmentIds: [],
  updatedAt: Date.now()
};

const sortPreferenceLabels: Record<string, string> = {
  "price-asc": "цена ниже",
  "price-desc": "варианты дороже",
  "area-asc": "компактная площадь",
  "area-desc": "больше площадь",
  "floor-asc": "нижние этажи",
  "floor-desc": "верхние этажи",
  "rooms-asc": "меньше комнат",
  "rooms-desc": "больше комнат",
  "mortgage-asc": "ниже ипотечный платеж",
  recommended: "свободные варианты"
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

function writeCookie(name: string, value: string, maxAgeDays = 180) {
  if (typeof document === "undefined") return;

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 24 * 60 * 60}; SameSite=Lax`;
}

function uniqueLatest(items: string[]) {
  const result: string[] = [];

  for (const item of [...items].reverse()) {
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
  if (count === 1) return "1-комнатная";
  if (count >= 2 && count <= 4) return `${count}-комнатная`;
  return `${count}-комнатная`;
}

function roomPreferenceLabel(count?: number) {
  if (count === undefined) return "любая комнатность";
  if (count === 0) return "студии";
  if (count === 1) return "1-комнатные";
  return `${count}-комнатные`;
}

function formatDelta(value: number) {
  return formatPrice(Math.abs(Math.round(value)));
}

function getApartmentById(apartments: Apartment[], id?: string) {
  if (!id) return undefined;
  return apartments.find((apartment) => apartment.id === id);
}

function weightedEvidence(apartments: Apartment[], profile: InterestProfile, favorites: string[], reservations: string[]) {
  const result: { apartment: Apartment; weight: number }[] = [];
  const add = (id: string | undefined, weight: number) => {
    const apartment = getApartmentById(apartments, id);
    if (apartment) result.push({ apartment, weight });
  };

  profile.viewedApartmentIds.forEach((id, index) => add(id, 1 + index / Math.max(profile.viewedApartmentIds.length, 1)));
  [...profile.favoriteApartmentIds, ...favorites].forEach((id) => add(id, 4));
  [...profile.reservedApartmentIds, ...reservations].forEach((id) => add(id, 5));
  add(profile.lastApartmentId, 3);

  return result;
}

function buildPreferenceStats(apartments: Apartment[], profile: InterestProfile, favorites: string[], reservations: string[]): PreferenceStats {
  const evidence = weightedEvidence(apartments, profile, favorites, reservations);

  if (!evidence.length) {
    return {
      hasSignal: false,
      profileLabel: "Пока мало данных: покажем надежные свободные варианты из каталога."
    };
  }

  const totalWeight = evidence.reduce((sum, item) => sum + item.weight, 0);
  const avgPrice = evidence.reduce((sum, item) => sum + item.apartment.price * item.weight, 0) / totalWeight;
  const avgArea = evidence.reduce((sum, item) => sum + item.apartment.totalArea * item.weight, 0) / totalWeight;
  const avgFloor = evidence.reduce((sum, item) => sum + item.apartment.floor * item.weight, 0) / totalWeight;
  const roomWeights = new Map<number, number>();

  evidence.forEach(({ apartment, weight }) => {
    roomWeights.set(apartment.roomsCount, (roomWeights.get(apartment.roomsCount) ?? 0) + weight);
  });

  const preferredRooms = [...roomWeights.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const lastApartment = getApartmentById(apartments, profile.lastApartmentId) ?? evidence[evidence.length - 1]?.apartment;
  const sortLabel = profile.lastSort ? sortPreferenceLabels[profile.lastSort] : undefined;
  const budgetLabel = avgPrice ? `около ${formatPrice(avgPrice)}` : "без бюджета";
  const profileLabel = [roomPreferenceLabel(preferredRooms), budgetLabel, sortLabel].filter(Boolean).join(" · ");

  return {
    hasSignal: true,
    avgPrice,
    avgArea,
    avgFloor,
    preferredRooms,
    lastApartment,
    profileLabel
  };
}

function valueScore(apartment: Apartment) {
  return apartment.price / apartment.totalArea;
}

function buildDefaultRecommendations(apartments: Apartment[]) {
  const available = apartments.filter((apartment) => apartment.status === "available");
  const cheapest = [...available].sort((a, b) => a.price - b.price)[0];
  const bestMeter = [...available].sort((a, b) => valueScore(a) - valueScore(b))[0];
  const family = [...available].filter((item) => item.roomsCount >= 2).sort((a, b) => b.totalArea - a.totalArea || a.price - b.price)[0];
  const compact = [...available].filter((item) => item.roomsCount <= 1).sort((a, b) => a.mortgagePayment - b.mortgagePayment)[0];
  const picked = [cheapest, bestMeter, family, compact].filter((apartment): apartment is Apartment => Boolean(apartment));
  const unique = picked.filter((apartment, index) => picked.findIndex((item) => item.id === apartment.id) === index).slice(0, 3);

  return unique.map((apartment, index): Recommendation => {
    const tags = ["Самый доступный", "Выгоднее за м²", "Для семьи"];
    const reasons = [
      "Хороший стартовый вариант: минимальная цена среди свободных квартир.",
      "Сильный вариант по соотношению цены и площади.",
      "Больше пространства для семьи и хранения."
    ];

    return {
      apartment,
      score: 100 - index,
      match: 82 - index * 3,
      tag: tags[index] ?? "Свободный вариант",
      reason: reasons[index] ?? "Подходит для первого сравнения с другими квартирами.",
      details: [`${roomLabel(apartment.roomsCount)}, ${formatArea(apartment.totalArea)}`, `Ипотека от ${formatPrice(apartment.mortgagePayment)}/мес.`]
    };
  });
}

function buildPersonalReason(apartment: Apartment, stats: PreferenceStats, sort?: string) {
  const details: string[] = [];
  const last = stats.lastApartment;

  if (last) {
    const priceDelta = apartment.price - last.price;
    const areaDelta = apartment.totalArea - last.totalArea;

    if (priceDelta < -100_000) details.push(`Дешевле последнего просмотра на ${formatDelta(priceDelta)}`);
    if (priceDelta > 100_000) details.push(`Дороже последнего просмотра на ${formatDelta(priceDelta)}, но может дать больше метража`);
    if (areaDelta > 1) details.push(`Площадь больше на ${areaDelta.toLocaleString("ru-RU")} м²`);
    if (areaDelta < -1) details.push(`Компактнее на ${Math.abs(areaDelta).toLocaleString("ru-RU")} м²`);
  }

  if (stats.preferredRooms !== undefined && apartment.roomsCount === stats.preferredRooms) {
    details.unshift(`Совпадает по комнатности: ${roomPreferenceLabel(stats.preferredRooms)}`);
  }

  if (sort === "mortgage-asc") details.push(`Ипотечный платеж: ${formatPrice(apartment.mortgagePayment)}/мес.`);
  if (sort === "floor-desc") details.push(`${apartment.floor} этаж — выше большинства вариантов в подборке`);
  if (sort === "area-desc") details.push(`Площадь ${formatArea(apartment.totalArea)} — хороший запас пространства`);

  const reason = details[0] ?? "Близка к вашим просмотрам по цене, площади и формату квартиры.";
  return { reason, details: details.slice(0, 3) };
}

function scoreApartment(apartment: Apartment, stats: PreferenceStats, profile: InterestProfile, favorites: string[]) {
  let score = 40;
  const last = stats.lastApartment;

  if (stats.preferredRooms !== undefined) {
    const roomsDiff = Math.abs(apartment.roomsCount - stats.preferredRooms);
    score += roomsDiff === 0 ? 26 : roomsDiff === 1 ? 12 : -10;
  }

  if (stats.avgPrice) {
    const priceDiffPercent = Math.abs(apartment.price - stats.avgPrice) / stats.avgPrice;
    score += Math.max(0, 28 - priceDiffPercent * 70);
    if (apartment.price <= stats.avgPrice) score += 8;
  }

  if (stats.avgArea) {
    const areaDiffPercent = Math.abs(apartment.totalArea - stats.avgArea) / stats.avgArea;
    score += Math.max(0, 18 - areaDiffPercent * 40);
  }

  if (last) {
    if (apartment.price <= last.price && apartment.totalArea >= last.totalArea * 0.92) score += 18;
    if (apartment.totalArea > last.totalArea && apartment.price <= last.price * 1.12) score += 14;
  }

  if (profile.lastSort === "price-asc" && stats.avgPrice && apartment.price <= stats.avgPrice) score += 12;
  if (profile.lastSort === "area-desc" && stats.avgArea && apartment.totalArea >= stats.avgArea) score += 12;
  if (profile.lastSort === "floor-desc" && stats.avgFloor && apartment.floor >= stats.avgFloor) score += 9;
  if (profile.lastSort === "mortgage-asc") score += Math.max(0, 12 - apartment.mortgagePayment / 20_000);

  if (favorites.includes(apartment.id) || profile.favoriteApartmentIds.includes(apartment.id)) score += 20;
  if (profile.viewedApartmentIds.includes(apartment.id)) score -= 8;

  return score;
}

function recommendationTag(apartment: Apartment, stats: PreferenceStats, profile: InterestProfile) {
  if (profile.favoriteApartmentIds.includes(apartment.id)) return "Вы сохранили";
  if (stats.avgPrice && apartment.price <= stats.avgPrice * 0.96) return "В бюджете";
  if (stats.avgArea && apartment.totalArea >= stats.avgArea * 1.08) return "Больше площадь";
  if (stats.preferredRooms !== undefined && apartment.roomsCount === stats.preferredRooms) return "Похожий формат";
  if (profile.lastSort === "mortgage-asc") return "Ниже платеж";
  return "Подходит вам";
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
  const stats = buildPreferenceStats(apartments, profile, favorites, reservations);
  const unavailableIds = new Set([...reservations, ...profile.reservedApartmentIds]);
  const available = apartments.filter((apartment) => getApartmentStatus(apartment.id, apartment.status) === "available" && !unavailableIds.has(apartment.id));

  if (!stats.hasSignal) {
    return { recommendations: buildDefaultRecommendations(available), stats };
  }

  const scored = available.map((apartment): Recommendation => {
    const score = scoreApartment(apartment, stats, profile, favorites);
    const { reason, details } = buildPersonalReason(apartment, stats, profile.lastSort);
    const match = Math.max(64, Math.min(98, Math.round(score)));

    return {
      apartment,
      score,
      match,
      tag: recommendationTag(apartment, stats, profile),
      reason,
      details: details.length
        ? details
        : [`${roomLabel(apartment.roomsCount)}, ${formatArea(apartment.totalArea)}`, `Ипотека от ${formatPrice(apartment.mortgagePayment)}/мес.`]
    };
  });

  const recommendations = scored
    .sort((a, b) => b.score - a.score || a.apartment.price - b.apartment.price)
    .slice(0, 3);

  return { recommendations, stats };
}

function signatureFor(recommendations: { apartment: Apartment; match?: number }[]) {
  return recommendations.map((item) => `${item.apartment.id}:${item.match ?? 0}`).join("|");
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

  const { recommendations, stats } = useMemo(
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

  const visibleRecommendations = recommendations.filter((item) => item.match >= MIN_NOTIFICATION_MATCH);
  const recommendationSignature = signatureFor(visibleRecommendations);
  const hasVisibleBell = profile.acceptedCookies && visibleRecommendations.length > 0;
  const hasUnread =
    hasVisibleBell &&
    Boolean(recommendationSignature) &&
    profile.seenRecommendationSignature !== recommendationSignature;

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
            <span className="eyebrow">Умные рекомендации</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Закрыть рекомендации">
              ×
            </button>
          </div>

          {!profile.acceptedCookies ? (
            <div className="smart-reco-cookie-card">
              <h3>Включить персональный подбор?</h3>
              <p>
                Мы сохраним просмотры, избранное и сортировку только в этом браузере. Так рекомендации будут похожи на ваши
                реальные интересы, а не на случайный список квартир.
              </p>
              <button type="button" className="button button-primary" onClick={acceptCookies}>
                Разрешить рекомендации
              </button>
            </div>
          ) : (
            <>
              <h3>Подборка под ваши интересы</h3>
              <p className="smart-reco-profile">{stats.profileLabel}</p>

              <div className="smart-reco-list">
                {visibleRecommendations.length ? (
                  visibleRecommendations.map(({ apartment, reason, tag, match, details }) => (
                    <Link href={`/apartment/${apartment.id}`} key={apartment.id} className="smart-reco-item">
                      <div className="smart-reco-item-top">
                        <span>{tag}</span>
                        <b>{match}% совпадение</b>
                      </div>
                      <strong>{apartment.title}</strong>
                      <small>
                        {formatArea(apartment.totalArea)}, {roomLabel(apartment.roomsCount)}, {apartment.floor} этаж · {statusLabel(getApartmentStatus(apartment.id, apartment.status))}
                      </small>
                      <em>{formatPrice(apartment.price)}</em>
                      <p>{reason}</p>
                      <ul>
                        {details.slice(0, 2).map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </Link>
                  ))
                ) : (
                  <div className="smart-reco-empty">
                    <strong>Пока нет рекомендаций выше 80% совпадения.</strong>
                    <p>Посмотрите еще несколько квартир или добавьте понравившийся вариант в избранное — звоночек появится только при сильном совпадении.</p>
                  </div>
                )}
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
          <span>Сохраним просмотры в браузере и подберем похожие квартиры.</span>
          <button type="button" onClick={acceptCookies}>
            ОК
          </button>
        </div>
      ) : null}

      {hasVisibleBell ? (
        <button
          type="button"
          className={`smart-reco-button ${hasUnread ? "has-unread" : ""}`}
          onClick={openPanel}
          aria-label="Открыть персональные рекомендации"
        >
          <span aria-hidden="true">🔔</span>
          {hasUnread ? <i aria-hidden="true" /> : null}
        </button>
      ) : null}
    </div>
  );
}
