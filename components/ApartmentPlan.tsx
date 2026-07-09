"use client";

import { useMemo } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { Room } from "@/types/apartment";
import type { FurniturePlacement } from "@/types/furniture-placement";

type ApartmentPlanProps = {
  rooms: Room[];
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
  furniturePlacements?: FurniturePlacement[];
  onFurnitureManualMove?: (placementId: string, x: number, y: number) => void;
};

type Point = { x: number; y: number };
type Bounds = { minX: number; minY: number; maxX: number; maxY: number; centerX: number; centerY: number };
type DoorSide = "left" | "right" | "top" | "bottom";
type DoorKind = "entry" | "room" | "balcony";
type DoorOpening = {
  id: string;
  roomId: string;
  side: DoorSide;
  x: number;
  y: number;
  size: number;
  kind: DoorKind;
};
type WindowOpening = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};
type FurnitureGeometry = { x: number; y: number; width: number; height: number; label: string; rotate?: number };

const EPS = 3;
const MIN_SHARED = 34;

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

function getPlanBounds(rooms: Room[]): Bounds {
  const bounds = rooms.map(getBounds);
  const minX = Math.min(...bounds.map((item) => item.minX));
  const minY = Math.min(...bounds.map((item) => item.minY));
  const maxX = Math.max(...bounds.map((item) => item.maxX));
  const maxY = Math.max(...bounds.map((item) => item.maxY));

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
  return Math.abs(a - b) <= EPS;
}

function overlapRange(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { size: Math.max(0, max - min), center: (min + max) / 2 };
}

function sharedDoor(room: Room, neighbor: Room, size = 46): Omit<DoorOpening, "id" | "roomId" | "kind"> | null {
  const a = getBounds(room);
  const b = getBounds(neighbor);
  const v = overlapRange(a.minY, a.maxY, b.minY, b.maxY);
  const h = overlapRange(a.minX, a.maxX, b.minX, b.maxX);

  if (touching(a.minX, b.maxX) && v.size >= MIN_SHARED) {
    return { side: "left", x: a.minX, y: clamp(v.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, Math.max(34, v.size - 18)) };
  }

  if (touching(a.maxX, b.minX) && v.size >= MIN_SHARED) {
    return { side: "right", x: a.maxX, y: clamp(v.center, a.minY + 28, a.maxY - 28), size: clamp(size, 34, Math.max(34, v.size - 18)) };
  }

  if (touching(a.minY, b.maxY) && h.size >= MIN_SHARED) {
    return { side: "top", x: clamp(h.center, a.minX + 28, a.maxX - 28), y: a.minY, size: clamp(size, 34, Math.max(34, h.size - 18)) };
  }

  if (touching(a.maxY, b.minY) && h.size >= MIN_SHARED) {
    return { side: "bottom", x: clamp(h.center, a.minX + 28, a.maxX - 28), y: a.maxY, size: clamp(size, 34, Math.max(34, h.size - 18)) };
  }

  return null;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("--");
}

