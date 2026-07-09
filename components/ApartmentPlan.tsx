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

type LayoutRoom = Room & {
  visualX: number;
  visualY: number;
  visualWidth: number;
  visualHeight: number;
  visualLabelX: number;
  visualLabelY: number;
};

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

const PLAN = {
  x: 56,
  y: 56,
  width: 672,
  height: 488
};

const GAP = 0;

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function getBounds(room: LayoutRoom): Bounds {
  const minX = room.visualX;
  const minY = room.visualY;
  const maxX = room.visualX + room.visualWidth;
  const maxY = room.visualY + room.visualHeight;

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function byAreaDesc(a: Room, b: Room) {
  return b.area - a.area;
}

function pickRoom(rooms: Room[], types: Room["type"][]) {
  return rooms.find((room) => types.includes(room.type));
}

function isLiving(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

function isKitchen(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "kitchen" || name.includes("кухн");
}

function isBalcony(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "balcony" || name.includes("лодж") || name.includes("балкон");
}

function isWet(room: Room) {
  return room.type === "bathroom" || room.name.toLowerCase().includes("сануз");
}

function isHall(room: Room) {
  return room.type === "hall" || room.name.toLowerCase().includes("прихож") || room.name.toLowerCase().includes("холл");
}

function isStorage(room: Room) {
  return room.type === "wardrobe" || room.name.toLowerCase().includes("гардер") || room.name.toLowerCase().includes("клад");
}

function isBedroomLike(room: Room) {
  const name = room.name.toLowerCase();
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск");
}

function layoutRoom(room: Room, x: number, y: number, width: number, height: number): LayoutRoom {
  return {
    ...room,
    visualX: x,
    visualY: y,
    visualWidth: width,
    visualHeight: height,
    visualLabelX: x + width / 2,
    visualLabelY: y + height / 2
  };
}

function makeSmartLayout(rooms: Room[]): LayoutRoom[] {
  const used = new Set<string>();
  const result: LayoutRoom[] = [];

  const hall = pickRoom(rooms, ["hall"]);
  const bathroom = pickRoom(rooms, ["bathroom"]);
  const balcony = rooms.find(isBalcony);
  const kitchen = rooms.find((room) => isKitchen(room) && !isLiving(room));
  const living = rooms.find((room) => isLiving(room) && !isKitchen(room));
  const kitchenLiving = rooms.find((room) => isKitchen(room) && isLiving(room));
  const storage = rooms.find(isStorage);
  const bedrooms = rooms.filter(isBedroomLike).sort(byAreaDesc);
  const otherRooms = rooms
    .filter(
      (room) =>
        !isHall(room) &&
        !isWet(room) &&
        !isBalcony(room) &&
        !isStorage(room) &&
        !isBedroomLike(room) &&
        room.id !== kitchen?.id &&
        room.id !== living?.id &&
        room.id !== kitchenLiving?.id
    )
    .sort(byAreaDesc);

  function add(room: Room | undefined, x: number, y: number, width: number, height: number) {
    if (!room || used.has(room.id)) return;
    used.add(room.id);
    result.push(layoutRoom(room, x, y, width, height));
  }

  const totalRooms = rooms.length;
  const bedroomsCount = bedrooms.length;

  if (totalRooms <= 5 && bedroomsCount <= 1) {
    const leftW = 170;
    const topH = 150;
    const balconyH = balcony ? 96 : 0;
    const mainTopW = balcony ? 360 : PLAN.width - leftW;
    const rightW = PLAN.width - leftW - mainTopW;

    add(bathroom, PLAN.x, PLAN.y, leftW, topH);
    add(hall, PLAN.x, PLAN.y + topH, leftW, 126);

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0] ?? bedrooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, mainTopW, balcony ? topH : 210);

    if (balcony) {
      add(balcony, PLAN.x + leftW + mainTopW, PLAN.y, rightW, topH);
    }

    const bedroom = bedrooms.find((room) => room.id !== mainRoom?.id) ?? bedrooms[0];
    add(bedroom, PLAN.x + leftW, PLAN.y + (balcony ? topH : 210), PLAN.width - leftW, PLAN.height - (balcony ? topH : 210));

    if (storage && !used.has(storage.id)) {
      add(storage, PLAN.x, PLAN.y + topH + 126, leftW, PLAN.height - topH - 126);
    }
  } else if (bedroomsCount <= 2) {
    const leftW = 168;
    const topH = 158;
    const midH = 172;
    const rightW = balcony ? 172 : 0;
    const mainW = PLAN.width - leftW - rightW;

    add(bathroom, PLAN.x, PLAN.y, leftW, topH);
    add(hall, PLAN.x, PLAN.y + topH, leftW, 132);

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, mainW, topH);

    if (balcony) {
      add(balcony, PLAN.x + leftW + mainW, PLAN.y, rightW, topH);
    }

    add(bedrooms[0], PLAN.x + leftW, PLAN.y + topH, Math.round(mainW * 0.54), midH);
    add(bedrooms[1], PLAN.x + leftW + Math.round(mainW * 0.54), PLAN.y + topH, mainW - Math.round(mainW * 0.54) + rightW, midH);

    add(storage, PLAN.x, PLAN.y + topH + 132, leftW, PLAN.height - topH - 132);
    const rest = otherRooms.find((room) => !used.has(room.id));
    add(rest, PLAN.x + leftW, PLAN.y + topH + midH, PLAN.width - leftW, PLAN.height - topH - midH);
  } else {
    const leftW = 168;
    const topH = 154;
    const midH = 166;
    const bottomH = PLAN.height - topH - midH;
    const usableW = PLAN.width - leftW;
    const colW = Math.round(usableW / 3);

    add(bathroom, PLAN.x, PLAN.y, leftW, Math.round(topH * 0.55));
    add(hall, PLAN.x, PLAN.y + Math.round(topH * 0.55), leftW, Math.round(topH * 0.7));
    add(storage, PLAN.x, PLAN.y + Math.round(topH * 1.25), leftW, PLAN.height - Math.round(topH * 1.25));

    const mainRoom = kitchenLiving ?? kitchen ?? living ?? otherRooms[0];
    add(mainRoom, PLAN.x + leftW, PLAN.y, colW * 2, topH);
    add(balcony, PLAN.x + leftW + colW * 2, PLAN.y, usableW - colW * 2, topH);

    add(bedrooms[0], PLAN.x + leftW, PLAN.y + topH, colW, midH);
    add(bedrooms[1], PLAN.x + leftW + colW, PLAN.y + topH, colW, midH);
    add(bedrooms[2], PLAN.x + leftW + colW * 2, PLAN.y + topH, usableW - colW * 2, midH);

    const bottomRooms = [...bedrooms.slice(3), ...otherRooms].filter((room) => !used.has(room.id));
    if (bottomRooms.length <= 1) {
      add(bottomRooms[0], PLAN.x + leftW, PLAN.y + topH + midH, usableW, bottomH);
    } else {
      const firstW = Math.round(usableW * 0.56);
      add(bottomRooms[0], PLAN.x + leftW, PLAN.y + topH + midH, firstW, bottomH);
      add(bottomRooms[1], PLAN.x + leftW + firstW, PLAN.y + topH + midH, usableW - firstW, bottomH);
    }
  }

  const remaining = rooms.filter((room) => !used.has(room.id));
  if (remaining.length > 0) {
    const slotW = Math.floor(PLAN.width / remaining.length);
    remaining.forEach((room, index) => {
      add(room, PLAN.x + slotW * index, PLAN.y + PLAN.height - 110, index === remaining.length - 1 ? PLAN.width - slotW * index : slotW, 110);
    });
  }

  return result;
}

