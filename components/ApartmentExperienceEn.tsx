"use client";

import { useMemo, useState } from "react";
import type { Apartment } from "@/types/apartment";
import { ApartmentPlan } from "@/components/ApartmentPlan";
import { RoomInfo } from "@/components/RoomInfo";
import { AiChatEn } from "@/components/AiChatEn";

export function ApartmentExperienceEn({ apartment }: { apartment: Apartment }) {
  const [selectedRoomId, setSelectedRoomId] = useState(apartment.rooms[0]?.id);
  const selectedRoom = useMemo(
    () => apartment.rooms.find((room) => room.id === selectedRoomId) ?? apartment.rooms[0],
    [apartment.rooms, selectedRoomId]
  );

  return (
    <div className="experience-grid">
      <section className="plan-card">
        <div className="section-heading compact-heading">
          <span className="eyebrow">Floor plan</span>
          <h2>Select a room</h2>
          <p className="muted">
            Tap a room to see its details and ask the AI assistant about layout, storage, furniture or lighting.
          </p>
        </div>

        <ApartmentPlan
          apartmentId={apartment.id}
          rooms={apartment.rooms}
          selectedRoomId={selectedRoom?.id}
          onRoomSelect={setSelectedRoomId}
        />

        <div className="room-tabs" aria-label="Select a room for the AI assistant">
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
                <strong>{room.area} m²</strong>
              </button>
            );
          })}
        </div>
      </section>

      <div className="side-stack">
        <RoomInfo room={selectedRoom} locale="en" />
        <AiChatEn apartment={apartment} selectedRoom={selectedRoom} />
      </div>
    </div>
  );
}