function buildDoorOpenings(rooms: Room[]) {
  const hall = rooms.find((room) => room.type === "hall");
  const doors: DoorOpening[] = [];
  const usedPairs = new Set<string>();
  const planBounds = getPlanBounds(rooms);

  if (hall) {
    const hallBounds = getBounds(hall);
    const sideScores = [
      { side: "left" as DoorSide, value: touching(hallBounds.minX, planBounds.minX) ? 1 : 0 },
      { side: "right" as DoorSide, value: touching(hallBounds.maxX, planBounds.maxX) ? 1 : 0 },
      { side: "top" as DoorSide, value: touching(hallBounds.minY, planBounds.minY) ? 1 : 0 },
      { side: "bottom" as DoorSide, value: touching(hallBounds.maxY, planBounds.maxY) ? 1 : 0 }
    ].sort((a, b) => b.value - a.value);

    const entrySide = sideScores[0]?.value ? sideScores[0].side : "left";

    doors.push({
      id: `${hall.id}-entry`,
      roomId: hall.id,
      kind: "entry",
      side: entrySide,
      x: entrySide === "left" ? hallBounds.minX : entrySide === "right" ? hallBounds.maxX : hallBounds.centerX,
      y: entrySide === "top" ? hallBounds.minY : entrySide === "bottom" ? hallBounds.maxY : hallBounds.centerY,
      size: 48
    });

    for (const room of rooms) {
      if (room.id === hall.id || room.type === "balcony") continue;
      const door = sharedDoor(room, hall, room.type === "kitchen" || room.type === "living" ? 54 : 44);
      if (!door) continue;

      usedPairs.add(pairKey(room.id, hall.id));
      doors.push({
        id: `${room.id}-to-hall`,
        roomId: room.id,
        kind: "room",
        ...door
      });
    }
  }

  for (const room of rooms) {
    if (room.type !== "balcony") continue;

    const preferred = rooms
      .filter((neighbor) => neighbor.id !== room.id && !usedPairs.has(pairKey(room.id, neighbor.id)))
      .map((neighbor) => ({ neighbor, door: sharedDoor(room, neighbor, 58) }))
      .filter((item): item is { neighbor: Room; door: Omit<DoorOpening, "id" | "roomId" | "kind"> } => Boolean(item.door))
      .sort((a, b) => {
        const scoreA = a.neighbor.type === "kitchen" || a.neighbor.type === "living" ? 3 : a.neighbor.type === "bedroom" || a.neighbor.type === "children" ? 2 : 1;
        const scoreB = b.neighbor.type === "kitchen" || b.neighbor.type === "living" ? 3 : b.neighbor.type === "bedroom" || b.neighbor.type === "children" ? 2 : 1;
        return scoreB - scoreA;
      })[0];

    if (!preferred) continue;

    usedPairs.add(pairKey(room.id, preferred.neighbor.id));
    doors.push({
      id: `${room.id}-balcony-door`,
      roomId: room.id,
      kind: "balcony",
      ...preferred.door
    });
  }

  return doors;
}

function buildWindowOpenings(rooms: Room[]) {
  const planBounds = getPlanBounds(rooms);
  const windows: WindowOpening[] = [];

  for (const room of rooms) {
    if (room.type === "hall" || room.type === "bathroom" || room.type === "wardrobe") continue;

    const b = getBounds(room);
    const horizontalSize = clamp((b.maxX - b.minX) * 0.42, 46, 112);
    const verticalSize = clamp((b.maxY - b.minY) * 0.42, 46, 112);

    if (touching(b.minY, planBounds.minY)) {
      windows.push({ id: `${room.id}-window-top`, x1: b.centerX - horizontalSize / 2, y1: b.minY, x2: b.centerX + horizontalSize / 2, y2: b.minY });
    } else if (touching(b.maxY, planBounds.maxY)) {
      windows.push({ id: `${room.id}-window-bottom`, x1: b.centerX - horizontalSize / 2, y1: b.maxY, x2: b.centerX + horizontalSize / 2, y2: b.maxY });
    } else if (touching(b.minX, planBounds.minX)) {
      windows.push({ id: `${room.id}-window-left`, x1: b.minX, y1: b.centerY - verticalSize / 2, x2: b.minX, y2: b.centerY + verticalSize / 2 });
    } else if (touching(b.maxX, planBounds.maxX)) {
      windows.push({ id: `${room.id}-window-right`, x1: b.maxX, y1: b.centerY - verticalSize / 2, x2: b.maxX, y2: b.centerY + verticalSize / 2 });
    }
  }

  return windows;
}

function doorBlockRect(door: DoorOpening) {
  const half = door.size / 2;
  const depth = 58;

  if (door.side === "left") return { x: door.x - 8, y: door.y - half - 18, width: depth, height: door.size + 36 };
  if (door.side === "right") return { x: door.x - depth + 8, y: door.y - half - 18, width: depth, height: door.size + 36 };
  if (door.side === "top") return { x: door.x - half - 18, y: door.y - 8, width: door.size + 36, height: depth };
  return { x: door.x - half - 18, y: door.y - depth + 8, width: door.size + 36, height: depth };
}

function intersects(a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
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
      return "Декор";
    default:
      return placement.title.slice(0, 12);
  }
}