function overlapRangeVisual(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { size: Math.max(0, max - min), center: (min + max) / 2 };
}

function sharedDoorVisual(room: LayoutRoom, neighbor: LayoutRoom, size = 46): Omit<DoorOpening, "id" | "roomId" | "kind"> | null {
  const a = getBounds(room);
  const b = getBounds(neighbor);
  const v = overlapRangeVisual(a.minY, a.maxY, b.minY, b.maxY);
  const h = overlapRangeVisual(a.minX, a.maxX, b.minX, b.maxX);

  if (Math.abs(a.minX - b.maxX) <= 1 && v.size >= 30) {
    return { side: "left", x: a.minX, y: clamp(v.center, a.minY + 30, a.maxY - 30), size: clamp(size, 34, v.size - 20) };
  }

  if (Math.abs(a.maxX - b.minX) <= 1 && v.size >= 30) {
    return { side: "right", x: a.maxX, y: clamp(v.center, a.minY + 30, a.maxY - 30), size: clamp(size, 34, v.size - 20) };
  }

  if (Math.abs(a.minY - b.maxY) <= 1 && h.size >= 30) {
    return { side: "top", x: clamp(h.center, a.minX + 30, a.maxX - 30), y: a.minY, size: clamp(size, 34, h.size - 20) };
  }

  if (Math.abs(a.maxY - b.minY) <= 1 && h.size >= 30) {
    return { side: "bottom", x: clamp(h.center, a.minX + 30, a.maxX - 30), y: a.maxY, size: clamp(size, 34, h.size - 20) };
  }

  return null;
}

