"use client";

import type { Room } from "@/types/apartment";
import type { FurniturePlacement } from "@/types/furniture-placement";

type ApartmentPlanProps = {
  rooms: Room[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
  furniturePlacements?: FurniturePlacement[];
};

type Point = {
  x: number;
  y: number;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

type DoorSide = "left" | "right" | "top" | "bottom";

type DoorOpening = {
  id: string;
  side: DoorSide;
  x: number;
  y: number;
  size: number;
};

type FurnitureGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  rotate?: number;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeClamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return clamp(value, min, max);
}

function overlapCenter(aMin: number, aMax: number, bMin: number, bMax: number, fallback: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);

  if (max > min) {
    return (min + max) / 2;
  }

  return fallback;
}

function getFacingDoor(roomBounds: Bounds, targetBounds: Bounds, fallbackSide?: DoorSide): Omit<DoorOpening, "id" | "size"> {
  const dx = targetBounds.centerX - roomBounds.centerX;
  const dy = targetBounds.centerY - roomBounds.centerY;

  let side: DoorSide = fallbackSide ?? (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "bottom" : "top");

  if (fallbackSide) {
    side = fallbackSide;
  }

  if (side === "left") {
    return {
      side,
      x: roomBounds.minX,
      y: clamp(
        overlapCenter(roomBounds.minY, roomBounds.maxY, targetBounds.minY, targetBounds.maxY, roomBounds.centerY),
        roomBounds.minY + 34,
        roomBounds.maxY - 34
      )
    };
  }

  if (side === "right") {
    return {
      side,
      x: roomBounds.maxX,
      y: clamp(
        overlapCenter(roomBounds.minY, roomBounds.maxY, targetBounds.minY, targetBounds.maxY, roomBounds.centerY),
        roomBounds.minY + 34,
        roomBounds.maxY - 34
      )
    };
  }

  if (side === "top") {
    return {
      side,
      x: clamp(
        overlapCenter(roomBounds.minX, roomBounds.maxX, targetBounds.minX, targetBounds.maxX, roomBounds.centerX),
        roomBounds.minX + 34,
        roomBounds.maxX - 34
      ),
      y: roomBounds.minY
    };
  }

  return {
    side,
    x: clamp(
      overlapCenter(roomBounds.minX, roomBounds.maxX, targetBounds.minX, targetBounds.maxX, roomBounds.centerX),
      roomBounds.minX + 34,
      roomBounds.maxX - 34
    ),
    y: roomBounds.maxY
  };
}

function buildDoorOpenings(rooms: Room[]): DoorOpening[] {
  const boundsByRoom = new Map(rooms.map((room) => [room.id, getBounds(room)]));
  const hall = rooms.find((room) => room.type === "hall");
  const hallBounds = hall ? boundsByRoom.get(hall.id) : undefined;
  const nonBalconyRooms = rooms.filter((room) => room.type !== "balcony");

  return rooms.flatMap((room) => {
    const bounds = boundsByRoom.get(room.id);
    if (!bounds) return [];

    const size = room.type === "kitchen" || room.type === "living" ? 52 : 42;

    if (room.type === "hall") {
      return [
        {
          id: `${room.id}-entry-door`,
          side: "left" as DoorSide,
          x: bounds.minX,
          y: clamp(bounds.centerY, bounds.minY + 40, bounds.maxY - 40),
          size: 48
        }
      ];
    }

    if (room.type === "balcony") {
      const nearestRoom = nonBalconyRooms
        .filter((candidate) => candidate.id !== room.id)
        .map((candidate) => ({
          room: candidate,
          bounds: boundsByRoom.get(candidate.id)!,
          distance: Math.hypot(bounds.centerX - boundsByRoom.get(candidate.id)!.centerX, bounds.centerY - boundsByRoom.get(candidate.id)!.centerY)
        }))
        .sort((a, b) => a.distance - b.distance)[0];

      if (!nearestRoom) return [];

      return [
        {
          id: `${room.id}-balcony-door`,
          ...getFacingDoor(bounds, nearestRoom.bounds),
          size: 54
        }
      ];
    }

    if (hallBounds) {
      return [
        {
          id: `${room.id}-door`,
          ...getFacingDoor(bounds, hallBounds),
          size
        }
      ];
    }

    return [
      {
        id: `${room.id}-door`,
        side: "left" as DoorSide,
        x: bounds.minX,
        y: bounds.centerY,
        size
      }
    ];
  });
}