function getFurnitureSize(bounds: Bounds, placement: FurniturePlacement) {
  const roomWidth = bounds.maxX - bounds.minX;
  const roomHeight = bounds.maxY - bounds.minY;

  switch (placement.category) {
    case "bed":
      return { width: clamp(roomWidth * 0.48, 90, 150), height: clamp(roomHeight * 0.3, 52, 88) };
    case "sofa":
      return { width: clamp(roomWidth * 0.52, 88, 165), height: clamp(roomHeight * 0.22, 38, 68) };
    case "table": {
      const size = clamp(Math.min(roomWidth, roomHeight) * 0.28, 46, 72);
      return { width: size, height: size };
    }
    case "storage":
      return { width: clamp(roomWidth * 0.34, 62, 118), height: clamp(roomHeight * 0.18, 34, 56) };
    case "kitchen":
      return { width: clamp(roomWidth * 0.62, 118, 218), height: clamp(roomHeight * 0.18, 34, 56) };
    case "bathroom":
      return { width: clamp(roomWidth * 0.44, 52, 96), height: clamp(roomHeight * 0.22, 32, 54) };
    case "lighting":
      return { width: clamp(roomWidth * 0.54, 76, 170), height: 20 };
    default:
      return { width: 82, height: 44 };
  }
}

function candidateSlots(bounds: Bounds, width: number, height: number, category: FurniturePlacement["category"], orderInRoom: number) {
  const m = 24;
  const offset = Math.min(orderInRoom * 12, 34);

  if (category === "storage" || category === "kitchen" || category === "bathroom") {
    return [
      { x: bounds.minX + m, y: bounds.minY + m },
      { x: bounds.maxX - width - m, y: bounds.minY + m },
      { x: bounds.minX + m, y: bounds.maxY - height - m },
      { x: bounds.maxX - width - m, y: bounds.maxY - height - m },
      { x: bounds.centerX - width / 2, y: bounds.minY + m }
    ].map((slot) => ({ x: slot.x + offset, y: slot.y + offset }));
  }

  return [
    { x: bounds.minX + m, y: bounds.maxY - height - m },
    { x: bounds.maxX - width - m, y: bounds.maxY - height - m },
    { x: bounds.maxX - width - m, y: bounds.minY + m },
    { x: bounds.minX + m, y: bounds.minY + m },
    { x: bounds.centerX - width / 2, y: bounds.centerY - height / 2 }
  ].map((slot) => ({ x: slot.x + offset, y: slot.y + offset }));
}

function safePosition(bounds: Bounds, doors: DoorOpening[], width: number, height: number, placement: FurniturePlacement, orderInRoom: number) {
  const roomDoors = doors.filter((door) => door.roomId === placement.roomId).map(doorBlockRect);
  const slots = candidateSlots(bounds, width, height, placement.category, orderInRoom);
  const variant = placement.layoutVariant ?? 0;
  const orderedSlots = [...slots.slice(variant % slots.length), ...slots.slice(0, variant % slots.length)];

  for (const slot of orderedSlots) {
    const x = clamp(slot.x, bounds.minX + 14, bounds.maxX - width - 14);
    const y = clamp(slot.y, bounds.minY + 14, bounds.maxY - height - 14);
    const rect = { x, y, width, height };

    if (!roomDoors.some((doorRect) => intersects(rect, doorRect))) return { x, y };
  }

  return {
    x: clamp(bounds.centerX - width / 2, bounds.minX + 14, bounds.maxX - width - 14),
    y: clamp(bounds.centerY - height / 2, bounds.minY + 14, bounds.maxY - height - 14)
  };
}

function getFurnitureGeometry(room: Room, placement: FurniturePlacement, orderInRoom: number, doors: DoorOpening[]): FurnitureGeometry {
  const bounds = getBounds(room);
  let size = getFurnitureSize(bounds, placement);

  if (placement.category === "bed" && (placement.layoutVariant ?? 0) % 2 === 1) {
    size = {
      width: Math.min(size.height * 1.2, bounds.maxX - bounds.minX - 34),
      height: Math.min(size.width * 0.78, bounds.maxY - bounds.minY - 34)
    };
  }

  const position =
    typeof placement.manualX === "number" && typeof placement.manualY === "number"
      ? {
          x: clamp(placement.manualX, bounds.minX + 14, bounds.maxX - size.width - 14),
          y: clamp(placement.manualY, bounds.minY + 14, bounds.maxY - size.height - 14)
        }
      : safePosition(bounds, doors, size.width, size.height, placement, orderInRoom);

  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
    label: getPlacementLabel(placement),
    rotate: placement.manualRotation ?? (placement.category === "lighting" && (placement.layoutVariant ?? 0) % 2 === 1 ? 90 : 0)
  };
}