function pairKey(a: string, b: string) {
  return [a, b].sort().join("--");
}

function buildDoorOpenings(layoutRooms: LayoutRoom[]) {
  const hall = layoutRooms.find(isHall);
  const doors: DoorOpening[] = [];
  const usedPairs = new Set<string>();

  if (hall) {
    const hallBounds = getBounds(hall);
    doors.push({
      id: `${hall.id}-entry`,
      roomId: hall.id,
      kind: "entry",
      side: "left",
      x: hallBounds.minX,
      y: hallBounds.centerY,
      size: 50
    });

    for (const room of layoutRooms) {
      if (room.id === hall.id || isBalcony(room)) continue;

      const door = sharedDoorVisual(room, hall, isKitchen(room) || isLiving(room) ? 54 : 44);
      if (!door) continue;

      usedPairs.add(pairKey(room.id, hall.id));
      doors.push({
        id: `${room.id}-hall-door`,
        roomId: room.id,
        kind: "room",
        ...door
      });
    }
  }

  for (const room of layoutRooms) {
    if (!isBalcony(room)) continue;

    const neighbors = layoutRooms
      .filter((neighbor) => neighbor.id !== room.id && !usedPairs.has(pairKey(room.id, neighbor.id)))
      .map((neighbor) => ({ neighbor, door: sharedDoorVisual(room, neighbor, 58) }))
      .filter((item): item is { neighbor: LayoutRoom; door: Omit<DoorOpening, "id" | "roomId" | "kind"> } => Boolean(item.door))
      .sort((a, b) => {
        const scoreA = isKitchen(a.neighbor) || isLiving(a.neighbor) ? 3 : isBedroomLike(a.neighbor) ? 2 : 1;
        const scoreB = isKitchen(b.neighbor) || isLiving(b.neighbor) ? 3 : isBedroomLike(b.neighbor) ? 2 : 1;
        return scoreB - scoreA;
      });

    const selected = neighbors[0];
    if (!selected) continue;

    usedPairs.add(pairKey(room.id, selected.neighbor.id));
    doors.push({
      id: `${room.id}-balcony-door`,
      roomId: room.id,
      kind: "balcony",
      ...selected.door
    });
  }

  return doors;
}

