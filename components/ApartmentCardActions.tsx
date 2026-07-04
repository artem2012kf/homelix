"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import type { Apartment, ApartmentStatus } from "@/types/apartment";

export function ApartmentCardActions({
  apartment,
  effectiveStatus,
  showPlanLink = true
}: {
  apartment: Apartment;
  effectiveStatus?: ApartmentStatus;
  showPlanLink?: boolean;
}) {
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

  const favorite = isFavorite(apartment.id);
  const reservedByUser = isReservedByUser(apartment.id);
  const status = effectiveStatus ?? getApartmentStatus(apartment.id, apartment.status);
  const canReserve = status === "available";

  function requireAuth() {
    setMessage("Сначала войдите или зарегистрируйтесь.");
    window.setTimeout(() => {
      window.location.href = "/account";
    }, 650);
  }

  async function handleFavorite() {
    if (!user) {
      requireAuth();
      return;
    }

    setMessage("Обновляем избранное...");
    const result = await toggleFavorite(apartment.id);
    setMessage(result.ok ? (favorite ? "Удалено из избранного." : "Добавлено в избранное.") : result.error ?? "Не удалось обновить избранное.");
  }

  async function handleReserve() {
    if (!user) {
      requireAuth();
      return;
    }

    if (reservedByUser) {
      setMessage("Отменяем бронь...");
      const result = await cancelReservation(apartment.id);
      setMessage(result.ok ? "Бронь отменена. Статус квартиры обновлен." : result.error ?? "Не удалось отменить бронь.");
      return;
    }

    if (!canReserve) {
      setMessage(status === "reserved" ? "Эта квартира уже находится в брони." : "Эта квартира уже продана.");
      return;
    }

    setMessage("Создаем бронь...");
    const result = await reserveApartment(apartment.id, status);
    setMessage(result.ok ? "Квартира забронирована. Статус изменен на «Бронь»." : result.error ?? "Не удалось забронировать квартиру.");
  }

  return (
    <div className="card-actions">
      {reservedByUser ? <span className="local-reserve-badge">Ваша бронь</span> : null}
      <div className={`card-action-row ${showPlanLink ? "" : "card-action-row-single"}`}>
        {showPlanLink ? (
          <Link className="button button-primary" href={`/apartment/${apartment.id}`}>
            Смотреть планировку
          </Link>
        ) : null}
        <button
          className={`button button-ghost favorite-button ${favorite ? "is-active" : ""}`}
          type="button"
          onClick={handleFavorite}
          disabled={!isReady}
        >
          {favorite ? "В избранном" : "В избранное"}
        </button>
      </div>
      <button
        className="button button-ghost reserve-button"
        type="button"
        onClick={handleReserve}
        disabled={!isReady || (!reservedByUser && status !== "available")}
      >
        {reservedByUser ? "Отменить бронь" : status === "available" ? "Забронировать" : status === "reserved" ? "Уже в брони" : "Продана"}
      </button>
      {message ? <small className="card-action-message">{message}</small> : null}
    </div>
  );
}