function splitRoomName(name: string) {
  if (name.length <= 15) return [name];

  const parts = name.split(/[\s-]+/).filter(Boolean);
  if (parts.length <= 1) return [name];

  const middle = Math.ceil(parts.length / 2);
  return [parts.slice(0, middle).join(" "), parts.slice(middle).join(" ")];
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

function RoomLabel({ room }: { room: Room }) {
  const bounds = getBounds(room);
  const lines = splitRoomName(room.name);
  const y = bounds.centerY - (lines.length > 1 ? 10 : 0);

  return (
    <text
      x={bounds.centerX}
      y={y}
      textAnchor="middle"
      fill="#2d2922"
      fontSize="18"
      fontWeight="950"
      style={{
        paintOrder: "stroke",
        stroke: "rgba(255, 253, 248, 0.96)",
        strokeWidth: 4,
        strokeLinejoin: "round",
        pointerEvents: "none"
      }}
    >
      {lines.map((line, index) => (
        <tspan key={`${room.id}-${line}`} x={bounds.centerX} dy={index === 0 ? 0 : 18}>
          {line}
        </tspan>
      ))}
      <tspan x={bounds.centerX} dy="22" fill="#003BA6" fontSize="14" fontWeight="900">
        {room.area} м²
      </tspan>
    </text>
  );
}

function Door({ door }: { door: DoorOpening }) {
  const half = door.size / 2;

  if (door.side === "left" || door.side === "right") {
    return (
      <g pointerEvents="none">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke="#fffdf8" strokeWidth="17" strokeLinecap="round" />
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke="rgba(63,54,44,0.48)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8" />
      </g>
    );
  }

  return (
    <g pointerEvents="none">
      <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke="#fffdf8" strokeWidth="17" strokeLinecap="round" />
      <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke="rgba(63,54,44,0.48)" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 8" />
    </g>
  );
}

function WindowLine({ window }: { window: WindowOpening }) {
  return (
    <g pointerEvents="none">
      <line x1={window.x1} y1={window.y1} x2={window.x2} y2={window.y2} stroke="#fffdf8" strokeWidth="15" strokeLinecap="round" />
      <line x1={window.x1} y1={window.y1} x2={window.x2} y2={window.y2} stroke="#8fc5ec" strokeWidth="6" strokeLinecap="round" />
    </g>
  );
}

function FurnitureIcon({ placement, geometry }: { placement: FurniturePlacement; geometry: FurnitureGeometry }) {
  const centerX = geometry.x + geometry.width / 2;
  const centerY = geometry.y + geometry.height / 2;

  if (placement.category === "table") {
    return <ellipse cx={centerX} cy={centerY} rx={geometry.width / 2} ry={geometry.height / 2} className="furniture-placement-shape" />;
  }

  if (placement.category === "bed") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="14" className="furniture-placement-shape" />
        <rect x={geometry.x + 8} y={geometry.y + 8} width={geometry.width - 16} height="14" rx="7" className="furniture-detail-light" />
      </>
    );
  }

  if (placement.category === "sofa") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y + 8} width={geometry.width} height={geometry.height - 8} rx="14" className="furniture-placement-shape" />
        <rect x={geometry.x + 8} y={geometry.y} width={geometry.width - 16} height="18" rx="9" className="furniture-detail-light" />
      </>
    );
  }

  if (placement.category === "storage") {
    return (
      <>
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="10" className="furniture-placement-shape" />
        <line x1={centerX} y1={geometry.y + 6} x2={centerX} y2={geometry.y + geometry.height - 6} className="furniture-detail-line" />
      </>
    );
  }

  return <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx="12" className="furniture-placement-shape" />;
}

function pointFromSvg(event: ReactPointerEvent<SVGElement>, svg: SVGSVGElement) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(matrix.inverse());
}