function buildWindowOpenings(layoutRooms: LayoutRoom[]) {
  const windows: WindowOpening[] = [];

  for (const room of layoutRooms) {
    if (isHall(room) || isWet(room) || isStorage(room)) continue;

    const b = getBounds(room);
    const horizontalSize = clamp((b.maxX - b.minX) * 0.42, 46, 112);
    const verticalSize = clamp((b.maxY - b.minY) * 0.42, 46, 112);

    if (Math.abs(b.minY - PLAN.y) <= 1) {
      windows.push({ id: `${room.id}-window-top`, x1: b.centerX - horizontalSize / 2, y1: b.minY, x2: b.centerX + horizontalSize / 2, y2: b.minY });
    } else if (Math.abs(b.maxY - (PLAN.y + PLAN.height)) <= 1) {
      windows.push({ id: `${room.id}-window-bottom`, x1: b.centerX - horizontalSize / 2, y1: b.maxY, x2: b.centerX + horizontalSize / 2, y2: b.maxY });
    } else if (Math.abs(b.maxX - (PLAN.x + PLAN.width)) <= 1) {
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

function getFurnitureGeometry(room: LayoutRoom, placement: FurniturePlacement, orderInRoom: number, doors: DoorOpening[]): FurnitureGeometry {
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

function roomFill(room: Room) {
  if (isKitchen(room) || isLiving(room)) return "#eef5fb";
  if (isBedroomLike(room)) return "#eef8ef";
  if (isWet(room)) return "#eef3fa";
  if (isHall(room)) return "#fff6e8";
  if (isBalcony(room)) return "#f2f7ff";
  if (isStorage(room)) return "#f7f1ff";
  return "#ffffff";
}

function RoomLabel({ room }: { room: LayoutRoom }) {
  const lines = splitRoomName(room.name);
  const y = room.visualLabelY - (lines.length > 1 ? 10 : 0);

  return (
    <text
      x={room.visualLabelX}
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
        <tspan key={`${room.id}-${line}`} x={room.visualLabelX} dy={index === 0 ? 0 : 18}>
          {line}
        </tspan>
      ))}
      <tspan x={room.visualLabelX} dy="22" fill="#003BA6" fontSize="14" fontWeight="900">
        {room.area} м²
      </tspan>
    </text>
  );
}

function Door({ door }: { door: DoorOpening }) {
  const half = door.size / 2;
  const swing = Math.min(door.size * 0.86, 42);
  const gapStroke = "#fffdf8";
  const lineStroke = "#3f362c";
  const swingStroke = "rgba(63, 54, 44, 0.45)";

  if (door.side === "left") {
    const hingeY = door.y - half;
    return (
      <g pointerEvents="none">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke={gapStroke} strokeWidth="13" strokeLinecap="round" />
        <line x1={door.x} y1={hingeY} x2={door.x + swing} y2={hingeY + swing} stroke={lineStroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x + swing * 0.78} ${hingeY + swing * 0.16} ${door.x + swing} ${hingeY + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  if (door.side === "right") {
    const hingeY = door.y - half;
    return (
      <g pointerEvents="none">
        <line x1={door.x} y1={door.y - half} x2={door.x} y2={door.y + half} stroke={gapStroke} strokeWidth="13" strokeLinecap="round" />
        <line x1={door.x} y1={hingeY} x2={door.x - swing} y2={hingeY + swing} stroke={lineStroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={`M ${door.x} ${hingeY} Q ${door.x - swing * 0.78} ${hingeY + swing * 0.16} ${door.x - swing} ${hingeY + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  if (door.side === "top") {
    const hingeX = door.x - half;
    return (
      <g pointerEvents="none">
        <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke={gapStroke} strokeWidth="13" strokeLinecap="round" />
        <line x1={hingeX} y1={door.y} x2={hingeX + swing} y2={door.y + swing} stroke={lineStroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={`M ${hingeX} ${door.y} Q ${hingeX + swing * 0.16} ${door.y + swing * 0.78} ${hingeX + swing} ${door.y + swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
      </g>
    );
  }

  const hingeX = door.x - half;
  return (
    <g pointerEvents="none">
      <line x1={door.x - half} y1={door.y} x2={door.x + half} y2={door.y} stroke={gapStroke} strokeWidth="13" strokeLinecap="round" />
      <line x1={hingeX} y1={door.y} x2={hingeX + swing} y2={door.y - swing} stroke={lineStroke} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d={`M ${hingeX} ${door.y} Q ${hingeX + swing * 0.16} ${door.y - swing * 0.78} ${hingeX + swing} ${door.y - swing}`} stroke={swingStroke} strokeWidth="2" fill="none" />
    </g>
  );
}

function WindowLine({ window }: { window: WindowOpening }) {
  return (
    <g pointerEvents="none">
      <line x1={window.x1} y1={window.y1} x2={window.x2} y2={window.y2} stroke="#fffdf8" strokeWidth="13" strokeLinecap="round" />
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
  room: LayoutRoom;
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
  const layoutRooms = useMemo(() => makeSmartLayout(rooms), [rooms]);
  const doors = useMemo(() => buildDoorOpenings(layoutRooms), [layoutRooms]);
  const windows = useMemo(() => buildWindowOpenings(layoutRooms), [layoutRooms]);

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

        {layoutRooms.map((room) => {
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
              <rect
                x={room.visualX}
                y={room.visualY}
                width={room.visualWidth}
                height={room.visualHeight}
                fill={selected ? "rgba(249, 62, 62, 0.14)" : roomFill(room)}
                stroke={selected ? "#F93E3E" : "#c9ba9a"}
                strokeWidth="4"
                style={{ cursor: "pointer" }}
              />
            </g>
          );
        })}

        <rect
          x={PLAN.x}
          y={PLAN.y}
          width={PLAN.width}
          height={PLAN.height}
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

        {layoutRooms.map((room) => (
          <RoomLabel key={`${room.id}-label`} room={room} />
        ))}

        <g aria-label="Размещенная мебель">
          {furniturePlacements.map((placement) => {
            const room = layoutRooms.find((item) => item.id === placement.roomId);
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
