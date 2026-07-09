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
type DoorOpening = { id: string; roomId: string; side: DoorSide; x: number; y: number; size: number };
type FurnitureGeometry = { x: number; y: number; width: number; height: number; label: string; rotate?: number };

const CLEARANCE = 18;

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
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function overlapCenter(aMin: number, aMax: number, bMin: number, bMax: number, fallback: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return max > min ? (min + max) / 2 : fallback;
}


function touching(a: number, b: number) {
  return Math.abs(a - b) <= 3;
}

function overlapRange(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { min, max, size: Math.max(0, max - min), center: (min + max) / 2 };
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("--");
}

function sharedDoorFromRoom(room: Room, neighbor: Room): Omit<DoorOpening, "id" | "roomId" | "size"> | null {
  const roomBounds = getBounds(room);
  const neighborBounds = getBounds(neighbor);
  const verticalOverlap = overlapRange(roomBounds.minY, roomBounds.maxY, neighborBounds.minY, neighborBounds.maxY);
  const horizontalOverlap = overlapRange(roomBounds.minX, roomBounds.maxX, neighborBounds.minX, neighborBounds.maxX);
  const minOverlap = 34;

  if (touching(roomBounds.minX, neighborBounds.maxX) && verticalOverlap.size >= minOverlap) {
    return {
      side: "left",
      x: roomBounds.minX,
      y: clamp(verticalOverlap.center, roomBounds.minY + 32, roomBounds.maxY - 32)
    };
  }

  if (touching(roomBounds.maxX, neighborBounds.minX) && verticalOverlap.size >= minOverlap) {
    return {
      side: "right",
      x: roomBounds.maxX,
      y: clamp(verticalOverlap.center, roomBounds.minY + 32, roomBounds.maxY - 32)
    };
  }

  if (touching(roomBounds.minY, neighborBounds.maxY) && horizontalOverlap.size >= minOverlap) {
    return {
      side: "top",
      x: clamp(horizontalOverlap.center, roomBounds.minX + 32, roomBounds.maxX - 32),
      y: roomBounds.minY
    };
  }

  if (touching(roomBounds.maxY, neighborBounds.minY) && horizontalOverlap.size >= minOverlap) {
    return {
      side: "bottom",
      x: clamp(horizontalOverlap.center, roomBounds.minX + 32, roomBounds.maxX - 32),
      y: roomBounds.maxY
    };
  }

  return null;
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

function findBestAdjacentRoom(room: Room, rooms: Room[], usedPairs: Set<string>) {
  let best: { room: Room; score: number } | undefined;

  for (const candidate of rooms) {
    if (candidate.id === room.id || usedPairs.has(pairKey(room.id, candidate.id))) continue;

    const door = sharedDoorFromRoom(room, candidate);
    if (!door) continue;

    let score = 10;
    if (candidate.type === "hall") score += 1000;
    if (room.type === "balcony" && ["kitchen", "living", "bedroom", "children"].includes(candidate.type)) score += 700;
    if (["kitchen", "living"].includes(candidate.type)) score += 220;
    if (["bedroom", "children"].includes(candidate.type)) score += 80;
    if (candidate.type === "bathroom") score -= 250;

    if (!best || score > best.score) best = { room: candidate, score };
  }

  return best?.room;
}

function getFacingDoor(roomBounds: Bounds, targetBounds: Bounds): Omit<DoorOpening, "id" | "roomId" | "size"> {
  const dx = targetBounds.centerX - roomBounds.centerX;
  const dy = targetBounds.centerY - roomBounds.centerY;
  const side: DoorSide = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "bottom" : "top";

  if (side === "left" || side === "right") {
    return {
      side,
      x: side === "left" ? roomBounds.minX : roomBounds.maxX,
      y: clamp(
        overlapCenter(roomBounds.minY, roomBounds.maxY, targetBounds.minY, targetBounds.maxY, roomBounds.centerY),
        roomBounds.minY + 36,
        roomBounds.maxY - 36
      )
    };
  }

  return {
    side,
    x: clamp(
      overlapCenter(roomBounds.minX, roomBounds.maxX, targetBounds.minX, targetBounds.maxX, roomBounds.centerX),
      roomBounds.minX + 36,
      roomBounds.maxX - 36
    ),
    y: side === "top" ? roomBounds.minY : roomBounds.maxY
  };
}

function buildDoorOpenings(rooms: Room[]) {
  const hall = rooms.find((room) => room.type === "hall");
  const usedPairs = new Set<string>();
  const doors: DoorOpening[] = [];

  if (hall) {
    const hallBounds = getBounds(hall);
    const planBounds = getPlanBounds(rooms);
    let entrySide: DoorSide = "left";

    if (touching(hallBounds.minX, planBounds.minX)) entrySide = "left";
    else if (touching(hallBounds.maxX, planBounds.maxX)) entrySide = "right";
    else if (touching(hallBounds.maxY, planBounds.maxY)) entrySide = "bottom";
    else if (touching(hallBounds.minY, planBounds.minY)) entrySide = "top";

    doors.push({
      id: `${hall.id}-entry`,
      roomId: hall.id,
      side: entrySide,
      x: entrySide === "left" ? hallBounds.minX : entrySide === "right" ? hallBounds.maxX : hallBounds.centerX,
      y: entrySide === "top" ? hallBounds.minY : entrySide === "bottom" ? hallBounds.maxY : hallBounds.centerY,
      size: 48
    });

    for (const room of rooms) {
      if (room.id === hall.id || room.type === "balcony") continue;

      const door = sharedDoorFromRoom(room, hall);
      if (!door) continue;

      usedPairs.add(pairKey(room.id, hall.id));
      doors.push({
        id: `${room.id}-door`,
        roomId: room.id,
        ...door,
        size: room.type === "kitchen" || room.type === "living" ? 56 : 46
      });
    }
  }

  for (const room of rooms) {
    if (room.type !== "balcony") continue;

    const neighbor = findBestAdjacentRoom(room, rooms, usedPairs);
    if (!neighbor) continue;

    const door = sharedDoorFromRoom(room, neighbor);
    if (!door) continue;

    usedPairs.add(pairKey(room.id, neighbor.id));
    doors.push({
      id: `${room.id}-door`,
      roomId: room.id,
      ...door,
      size: 60
    });
  }

  for (const room of rooms) {
    if (room.type === "hall" || room.type === "balcony") continue;
    if (doors.some((door) => door.roomId === room.id)) continue;

    const neighbor = findBestAdjacentRoom(room, rooms, usedPairs);
    if (!neighbor) continue;

    const door = sharedDoorFromRoom(room, neighbor);
    if (!door) continue;

    usedPairs.add(pairKey(room.id, neighbor.id));
    doors.push({
      id: `${room.id}-door`,
      roomId: room.id,
      ...door,
      size: room.type === "kitchen" || room.type === "living" ? 56 : 46
    });
  }

  return doors;
}

function doorBlockRect(door: DoorOpening) {
  const half = door.size / 2;
  const depth = 62;

  if (door.side === "left") return { x: door.x - 4, y: door.y - half - CLEARANCE, width: depth, height: door.size + CLEARANCE * 2 };
  if (door.side === "right") return { x: door.x - depth + 4, y: door.y - half - CLEARANCE, width: depth, height: door.size + CLEARANCE * 2 };
  if (door.side === "top") return { x: door.x - half - CLEARANCE, y: door.y - 4, width: door.size + CLEARANCE * 2, height: depth };
  return { x: door.x - half - CLEARANCE, y: door.y - depth + 4, width: door.size + CLEARANCE * 2, height: depth };
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
  const m = 22;
  const offset = Math.min(orderInRoom * 12, 36);

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
    const x = clamp(slot.x, bounds.minX + 12, bounds.maxX - width - 12);
    const y = clamp(slot.y, bounds.minY + 12, bounds.maxY - height - 12);
    const rect = { x, y, width, height };

    if (!roomDoors.some((doorRect) => intersects(rect, doorRect))) return { x, y };
  }

  return {
    x: clamp(bounds.centerX - width / 2, bounds.minX + 12, bounds.maxX - width - 12),
    y: clamp(bounds.centerY - height / 2, bounds.minY + 12, bounds.maxY - height - 12)
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
          x: clamp(placement.manualX, bounds.minX + 12, bounds.maxX - size.width - 12),
          y: clamp(placement.manualY, bounds.minY + 12, bounds.maxY - size.height - 12)
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


function isRectangularRoom(room: Room) {
  return parsePolygon(room.polygon).length === 4;
}

function splitRoomName(name: string) {
  if (name.length <= 14) return [name];

  if (name.includes("-")) {
    const parts = name.split("-");
    return [parts[0], parts.slice(1).join("-")].filter(Boolean);
  }

  const words = name.split(/\s+/);
  if (words.length < 2) return [name];

  const middle = Math.ceil(words.length / 2);
  return [words.slice(0, middle).join(" "), words.slice(middle).join(" ")];
}

function RoomShape({ room, selected }: { room: Room; selected: boolean }) {
  const bounds = getBounds(room);
  const className = `room-zone room-${room.type} ${selected ? "room-selected" : ""}`;

  if (isRectangularRoom(room)) {
    return (
      <rect
        x={bounds.minX}
        y={bounds.minY}
        width={bounds.maxX - bounds.minX}
        height={bounds.maxY - bounds.minY}
        rx="16"
        ry="16"
        className={className}
      />
    );
  }

  return <polygon points={room.polygon} className={className} />;
}

function RoomLabel({ room }: { room: Room }) {
  const bounds = getBounds(room);
  const lines = splitRoomName(room.name);
  const startY = bounds.centerY - (lines.length > 1 ? 12 : 4);

  return (
    <text x={bounds.centerX} y={startY} textAnchor="middle" className="room-label">
      {lines.map((line, index) => (
        <tspan key={`${room.id}-${index}`} x={bounds.centerX} dy={index === 0 ? 0 : 18}>
          {line}
        </tspan>
      ))}
      <tspan x={bounds.centerX} dy="22" className="room-area">
        {room.area} м²
      </tspan>
    </text>
  );
}

function Door({ door }: { door: DoorOpening }) {
  const half = door.size / 2;
  const swing = Math.min(door.size * 0.86, 42);
  const gapStroke = "#fffaf2";
  const lineStroke = "#3f362c";
  const swingStroke = "rgba(63, 54, 44, 0.45)";

  if (door.side === "left") {
    const hingeY = door.y - half;
    return (
      <g className="door-opening" pointerEvents="none">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke={gapStroke} strokeWidth="9" strokeLinecap="round" />
        <line x1={door.x} y1={hingeY} x2={door.x + swing} y2={hingeY + swing} stroke={lineStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x + swing * 0.78} ${hingeY + swing * 0.16} ${door.x + swing} ${hingeY + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  if (door.side === "right") {
    const hingeY = door.y - half;
    return (
      <g className="door-opening" pointerEvents="none">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke={gapStroke} strokeWidth="9" strokeLinecap="round" />
        <line x1={door.x} y1={hingeY} x2={door.x - swing} y2={hingeY + swing} stroke={lineStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x - swing * 0.78} ${hingeY + swing * 0.16} ${door.x - swing} ${hingeY + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  if (door.side === "top") {
    const hingeX = door.x - half;
    return (
      <g className="door-opening" pointerEvents="none">
        <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke={gapStroke} strokeWidth="9" strokeLinecap="round" />
        <line x1={hingeX} y1={door.y} x2={hingeX + swing} y2={door.y + swing} stroke={lineStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d={`M ${hingeX} ${door.y} Q ${hingeX + swing * 0.16} ${door.y + swing * 0.78} ${hingeX + swing} ${door.y + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  const hingeX = door.x - half;
  return (
    <g className="door-opening" pointerEvents="none">
      <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke={gapStroke} strokeWidth="9" strokeLinecap="round" />
      <line x1={hingeX} y1={door.y} x2={hingeX + swing} y2={door.y - swing} stroke={lineStroke} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d={`M ${hingeX} ${door.y} Q ${hingeX + swing * 0.16} ${door.y - swing * 0.78} ${hingeX + swing} ${door.y - swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
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
        clamp(next.x - offsetX, bounds.minX + 12, bounds.maxX - geometry.width - 12),
        clamp(next.y - offsetY, bounds.minY + 12, bounds.maxY - geometry.height - 12)
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
        <title>{placement.title}. Зажмите и перетащите. Повернуть можно кнопкой под планировкой.</title>

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

  return (
    <div className="plan-shell plan-shell-redesigned">
      <svg viewBox="0 0 785 600" role="img" aria-label="Интерактивная планировка квартиры" className="apartment-plan apartment-plan-redesigned">
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
              <RoomShape room={room} selected={selected} />
              <RoomLabel room={room} />
            </g>
          );
        })}

        <g className="door-layer" aria-hidden="true">
          {doors.map((door) => (
            <Door key={door.id} door={door} />
          ))}
        </g>

        <g className="furniture-placement-layer" aria-label="Размещенная мебель">
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