function PlacedFurniture({
  placement,
  room,
  orderInRoom,
  doors,
  onManualMove
}: {
  placement: FurniturePlacement;
  room: Room;
  orderInRoom: number;
  doors: DoorOpening[];
  onManualMove?: (placementId: string, x: number, y: number) => void;
}) {
  const geometry = getFurnitureGeometry(room, placement, orderInRoom, doors);
  const centerX = geometry.x + geometry.width / 2;
  const centerY = geometry.y + geometry.height / 2;
  const rotate = geometry.rotate ? `rotate(${geometry.rotate} ${centerX} ${centerY})` : undefined;

  function onPointerDown(event: ReactPointerEvent<SVGGElement>) {
    if (!onManualMove || event.button > 0) return;

    event.preventDefault();
    event.stopPropagation();

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // На некоторых мобильных браузерах capture может быть недоступен.
    }

    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;

    const start = pointFromSvg(event, svg);
    if (!start) return;

    const bounds = getBounds(room);
    const offsetX = start.x - geometry.x;
    const offsetY = start.y - geometry.y;

    document.body.classList.add("is-dragging-furniture");

    const moveToClientPoint = (clientX: number, clientY: number) => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;

      const point = svg.createSVGPoint();
      point.x = clientX;
      point.y = clientY;
      const next = point.matrixTransform(matrix.inverse());

      onManualMove(
        placement.id,
        clamp(next.x - offsetX, bounds.minX + 14, bounds.maxX - geometry.width - 14),
        clamp(next.y - offsetY, bounds.minY + 14, bounds.maxY - geometry.height - 14)
      );
    };

    const onMove = (moveEvent: PointerEvent) => {
      moveEvent.preventDefault();
      moveToClientPoint(moveEvent.clientX, moveEvent.clientY);
    };

    const onUp = () => {
      document.body.classList.remove("is-dragging-furniture");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp, { once: true });
    window.addEventListener("pointercancel", onUp, { once: true });
  }

  return (
    <g className={`furniture-placement furniture-placement-${placement.category}`} onPointerDown={onPointerDown}>
      <g transform={rotate} style={{ cursor: onManualMove ? "grab" : "default", touchAction: "none" }}>
        <rect
          x={geometry.x - 12}
          y={geometry.y - 12}
          width={geometry.width + 24}
          height={geometry.height + 24}
          rx="16"
          fill="transparent"
          pointerEvents="all"
          className="furniture-drag-hitbox"
        />
        <FurnitureIcon placement={placement} geometry={geometry} />
      </g>

      <text x={centerX} y={centerY + 4} textAnchor="middle" className="furniture-placement-label">
        {geometry.label}
      </text>
    </g>
  );
}

export function ApartmentPlan({
  rooms,
  selectedRoomId,
  onRoomSelect,
  furniturePlacements = [],
  onFurnitureManualMove
}: ApartmentPlanProps) {
  const doors = useMemo(() => buildDoorOpenings(rooms), [rooms]);
  const windows = useMemo(() => buildWindowOpenings(rooms), [rooms]);
  const planBounds = useMemo(() => getPlanBounds(rooms), [rooms]);

  return (
    <div
      className="plan-shell"
      style={{
        overflow: "hidden",
        border: "1px solid rgba(0, 59, 166, 0.14)",
        borderRadius: 32,
        background: "#fffdf8",
        boxShadow: "0 22px 70px rgba(0, 59, 166, 0.10)"
      }}
    >
      <svg
        viewBox="0 0 785 600"
        role="img"
        aria-label="Интерактивная планировка квартиры"
        className="apartment-plan"
        style={{ display: "block", width: "100%", minHeight: 560, background: "#fffdf8" }}
      >
        <rect x="34" y="34" width="720" height="530" rx="28" fill="#fffdf8" stroke="rgba(0, 59, 166, 0.14)" strokeWidth="2" />

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
                fill={selected ? "rgba(249, 62, 62, 0.14)" : roomFill(room.type)}
                stroke={selected ? "#F93E3E" : "#c9ba9a"}
                strokeWidth="4"
                strokeLinejoin="round"
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}

        <rect
          x={planBounds.minX}
          y={planBounds.minY}
          width={planBounds.maxX - planBounds.minX}
          height={planBounds.maxY - planBounds.minY}
          fill="none"
          stroke="#3f362c"
          strokeWidth="8"
          strokeLinejoin="round"
          pointerEvents="none"
        />

        <g aria-hidden="true">
          {windows.map((window) => (
            <WindowLine key={window.id} window={window} />
          ))}
        </g>

        <g aria-hidden="true">
          {doors.map((door) => (
            <Door key={door.id} door={door} />
          ))}
        </g>

        {rooms.map((room) => (
          <RoomLabel key={`${room.id}-label`} room={room} />
        ))}

        <g aria-label="Размещенная мебель">
          {furniturePlacements.map((placement) => {
            const room = rooms.find((item) => item.id === placement.roomId);
            if (!room) return null;

            const orderInRoom = furniturePlacements
              .filter((item) => item.roomId === placement.roomId)
              .findIndex((item) => item.id === placement.id);

            return (
              <PlacedFurniture
                key={placement.id}
                placement={placement}
                room={room}
                orderInRoom={orderInRoom}
                doors={doors}
                onManualMove={onFurnitureManualMove}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