function getPlacementLabel(placement: FurniturePlacement) {
  const title = placement.title.toLowerCase();
  if (title.includes("junior")) return "Детская";

  switch (placement.category) {
    case "bed":
      return "Кровать";
    case "sofa":
      return "Диван";
    case "table":
      return "Стол";
    case "storage":
      return "Шкаф";
    case "kitchen":
      return "Кухня";
    case "bathroom":
      return "Тумба";
    case "lighting":
      return "Свет";
    case "decor":
      return "Текстиль";
    default:
      return placement.title.slice(0, 12);
  }
}

function getFurnitureSize(roomBounds: Bounds, placement: FurniturePlacement) {
  const roomWidth = roomBounds.maxX - roomBounds.minX;
  const roomHeight = roomBounds.maxY - roomBounds.minY;

  switch (placement.category) {
    case "bed":
      return {
        width: safeClamp(roomWidth * 0.52, 96, 158),
        height: safeClamp(roomHeight * 0.34, 54, 92)
      };
    case "sofa":
      return {
        width: safeClamp(roomWidth * 0.54, 92, 170),
        height: safeClamp(roomHeight * 0.24, 40, 70)
      };
    case "table": {
      const size = safeClamp(Math.min(roomWidth, roomHeight) * 0.3, 46, 72);
      return { width: size, height: size };
    }
    case "storage":
      return {
        width: safeClamp(roomWidth * 0.32, 58, 110),
        height: safeClamp(roomHeight * 0.18, 34, 54)
      };
    case "kitchen":
      return {
        width: safeClamp(roomWidth * 0.62, 118, 218),
        height: safeClamp(roomHeight * 0.18, 34, 56)
      };
    case "bathroom":
      return {
        width: safeClamp(roomWidth * 0.44, 52, 96),
        height: safeClamp(roomHeight * 0.22, 32, 54)
      };
    case "lighting":
      return {
        width: safeClamp(roomWidth * 0.54, 76, 170),
        height: 20
      };
    case "decor":
      return {
        width: safeClamp(roomWidth * 0.38, 56, 112),
        height: safeClamp(roomHeight * 0.2, 32, 58)
      };
    default:
      return { width: 82, height: 44 };
  }
}

function slotPosition(bounds: Bounds, width: number, height: number, variant: number, orderInRoom: number) {
  const margin = 18;
  const smallOffset = Math.min(orderInRoom * 12, 36);
  const slots = [
    { x: bounds.minX + margin, y: bounds.minY + margin },
    { x: bounds.maxX - width - margin, y: bounds.minY + margin },
    { x: bounds.minX + margin, y: bounds.maxY - height - margin },
    { x: bounds.maxX - width - margin, y: bounds.maxY - height - margin },
    { x: bounds.centerX - width / 2, y: bounds.centerY - height / 2 }
  ];
  const slot = slots[variant % slots.length];

  return {
    x: safeClamp(slot.x + smallOffset, bounds.minX + 12, bounds.maxX - width - 12),
    y: safeClamp(slot.y + smallOffset, bounds.minY + 12, bounds.maxY - height - 12)
  };
}

function getDefaultVariant(placement: FurniturePlacement) {
  switch (placement.category) {
    case "kitchen":
    case "bathroom":
      return 0;
    case "storage":
      return 1;
    case "bed":
    case "sofa":
      return 2;
    case "table":
      return 4;
    case "lighting":
      return 4;
    case "decor":
      return 3;
    default:
      return 4;
  }
}

