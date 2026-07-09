import type { Apartment, Room } from "@/types/apartment";

type Point = { x: number; y: number };

function parsePolygon(polygon: string): Point[] {
  return polygon
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function roomFill(type: Room["type"]) {
  if (type === "kitchen" || type === "living") return "#eef5fb";
  if (type === "bedroom" || type === "children") return "#eef8ef";
  if (type === "bathroom") return "#eef3fa";
  if (type === "hall") return "#fff6e8";
  if (type === "balcony") return "#f2f7ff";
  if (type === "wardrobe") return "#f7f1ff";
  return "#ffffff";
}

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img" style={{ display: "block", width: "100%" }}>
        <rect x="34" y="34" width="720" height="530" rx="24" fill="#fffdf8" stroke="rgba(0, 59, 166, 0.12)" strokeWidth="2" />

        {apartment.rooms.map((room) => {
          const points = parsePolygon(room.polygon);
          const isValid = points.length >= 3;

          if (!isValid) return null;

          return (
            <polygon
              key={room.id}
              points={room.polygon}
              fill={roomFill(room.type)}
              stroke="#c9ba9a"
              strokeWidth="4"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
  );
}
