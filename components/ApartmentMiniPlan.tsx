import type { Apartment } from "@/types/apartment";
import { getApartmentVisualRooms, getPlanBounds, roomFill } from "@/lib/apartment-plan-visuals";

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  const visualRooms = getApartmentVisualRooms(apartment.id, apartment.rooms);
  const bounds = getPlanBounds(visualRooms);

  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img" style={{ display: "block", width: "100%" }}>
        <rect x="34" y="34" width="720" height="530" rx="24" fill="#fffdf8" stroke="rgba(0, 59, 166, 0.12)" strokeWidth="2" />

        {visualRooms.map((room) => (
          <rect
            key={room.id}
            x={room.visualX}
            y={room.visualY}
            width={room.visualWidth}
            height={room.visualHeight}
            fill={roomFill(room)}
            stroke="#c9ba9a"
            strokeWidth="4"
          />
        ))}

        <rect
          x={bounds.minX}
          y={bounds.minY}
          width={bounds.maxX - bounds.minX}
          height={bounds.maxY - bounds.minY}
          fill="none"
          stroke="#3f362c"
          strokeWidth="8"
        />
      </svg>
    </div>
  );
}