function getFurnitureGeometry(room: Room, placement: FurniturePlacement, orderInRoom: number): FurnitureGeometry {
  const bounds = getBounds(room);
  const size = getFurnitureSize(bounds, placement);
  const variant = placement.layoutVariant ?? getDefaultVariant(placement);
  const position = slotPosition(bounds, size.width, size.height, variant, orderInRoom);

  if (placement.category === "bed") {
    const useVertical = variant % 2 === 1;
    const width = useVertical ? Math.min(size.height * 1.15, bounds.maxX - bounds.minX - 30) : size.width;
    const height = useVertical ? size.width * 0.78 : size.height;
    return {
      ...slotPosition(bounds, width, height, variant, orderInRoom),
      width,
      height,
      label: getPlacementLabel(placement)
    };
  }

  if (placement.category === "lighting") {
    return {
      x: bounds.centerX - size.width / 2,
      y: safeClamp(bounds.centerY - size.height / 2 + (variant - 2) * 20, bounds.minY + 16, bounds.maxY - size.height - 16),
      width: size.width,
      height: size.height,
      label: getPlacementLabel(placement),
      rotate: variant % 2 === 0 ? 0 : 90
    };
  }

  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    label: getPlacementLabel(placement)
  };
}

function Door({ door }: { door: DoorOpening }) {
  const half = door.size / 2;
  const leaf = Math.min(door.size * 0.82, 40);

  if (door.side === "left") {
    const hingeY = door.y - half;
    return (
      <g className="door-opening">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} className="door-gap" />
        <line x1={door.x} y1={hingeY} x2={door.x + leaf} y2={hingeY + leaf} className="door-leaf" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x + leaf * 0.85} ${hingeY + leaf * 0.15} ${door.x + leaf} ${hingeY + leaf}`} className="door-swing" />
      </g>
    );
  }

  if (door.side === "right") {
    const hingeY = door.y - half;
    return (
      <g className="door-opening">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} className="door-gap" />
        <line x1={door.x} y1={hingeY} x2={door.x - leaf} y2={hingeY + leaf} className="door-leaf" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x - leaf * 0.85} ${hingeY + leaf * 0.15} ${door.x - leaf} ${hingeY + leaf}`} className="door-swing" />
      </g>
    );
  }

  if (door.side === "top") {
    const hingeX = door.x - half;
    return (
      <g className="door-opening">
        <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} className="door-gap" />
        <line x1={hingeX} y1={door.y} x2={hingeX + leaf} y2={door.y + leaf} className="door-leaf" />
        <path d={`M ${hingeX} ${door.y} Q ${hingeX + leaf * 0.15} ${door.y + leaf * 0.85} ${hingeX + leaf} ${door.y + leaf}`} className="door-swing" />
      </g>
    );
  }

  const hingeX = door.x - half;
  return (
    <g className="door-opening">
      <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} className="door-gap" />
      <line x1={hingeX} y1={door.y} x2={hingeX + leaf} y2={door.y - leaf} className="door-leaf" />
      <path d={`M ${hingeX} ${door.y} Q ${hingeX + leaf * 0.15} ${door.y - leaf * 0.85} ${hingeX + leaf} ${door.y - leaf}`} className="door-swing" />
    </g>
  );
}

function FurnitureIcon({ placement, geometry }: { placement: FurniturePlacement; geometry: FurnitureGeometry }) {
  const centerX = geometry.x + geometry.width / 2;
  const centerY = geometry.y + geometry.height / 2;

  if (placement.category === "table") {
    return (
      <>
        <ellipse cx={centerX} cy={centerY} rx={geometry.width / 2} ry={geometry.height / 2} className="furniture-placement-shape" />
        <circle cx={centerX} cy={geometry.y - 8} r="7" className="furniture-detail" />
        <circle cx={centerX} cy={geometry.y + geometry.height + 8} r="7" className="furniture-detail" />
      </>
    );
  }

  if (placement.category === "bed") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="14" className="furniture-placement-shape" />
        <rect x={geometry.x + 8} y={geometry.y + 8} width={geometry.width - 16} height="14" rx="7" className="furniture-detail-light" />
        <line x1={geometry.x + 10} y1={geometry.y + geometry.height * 0.55} x2={geometry.x + geometry.width - 10} y2={geometry.y + geometry.height * 0.55} className="furniture-detail-line" />
      </>
    );
  }

  if (placement.category === "sofa") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y + 8} width={geometry.width} height={geometry.height - 8} rx="14" className="furniture-placement-shape" />
        <rect x={geometry.x + 8} y={geometry.y} width={geometry.width - 16} height="18" rx="9" className="furniture-detail-light" />
        <line x1={centerX} y1={geometry.y + 10} x2={centerX} y2={geometry.y + geometry.height - 8} className="furniture-detail-line" />
      </>
    );
  }

  if (placement.category === "storage") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="10" className="furniture-placement-shape" />
        <line x1={centerX} y1={geometry.y + 6} x2={centerX} y2={geometry.y + geometry.height - 6} className="furniture-detail-line" />
        <circle cx={centerX - 7} cy={centerY} r="3" className="furniture-detail-light" />
        <circle cx={centerX + 7} cy={centerY} r="3" className="furniture-detail-light" />
      </>
    );
  }

  if (placement.category === "kitchen") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="10" className="furniture-placement-shape" />
        <line x1={geometry.x + geometry.width * 0.3} y1={geometry.y + 4} x2={geometry.x + geometry.width * 0.3} y2={geometry.y + geometry.height - 4} className="furniture-detail-line" />
        <circle cx={geometry.x + geometry.width * 0.72} cy={centerY} r="10" className="furniture-detail-light" />
      </>
    );
  }

  if (placement.category === "lighting") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="10" className="furniture-placement-shape" />
        {[0.25, 0.5, 0.75].map((part) => (
          <circle key={part} cx={geometry.x + geometry.width * part} cy={centerY} r="6" className="furniture-detail-light" />
        ))}
      </>
    );
  }

  return <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="12" className="furniture-placement-shape" />;
}

