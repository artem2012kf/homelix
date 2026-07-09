import type { Apartment, Room } from "@/types/apartment";

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

type Bounds = { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number };
type DoorSide = "left" | "right" | "top" | "bottom";
type MiniDoor = { id: string; side: DoorSide; x: number; y: number; size: number };

function parsePolygon(polygon: string) {
  return polygon
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function getBounds(room: Room): Bounds {
  const points = parsePolygon(room.polygon);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function touching(a: number, b: number) {
  return Math.abs(a - b) <= 3;
}

function overlapRange(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { size: Math.max(0, max - min), center: (min + max) / 2 };
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("--");
}

function sharedDoor(room: Room, neighbor: Room): Omit<MiniDoor, "id"> | null {
  const a = getBounds(room);
  const b = getBounds(neighbor);
  const vertical = overlapRange(a.minY, a.maxY, b.minY, b.maxY);
  const horizontal = overlapRange(a.minX, a.maxX, b.minX, b.maxX);

  if (touching(a.minX, b.maxX) && vertical.size >= 34) {
    return { side: "left", x: a.minX, y: clamp(vertical.center, a.minY + 30, a.maxY - 30), size: 40 };
  }

  if (touching(a.maxX, b.minX) && vertical.size >= 34) {
    return { side: "right", x: a.maxX, y: clamp(vertical.center, a.minY + 30, a.maxY - 30), size: 40 };
  }

  if (touching(a.minY, b.maxY) && horizontal.size >= 34) {
    return { side: "top", x: clamp(horizontal.center, a.minX + 30, a.maxX - 30), y: a.minY, size: 40 };
  }

  if (touching(a.maxY, b.minY) && horizontal.size >= 34) {
    return { side: "bottom", x: clamp(horizontal.center, a.minX + 30, a.maxX - 30), y: a.maxY, size: 40 };
  }

  return null;
}

function buildMiniDoors(rooms: Room[]) {
  const hall = rooms.find((room) => room.type === "hall");
  const doors: MiniDoor[] = [];
  const used = new Set<string>();

  if (hall) {
    for (const room of rooms) {
      if (room.id === hall.id || room.type === "balcony") continue;
      const door = sharedDoor(room, hall);
      if (!door) continue;
      used.add(pairKey(room.id, hall.id));
      doors.push({ id: `${room.id}-mini-door`, ...door });
    }
  }

  for (const room of rooms) {
    if (room.type !== "balcony") continue;

    const neighbor = rooms.find((item) => item.id !== room.id && !used.has(pairKey(room.id, item.id)) && sharedDoor(room, item));
    if (!neighbor) continue;

    const door = sharedDoor(room, neighbor);
    if (!door) continue;
    doors.push({ id: `${room.id}-mini-door`, ...door });
  }

  return doors;
}

function RoomShape({ room }: { room: Room }) {
  const points = parsePolygon(room.polygon);
  const bounds = getBounds(room);
  const className = `mini-room ${roomTypeClass[room.type] ?? ""}`;

  if (points.length === 4) {
    return (
      <rect
        x={bounds.minX}
        y={bounds.minY}
        width={bounds.maxX - bounds.minX}
        height={bounds.maxY - bounds.minY}
        rx="15"
        ry="15"
        className={className}
      />
    );
  }

  return <polygon points={room.polygon} className={className} />;
}

function MiniDoorLine({ door }: { door: MiniDoor }) {
  const half = door.size / 2;

  if (door.side === "left" || door.side === "right") {
    return <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} className="mini-door-gap" />;
  }

  return <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} className="mini-door-gap" />;
}

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  const doors = buildMiniDoors(apartment.rooms);

  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img">
        <rect x="34" y="34" width="720" height="530" rx="30" className="mini-plan-bg" />
        {apartment.rooms.map((room) => (
          <RoomShape key={room.id} room={room} />
        ))}
        <g aria-hidden="true">
          {doors.map((door) => (
            <MiniDoorLine key={door.id} door={door} />
          ))}
        </g>
      </svg>
    </div>
  );
}
