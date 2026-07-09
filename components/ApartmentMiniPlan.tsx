import type { Apartment, Room } from "@/types/apartment";

type Point = { x: number; y: number };
type Bounds = { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number };
type DoorSide = "left" | "right" | "top" | "bottom";
type MiniDoor = { id: string; side: DoorSide; x: number; y: number; size: number };

const EPS = 3;
const MIN_SHARED = 34;

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

function touching(a: number, b: number) {
  return Math.abs(a - b) <= EPS;
}

function overlapRange(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { size: Math.max(0, max - min), center: (min + max) / 2 };
}

function sharedDoor(room: Room, neighbor: Room): Omit<MiniDoor, "id"> | null {
  const a = getBounds(room);
  const b = getBounds(neighbor);
  const v = overlapRange(a.minY, a.maxY, b.minY, b.maxY);
  const h = overlapRange(a.minX, a.maxX, b.minX, b.maxX);
  const size = 40;

  if (touching(a.minX, b.maxX) && v.size >= MIN_SHARED) return { side: "left", x: a.minX, y: v.center, size };
  if (touching(a.maxX, b.minX) && v.size >= MIN_SHARED) return { side: "right", x: a.maxX, y: v.center, size };
  if (touching(a.minY, b.maxY) && h.size >= MIN_SHARED) return { side: "top", x: h.center, y: a.minY, size };
  if (touching(a.maxY, b.minY) && h.size >= MIN_SHARED) return { side: "bottom", x: h.center, y: a.maxY, size };
  return null;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("--");
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
      doors.push({ id: `${room.id}-door`, ...door });
    }
  }

  for (const room of rooms) {
    if (room.type !== "balcony") continue;

    for (const neighbor of rooms) {
      if (neighbor.id === room.id || used.has(pairKey(room.id, neighbor.id))) continue;
      const door = sharedDoor(room, neighbor);
      if (!door) continue;
      used.add(pairKey(room.id, neighbor.id));
      doors.push({ id: `${room.id}-door`, ...door });
      break;
    }
  }

  return doors;
}

function MiniDoorLine({ door }: { door: MiniDoor }) {
  const half = door.size / 2;

  if (door.side === "left" || door.side === "right") {
    return <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} className="mini-door-gap-clean" />;
  }

  return <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} className="mini-door-gap-clean" />;
}

export function ApartmentMiniPlan({ apartment }: { apartment: Apartment }) {
  const doors = buildMiniDoors(apartment.rooms);

  return (
    <div className="card-mini-plan" aria-label={`Мини-план квартиры ${apartment.title}`}>
      <svg viewBox="0 0 785 600" role="img">
        <rect x="34" y="34" width="720" height="530" rx="24" className="mini-plan-bg-clean" />

        {apartment.rooms.map((room) => (
          <polygon key={room.id} points={room.polygon} className={`mini-room-clean ${roomTypeClass[room.type] ?? ""}`} />
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
