"use client";

import { useEffect, useMemo, useState } from "react";
import type { Apartment } from "@/types/apartment";
import type { FurniturePlacement } from "@/types/furniture-placement";
import { ApartmentPlan } from "@/components/ApartmentPlan";
import { AiChat } from "@/components/AiChat";
import { RoomInfo } from "@/components/RoomInfo";
import { formatPrice } from "@/lib/format";

type PlacementOptions = {
  replacePlacementId?: string;
  replaceSameCategoryInRoom?: boolean;
};

function getDeviceId() {
  if (typeof window === "undefined") return "server";

  const key = "sq-device-id";
  const saved = window.localStorage.getItem(key);
  if (saved) return saved;

  const next =
    typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(key, next);
  return next;
}

function normalizePlacement(placement: FurniturePlacement, roomPlacementIndex: number): FurniturePlacement {
  return {
    ...placement,
    layoutVariant: placement.layoutVariant ?? roomPlacementIndex % 5,
    manualRotation: placement.manualRotation ?? 0,
    createdAt: placement.createdAt ?? Date.now()
  };
}

export function ApartmentExperience({ apartment }: { apartment: Apartment }) {
  const [selectedRoomId, setSelectedRoomId] = useState(apartment.rooms[0]?.id);
  const [furniturePlacements, setFurniturePlacements] = useState<FurniturePlacement[]>([]);
  const [furniturePlanLoaded, setFurniturePlanLoaded] = useState(false);
  const [furniturePlanKey, setFurniturePlanKey] = useState("");

  useEffect(() => {
    setFurniturePlanKey(`sq-furniture-plan-${getDeviceId()}-${apartment.id}`);
  }, [apartment.id]);

  useEffect(() => {
    if (!furniturePlanKey) return;

    try {
      const raw = window.localStorage.getItem(furniturePlanKey);
      const saved = raw ? JSON.parse(raw) : [];
      setFurniturePlacements(Array.isArray(saved) ? saved : []);
    } catch {
      setFurniturePlacements([]);
    } finally {
      setFurniturePlanLoaded(true);
    }
  }, [furniturePlanKey]);

  useEffect(() => {
    if (!furniturePlanLoaded || !furniturePlanKey) return;
    window.localStorage.setItem(furniturePlanKey, JSON.stringify(furniturePlacements));
  }, [furniturePlanKey, furniturePlanLoaded, furniturePlacements]);

  const selectedRoom = useMemo(
    () => apartment.rooms.find((room) => room.id === selectedRoomId) ?? apartment.rooms[0],
    [apartment.rooms, selectedRoomId]
  );

  const furnitureTotal = useMemo(
    () => furniturePlacements.reduce((sum, placement) => sum + placement.price, 0),
    [furniturePlacements]
  );
  const totalWithFurniture = apartment.price + furnitureTotal;

  useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("sq-furniture-price-updated", {
        detail: {
          apartmentId: apartment.id,
          furnitureTotal,
          totalWithFurniture
        }
      })
    );
  }, [apartment.id, furnitureTotal, totalWithFurniture]);

  function placeFurniture(nextPlacement: FurniturePlacement, options: PlacementOptions = {}) {
    setFurniturePlacements((current) => {
      let next = current;

      if (options.replacePlacementId) {
        next = next.filter((placement) => placement.id !== options.replacePlacementId);
      }

      if (options.replaceSameCategoryInRoom) {
        next = next.filter(
          (placement) =>
            !(placement.roomId === nextPlacement.roomId && placement.category === nextPlacement.category)
        );
      }

      const roomPlacementIndex = next.filter((placement) => placement.roomId === nextPlacement.roomId).length;
      return [
        ...next,
        normalizePlacement(
          {
            ...nextPlacement,
            manualX: undefined,
            manualY: undefined,
            manualRotation: 0
          },
          roomPlacementIndex
        )
      ];
    });

    setSelectedRoomId(nextPlacement.roomId);
  }

  function moveFurniture(placementId: string) {
    setFurniturePlacements((current) =>
      current.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              manualX: undefined,
              manualY: undefined,
              layoutVariant: ((placement.layoutVariant ?? 0) + 1) % 8
            }
          : placement
      )
    );
  }

  function moveFurnitureManually(placementId: string, x: number, y: number) {
    setFurniturePlacements((current) =>
      current.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              manualX: x,
              manualY: y
            }
          : placement
      )
    );
  }

  function rotateFurniture(placementId: string) {
    setFurniturePlacements((current) =>
      current.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              manualRotation: ((placement.manualRotation ?? 0) + 90) % 360
            }
          : placement
      )
    );
  }

  function removeFurniture(placementId: string) {
    setFurniturePlacements((current) => current.filter((placement) => placement.id !== placementId));
  }

  function clearFurniturePlan() {
    setFurniturePlacements([]);
  }

  return (
    <div className="experience-grid">
      <section className="plan-card">
        <div className="section-heading compact-heading">
          <span className="eyebrow">Планировка</span>
          <h2>Выберите комнату</h2>
          <p className="muted">
            Все квартиры переделаны по нормальным схемам. Мебель можно двигать мышью или пальцем.
          </p>
        </div>

        <ApartmentPlan
          apartmentId={apartment.id}
          rooms={apartment.rooms}
          selectedRoomId={selectedRoom?.id}
          onRoomSelect={setSelectedRoomId}
          furniturePlacements={furniturePlacements}
          onFurnitureManualMove={moveFurnitureManually}
        />

        {furniturePlacements.length > 0 && (
          <div className="placed-furniture-panel">
            <div>
              <strong>Мебель на планировке</strong>
              <span>
                Мебель учитывается в верхней карточке стоимости. Предмет можно перетащить на плане и повернуть кнопкой ниже.
              </span>
            </div>
            <ul>
              {furniturePlacements.map((placement) => {
                const room = apartment.rooms.find((item) => item.id === placement.roomId);
                return (
                  <li key={placement.id}>
                    <span>{room?.name ?? "Комната"}</span>
                    <strong>{placement.title}</strong>
                    <small>
                      {formatPrice(placement.price)}
                      {typeof placement.manualRotation === "number" && placement.manualRotation > 0
                        ? ` · поворот ${placement.manualRotation}°`
                        : ""}
                    </small>
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <button type="button" className="prompt-chip" onClick={() => rotateFurniture(placement.id)}>
                        Повернуть
                      </button>
                      <button type="button" className="prompt-chip" onClick={() => removeFurniture(placement.id)}>
                        Убрать
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="room-tabs" aria-label="Выбор комнаты для ИИ-консультанта">
          {apartment.rooms.map((room) => {
            const selected = selectedRoom?.id === room.id;
            return (
              <button
                key={room.id}
                type="button"
                className={`room-tab ${selected ? "room-tab-selected" : ""}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <span>{room.name}</span>
                <strong>{room.area} м²</strong>
              </button>
            );
          })}
        </div>
      </section>

      <div className="side-stack">
        <RoomInfo room={selectedRoom} />
        <AiChat
          apartment={apartment}
          selectedRoom={selectedRoom}
          furniturePlacements={furniturePlacements}
          onFurniturePlacement={placeFurniture}
          onFurnitureMove={moveFurniture}
          onFurnitureRemove={removeFurniture}
          onFurnitureClear={clearFurniturePlan}
        />
      </div>
    </div>
  );
}
