"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment, ApartmentStatus } from "@/types/apartment";
import { siteText, type Locale } from "@/lib/i18n";

function trackInterest(type: "view" | "favorite" | "reserve" | "buy", apartmentId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("hall-track-interest", { detail: { type, apartmentId } }));
}

export function ApartmentCardActions({
  apartment,
  effectiveStatus,
  showPlanLink = true,
  locale = "ru"
}: {
  apartment: Apartment;
  effectiveStatus?: ApartmentStatus;
  showPlanLink?: boolean;
  locale?: Locale;
}) {
  const router = useRouter();
  const {
    user,
    isReady,
    isFavorite,
    toggleFavorite,
    isReservedByUser,
    reserveApartment,
    cancelReservation,
    getApartmentStatus
  } = useAuth();
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<"favorite" | "reservation" | "purchase" | null>(null);
  const text = siteText[locale].card;
  const favorite = isFavorite(apartment.id);
  const reservedByUser = isReservedByUser(apartment.id);
  const status = effectiveStatus ?? getApartmentStatus(apartment.id, apartment.status);
  const canReserve = status === "available";
  const isSubmitting = pendingAction !== null;

  function requireAuth() {
    setMessage(text.authRequired);
    router.push("/account");
  }

  async function handleFavorite() {
    if (isSubmitting) return;
    if (!user) return requireAuth();
    setPendingAction("favorite");
    setMessage(text.updatingFavorites);
    try {
      const result = await toggleFavorite(apartment.id);
      if (result.ok && !favorite) trackInterest("favorite", apartment.id);
      setMessage(result.ok ? (favorite ? text.removedFavorite : text.addedFavorite) : result.error ?? text.favoriteError);
    } finally {
      setPendingAction(null);
    }
  }

  async function handleReserve() {
    if (isSubmitting) return;
    if (!user) return requireAuth();
    if (!reservedByUser && !canReserve) {
      setMessage(status === "reserved" ? text.occupied : text.alreadySold);
      return;
    }
    setPendingAction("reservation");
    try {
      if (reservedByUser) {
        setMessage(text.cancelling);
        const result = await cancelReservation(apartment.id);
        setMessage(result.ok ? text.cancelled : result.error ?? text.cancelError);
        return;
      }
      setMessage(text.reserving);
      const result = await reserveApartment(apartment.id, status);
      if (result.ok) trackInterest("reserve", apartment.id);
      setMessage(result.ok ? text.reserved : result.error ?? text.reserveError);
    } finally {
      setPendingAction(null);
    }
  }

  async function handlePurchase() {
    if (isSubmitting) return;
    if (!user) return requireAuth();
    if (status !== "available" && !reservedByUser) {
      setMessage(status === "sold" ? text.alreadySold : text.occupied);
      return;
    }
    setPendingAction("purchase");
    setMessage(text.buying);
    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "apartment", apartmentId: apartment.id, city: apartment.city, project: apartment.project })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || text.reserveError);
      trackInterest("buy", apartment.id);
      setMessage(`${text.purchaseSent} ${data.requestId ?? ""}`.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : text.reserveError);
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div className="card-actions" aria-busy={isSubmitting}>
      {reservedByUser ? <span className="local-reserve-badge">{text.yourReservation}</span> : null}
      <div className={`card-action-row ${showPlanLink ? "" : "card-action-row-single"}`}>
        {showPlanLink ? (
          <Link className="button button-ghost" href={`/apartment/${apartment.id}`} onClick={() => trackInterest("view", apartment.id)}>{text.plan}</Link>
        ) : null}
        <button className={`button button-ghost favorite-button ${favorite ? "is-active" : ""}`} type="button" onClick={handleFavorite} disabled={!isReady || isSubmitting}>
          {pendingAction === "favorite" ? text.updatingFavorites : favorite ? text.inFavorites : text.favorite}
        </button>
      </div>
      <div className="card-action-row purchase-row">
        <button className="button button-primary buy-button" type="button" onClick={handlePurchase} disabled={!isReady || isSubmitting || (status !== "available" && !reservedByUser)}>
          {pendingAction === "purchase" ? text.buying : text.buy}
        </button>
        <button className="button button-ghost reserve-button" type="button" onClick={handleReserve} disabled={!isReady || isSubmitting || (!reservedByUser && status !== "available")}>
          {pendingAction === "reservation"
            ? reservedByUser ? text.cancelling : text.reserving
            : reservedByUser ? text.cancelReservation
            : status === "available" ? text.reserve
            : status === "reserved" ? text.alreadyReserved
            : text.sold}
        </button>
      </div>
      {message ? <small className="card-action-message" aria-live="polite">{message}</small> : null}
    </div>
  );
}