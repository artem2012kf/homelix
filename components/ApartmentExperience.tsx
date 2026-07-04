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

function normalizePlacement(placement: FurniturePlacement, roomPlacementIndex: number): FurniturePlacement {
  return {
    ...placement,
    layoutVariant: placement.layoutVariant ?? roomPlacementIndex % 4,
    createdAt: placement.createdAt ?? Date.now()
  };
}

export function ApartmentExperience({ apartment }: { apartment: Apartment }) {
  const [selectedRoomId, setSelectedRoomId] = useState(apartment.rooms[0]?.id);
  const [furniturePlacements, setFurniturePlacements] = useState<FurniturePlacement[]>([]);
  const [furniturePlanLoaded, setFurniturePlanLoaded] = useState(false);
  const furniturePlanKey = `sq-furniture-plan-${apartment.id}`;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(furniturePlanKey);
      const saved = raw ? JSON.parse(raw) : [];
      if (Array.isArray(saved)) {
        setFurniturePlacements(saved);
      }
    } catch {
      setFurniturePlacements([]);
    } finally {
      setFurniturePlanLoaded(true);
    }
  }, [furniturePlanKey]);

  useEffect(() => {
    if (!furniturePlanLoaded) return;
    window.localStorage.setItem(furniturePlanKey, JSON.stringify(furniturePlacements));
  }, [furniturePlanKey, furniturePlanLoaded, furniturePlacements]);

  const selectedRoom = useMemo(
    () => apartment.rooms.find((room) => room.id === selectedRoomId) ?? apartment.rooms[0],
    [apartment.rooms, selectedRoomId]
  );

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
      return [...next, normalizePlacement(nextPlacement, roomPlacementIndex)];
    });
    setSelectedRoomId(nextPlacement.roomId);
  }

  function moveFurniture(placementId: string) {
    setFurniturePlacements((current) =>
      current.map((placement) =>
        placement.id === placementId
          ? {
              ...placement,
              layoutVariant: ((placement.layoutVariant ?? 0) + 1) % 5
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
          <p className="muted">Наведите курсор на помещение, нажмите на планировке или выберите комнату из списка ниже.</p>
        </div>
        <ApartmentPlan
          rooms={apartment.rooms}
          selectedRoomId={selectedRoom?.id}
          onRoomSelect={setSelectedRoomId}
          furniturePlacements={furniturePlacements}
        />

        {furniturePlacements.length > 0 && (
          <div className="placed-furniture-panel">
            <div>
              <strong>Мебель на планировке</strong>
              <span>
                Управление идет через чат: напишите «передвинь кровать», «убери шкаф» или «очисти всю мебель».
              </span>
            </div>
            <ul>
              {furniturePlacements.map((placement) => {
                const room = apartment.rooms.find((item) => item.id === placement.roomId);
                return (
                  <li key={placement.id}>
                    <span>{room?.name ?? "Комната"}</span>
                    <strong>{placement.title}</strong>
                    <small>{formatPrice(placement.price)}</small>
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