function PlacedFurniture({ placement, room, orderInRoom }: { placement: FurniturePlacement; room: Room; orderInRoom: number }) {
  const geometry = getFurnitureGeometry(room, placement, orderInRoom);
  const centerX = geometry.x + geometry.width / 2;
  const centerY = geometry.y + geometry.height / 2;
  const rotate = geometry.rotate ? `rotate(${geometry.rotate} ${centerX} ${centerY})` : undefined;

  return (
    <g className={`furniture-placement furniture-placement-${placement.category}`} transform={rotate}>
      <title>{placement.title}</title>
      <FurnitureIcon placement={placement} geometry={geometry} />
      <text x={centerX} y={centerY + 4} textAnchor="middle" className="furniture-placement-label">
        {geometry.label}
      </text>
    </g>
  );
}

export function ApartmentPlan({ rooms, selectedRoomId, onRoomSelect, furniturePlacements = [] }: ApartmentPlanProps) {
  const doors = buildDoorOpenings(rooms);

  return (
    <div className="plan-shell">
      <svg viewBox="0 0 785 600" role="img" aria-label="Интерактивная планировка квартиры" className="apartment-plan">
        <rect x="34" y="34" width="720" height="530" rx="26" className="plan-bg" />
        {rooms.map((room) => {
          const selected = selectedRoomId === room.id;
          return (
            <g
              key={room.id}
              className="room-group"
              role="button"
              tabIndex={0}
              aria-label={`${room.name}, ${room.area} м²`}
              onMouseEnter={() => onRoomSelect(room.id)}
              onFocus={() => onRoomSelect(room.id)}
              onClick={() => onRoomSelect(room.id)}
              onPointerDown={() => onRoomSelect(room.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onRoomSelect(room.id);
                }
              }}
            >
              <polygon
                points={room.polygon}
                className={`room-zone room-${room.type} ${selected ? "room-selected" : ""}`}
              />
              <text x={room.labelX} y={room.labelY} textAnchor="middle" className="room-label">
                {room.name}
              </text>
              <text x={room.labelX} y={room.labelY + 22} textAnchor="middle" className="room-area">
                {room.area} м²
              </text>
            </g>
          );
        })}
        <g className="furniture-placement-layer" aria-label="Размещенная мебель">
          {furniturePlacements.map((placement) => {
            const room = rooms.find((item) => item.id === placement.roomId);
            if (!room) return null;
            const orderInRoom = furniturePlacements
              .filter((item) => item.roomId === placement.roomId)
              .findIndex((item) => item.id === placement.id);

            return <PlacedFurniture key={placement.id} placement={placement} room={room} orderInRoom={orderInRoom} />;
          })}
        </g>
        <g className="door-layer" aria-hidden="true">
          {doors.map((door) => (
            <Door key={door.id} door={door} />
          ))}
        </g>
        <path d="M70 220 L70 180 Q70 70 180 70 L225 70" className="outer-wall" />
        <path d="M715 300 L715 530 L70 530 L70 390" className="outer-wall" />
      </svg>
    </div>
  );
}
