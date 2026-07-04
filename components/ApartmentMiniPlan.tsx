import type { Apartment } from "@/types/apartment";

const roomTypeClass: Record<string, string> = {
  kitchen: "mini-room-kitchen",
  living: "mini-room-kitchen",
  bedroom: "mini-room-bedroom",
  children: "mini-room-bedroom",
  bathroom: "mini-room-bathroom",
  hall: "mini-room-hall",
  balcony: "mini-room-balcony",
  wardrobe: "mini-room-wardrobe"
};

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img">
        <rect x="34" y="34" width="720" height="530" rx="26" className="mini-plan-bg" />
        {apartment.rooms.map((room) => (
          <polygon
            key={room.id}
            points={room.polygon}
            className={`mini-room ${roomTypeClass[room.type] ?? ""}`}
          />
        ))}
      </svg>
    </div>
  );
}
