"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Apartment } from "@/types/apartment";
import { useAuth } from "@/components/AuthProvider";
import { CurrencyPrice } from "@/components/CurrencyProvider";
import { formatArea, statusLabel } from "@/lib/format";
import { localizeApartment, translatePlace } from "@/lib/i18n";

const CONSENT_KEY = "hall-recommendations-consent-en";

export function SmartRecommendationBellEn({ apartments }: { apartments: Apartment[] }) {
  const { favorites, reservations, getApartmentStatus } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  useEffect(() => {
    setAccepted(window.localStorage.getItem(CONSENT_KEY) === "yes");
    setIsReady(true);
  }, []);

  const recommendations = useMemo(() => {
    const available = apartments.filter(
      (apartment) => getApartmentStatus(apartment.id, apartment.status) === "available" && !reservations.includes(apartment.id)
    );

    return [...available]
      .map((apartment) => ({
        apartment,
        score:
          (favorites.includes(apartment.id) ? 35 : 0) +
          Math.max(0, 30 - apartment.price / 1_000_000) +
          Math.min(25, apartment.totalArea / 4)
      }))
      .sort((left, right) => right.score - left.score || left.apartment.price - right.apartment.price)
      .slice(0, 3);
  }, [apartments, favorites, getApartmentStatus, reservations]);

  function accept() {
    window.localStorage.setItem(CONSENT_KEY, "yes");
    setAccepted(true);
    setIsOpen(true);
  }

  if (!isReady) return null;

  return (
    <div className="smart-reco-shell" aria-live="polite">
      {isOpen ? (
        <aside className="smart-reco-panel">
          <div className="smart-reco-panel-head">
            <span className="eyebrow">Smart recommendations</span>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Close recommendations">×</button>
          </div>

          {!accepted ? (
            <div className="smart-reco-cookie-card">
              <h3>Enable personalised suggestions?</h3>
              <p>After your consent, HALL will use favorites and browsing signals stored in this browser.</p>
              <button type="button" className="button button-primary" onClick={accept}>Enable recommendations</button>
            </div>
          ) : (
            <>
              <h3>Selected for your current city</h3>
              <p className="smart-reco-profile">Recommendation data stays in this browser and is not shared with advertisers.</p>
              <div className="smart-reco-list">
                {recommendations.map(({ apartment }, index) => {
                  const display = localizeApartment(apartment, "en");
                  const match = Math.max(76, 94 - index * 5);
                  return (
                    <Link href={`/en/apartment/${apartment.id}`} key={apartment.id} className="smart-reco-item">
                      <div className="smart-reco-item-top">
                        <span>{index === 0 ? "Best match" : "Worth comparing"}</span>
                        <b>{match}% match</b>
                      </div>
                      <strong>{translatePlace(apartment.city, "en")}, {display.title}</strong>
                      <small>
                        {formatArea(apartment.totalArea, "en")}, {apartment.roomsCount === 1 ? "1 room / studio" : `${apartment.roomsCount} rooms`}, floor {apartment.floor} · {statusLabel(getApartmentStatus(apartment.id, apartment.status), "en")}
                      </small>
                      <em><CurrencyPrice value={apartment.price} /></em>
                      <p>{index === 0 ? "Strong balance of price, area and availability." : "An available option in the selected city for comparison."}</p>
                    </Link>
                  );
                })}
              </div>
              <Link href="/en/ai" className="smart-reco-ai-link">Ask the AI assistant</Link>
            </>
          )}
        </aside>
      ) : null}

      {!accepted ? (
        <div className="smart-reco-consent">
          <strong>Personalised recommendations</strong>
          <span>Tracking starts only after your consent.</span>
          <button type="button" onClick={accept}>OK</button>
        </div>
      ) : null}

      {accepted && recommendations.length ? (
        <button
          type="button"
          className={`smart-reco-button ${hasUnread ? "has-unread" : ""}`}
          onClick={() => {
            setIsOpen((current) => !current);
            setHasUnread(false);
          }}
          aria-label="Open personalised recommendations"
        >
          <span aria-hidden="true">🔔</span>
          {hasUnread ? <i aria-hidden="true" /> : null}
        </button>
      ) : null}
    </div>
  );
}
