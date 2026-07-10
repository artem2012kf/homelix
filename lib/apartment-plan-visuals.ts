import type { Room, RoomPlan } from "@/types/apartment";

export type VisualRoom = Room & {
  visualX: number;
  visualY: number;
  visualWidth: number;
  visualHeight: number;
  visualLabelX: number;
  visualLabelY: number;
};

export type VisualBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  centerX: number;
  centerY: number;
};

export type DoorSide = "left" | "right" | "top" | "bottom";

export type VisualDoor = {
  id: string;
  roomId: string;
  side: DoorSide;
  x: number;
  y: number;
  size: number;
  entry?: boolean;
};

export type VisualWindow = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind?: "window" | "glazing";
};

export type VisualFixtureKind =
  | "kitchen-counter"
  | "sink"
  | "hob"
  | "bath"
  | "shower"
  | "toilet"
  | "closet"
  | "column"
  | "shaft";

export type VisualFixture = {
  id: string;
  roomId?: string;
  kind: VisualFixtureKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotate?: number;
};

export const PLAN_FRAME = {
  x: 58,
  y: 58,
  width: 670,
  height: 480
} as const;

const WALL_EPSILON = 2;
const MIN_DOOR_OVERLAP = 42;
const DEFAULT_DOOR_SIZE = 46;

type Orientation = 0 | 1 | 2 | 3 | 4 | 5;
type Rect = { left: number; top: number; right: number; bottom: number };

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededUnit(key: string) {
  let value = hashString(key) || 1;
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function seededSigned(key: string) {
  return seededUnit(key) * 2 - 1;
}

function coordinateKey(value: number) {
  return value.toFixed(4);
}

function normalizedName(room: Room) {
  return room.name.toLowerCase().replace(/ё/g, "е");
}

export function isHall(room: Room) {
  const name = normalizedName(room);
  return room.type === "hall" || name.includes("прихож") || name.includes("холл") || name.includes("коридор");
}

export function isBathroom(room: Room) {
  const name = normalizedName(room);
  return room.type === "bathroom" || name.includes("сануз") || name.includes("ванн") || name.includes("душев");
}

export function isBalcony(room: Room) {
  const name = normalizedName(room);
  return room.type === "balcony" || name.includes("лодж") || name.includes("балкон") || name.includes("террас");
}

export function isStorage(room: Room) {
  const name = normalizedName(room);
  return room.type === "wardrobe" || name.includes("гардер") || name.includes("клад") || name.includes("постироч") || name.includes("шкаф-ниша");
}

export function isKitchen(room: Room) {
  return room.type === "kitchen" || normalizedName(room).includes("кухн");
}

export function isLiving(room: Room) {
  const name = normalizedName(room);
  return room.type === "living" || name.includes("гостин") || name.includes("жилая");
}

export function isBedroom(room: Room) {
  const name = normalizedName(room);
  return room.type === "bedroom" || room.type === "children" || name.includes("спаль") || name.includes("детск") || name.includes("кабинет");
}

function transformPoint(x: number, y: number, orientation: Orientation) {
  if (orientation === 1) return { x: 1 - x, y };
  if (orientation === 2) return { x, y: 1 - y };
  if (orientation === 3) return { x: 1 - x, y: 1 - y };
  if (orientation === 4) return { x: y, y: 1 - x };
  if (orientation === 5) return { x: 1 - y, y: x };
  return { x, y };
}

function transformPlan(plan: RoomPlan, orientation: Orientation): Rect {
  const left = (plan.x - PLAN_FRAME.x) / PLAN_FRAME.width;
  const top = (plan.y - PLAN_FRAME.y) / PLAN_FRAME.height;
  const right = (plan.x + plan.width - PLAN_FRAME.x) / PLAN_FRAME.width;
  const bottom = (plan.y + plan.height - PLAN_FRAME.y) / PLAN_FRAME.height;
  const points = [
    transformPoint(left, top, orientation),
    transformPoint(right, top, orientation),
    transformPoint(right, bottom, orientation),
    transformPoint(left, bottom, orientation)
  ];

  return {
    left: Math.min(...points.map((point) => point.x)),
    top: Math.min(...points.map((point) => point.y)),
    right: Math.max(...points.map((point) => point.x)),
    bottom: Math.max(...points.map((point) => point.y))
  };
}

function buildWarpMap(values: number[], start: number, end: number, seed: string) {
  const sorted = [...new Set(values.map((value) => Number(value.toFixed(4))))].sort((a, b) => a - b);
  const result = new Map<string, number>();

  if (sorted.length === 0) return result;
  if (sorted.length === 1) {
    result.set(coordinateKey(sorted[0]), start);
    return result;
  }

  const sourceStart = sorted[0];
  const sourceEnd = sorted[sorted.length - 1];
  const sourceSpan = Math.max(0.0001, sourceEnd - sourceStart);
  const targetSpan = end - start;
  const bendA = seededSigned(`${seed}:bend-a`) * Math.min(20, targetSpan * 0.035);
  const bendB = seededSigned(`${seed}:bend-b`) * Math.min(11, targetSpan * 0.022);
  const localAmplitude = Math.min(8, targetSpan * 0.014);
  const minimumGap = Math.max(8, Math.min(18, targetSpan / Math.max(sorted.length * 4, 1)));
  let previous = start;

  sorted.forEach((value, index) => {
    if (index === 0) {
      result.set(coordinateKey(value), start);
      return;
    }

    if (index === sorted.length - 1) {
      result.set(coordinateKey(value), end);
      return;
    }

    const progress = (value - sourceStart) / sourceSpan;
    const base = start + progress * targetSpan;
    const organic = bendA * Math.sin(Math.PI * progress) + bendB * Math.sin(Math.PI * 2 * progress);
    const local = seededSigned(`${seed}:line:${value}`) * localAmplitude * Math.sin(Math.PI * progress);
    const remaining = sorted.length - index - 1;
    const lower = previous + minimumGap;
    const upper = end - remaining * minimumGap;
    const mapped = clamp(base + organic + local, lower, upper);

    result.set(coordinateKey(value), mapped);
    previous = mapped;
  });

  return result;
}

function orientationFor(apartmentId: string, roomCount: number): Orientation {
  const variants: Orientation[] = roomCount <= 5 ? [0, 1, 2, 3] : [0, 1, 2, 3, 4, 5];
  return variants[Math.floor(seededUnit(`${apartmentId}:orientation`) * variants.length)] ?? 0;
}

function visualRoom(room: Room, plan: RoomPlan, seed = "fallback"): VisualRoom {
  const x = Math.round(plan.x);
  const y = Math.round(plan.y);
  const width = Math.max(1, Math.round(plan.width));
  const height = Math.max(1, Math.round(plan.height));
  const labelOffsetX = seededSigned(`${seed}:${room.id}:label-x`) * Math.min(14, width * 0.08);
  const labelOffsetY = seededSigned(`${seed}:${room.id}:label-y`) * Math.min(10, height * 0.06);

  return {
    ...room,
    visualX: x,
    visualY: y,
    visualWidth: width,
    visualHeight: height,
    visualLabelX: Math.round(clamp(x + width / 2 + labelOffsetX, x + 24, x + width - 24)),
    visualLabelY: Math.round(clamp(y + height / 2 + labelOffsetY, y + 28, y + height - 28))
  };
}

function fallbackPlan(rooms: Room[], apartmentId: string) {
  const columns = Math.max(1, Math.ceil(Math.sqrt(rooms.length)));
  const rows = Math.max(1, Math.ceil(rooms.length / columns));
  const cellWidth = PLAN_FRAME.width / columns;
  const cellHeight = PLAN_FRAME.height / rows;

  return rooms.map((room, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const isLastColumn = column === columns - 1;
    const isLastRow = row === rows - 1;

    return visualRoom(
      room,
      {
        x: PLAN_FRAME.x + column * cellWidth,
        y: PLAN_FRAME.y + row * cellHeight,
        width: isLastColumn ? PLAN_FRAME.width - column * cellWidth : cellWidth,
        height: isLastRow ? PLAN_FRAME.height - row * cellHeight : cellHeight
      },
      apartmentId
    );
  });
}

function variedPlans(apartmentId: string, rooms: Room[]) {
  const orientation = orientationFor(apartmentId, rooms.length);
  const transformed = rooms.map((room) => transformPlan(room.plan as RoomPlan, orientation));
  const xValues = transformed.flatMap((rect) => [rect.left, rect.right]);
  const yValues = transformed.flatMap((rect) => [rect.top, rect.bottom]);
  const leftInset = 2 + Math.round(seededUnit(`${apartmentId}:inset-left`) * 8);
  const rightInset = 2 + Math.round(seededUnit(`${apartmentId}:inset-right`) * 8);
  const topInset = 2 + Math.round(seededUnit(`${apartmentId}:inset-top`) * 7);
  const bottomInset = 2 + Math.round(seededUnit(`${apartmentId}:inset-bottom`) * 7);
  const xMap = buildWarpMap(
    xValues,
    PLAN_FRAME.x + leftInset,
    PLAN_FRAME.x + PLAN_FRAME.width - rightInset,
    `${apartmentId}:x`
  );
  const yMap = buildWarpMap(
    yValues,
    PLAN_FRAME.y + topInset,
    PLAN_FRAME.y + PLAN_FRAME.height - bottomInset,
    `${apartmentId}:y`
  );

  return rooms.map((room, index) => {
    const rect = transformed[index];
    const left = xMap.get(coordinateKey(rect.left)) ?? PLAN_FRAME.x;
    const right = xMap.get(coordinateKey(rect.right)) ?? PLAN_FRAME.x + PLAN_FRAME.width;
    const top = yMap.get(coordinateKey(rect.top)) ?? PLAN_FRAME.y;
    const bottom = yMap.get(coordinateKey(rect.bottom)) ?? PLAN_FRAME.y + PLAN_FRAME.height;

    return visualRoom(
      room,
      {
        x: left,
        y: top,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top)
      },
      apartmentId
    );
  });
}

export function getApartmentVisualRooms(apartmentId: string | undefined, rooms: Room[]) {
  if (rooms.length === 0) return [];
  const seed = apartmentId || "apartment";

  if (rooms.every((room) => room.plan)) {
    return variedPlans(seed, rooms);
  }

  return fallbackPlan(rooms, seed);
}

export function roomFill(room: Room) {
  if (isKitchen(room) || isLiving(room)) return "#eef5fb";
  if (isBedroom(room)) return "#eef8ef";
  if (isBathroom(room)) return "#eef3fa";
  if (isHall(room)) return "#fff6e8";
  if (isBalcony(room)) return "#f2f7ff";
  if (isStorage(room)) return "#f7f1ff";
  return "#ffffff";
}

export function getVisualBounds(room: VisualRoom): VisualBounds {
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

export function getPlanBounds(visualRooms: VisualRoom[]): VisualBounds {
  if (visualRooms.length === 0) {
    return {
      minX: PLAN_FRAME.x,
      minY: PLAN_FRAME.y,
      maxX: PLAN_FRAME.x + PLAN_FRAME.width,
      maxY: PLAN_FRAME.y + PLAN_FRAME.height,
      centerX: PLAN_FRAME.x + PLAN_FRAME.width / 2,
      centerY: PLAN_FRAME.y + PLAN_FRAME.height / 2
    };
  }

  const minX = Math.min(...visualRooms.map((room) => room.visualX));
  const minY = Math.min(...visualRooms.map((room) => room.visualY));
  const maxX = Math.max(...visualRooms.map((room) => room.visualX + room.visualWidth));
  const maxY = Math.max(...visualRooms.map((room) => room.visualY + room.visualHeight));

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
}

function overlap(aMin: number, aMax: number, bMin: number, bMax: number) {
  const min = Math.max(aMin, bMin);
  const max = Math.min(aMax, bMax);
  return { min, max, size: Math.max(0, max - min), center: (min + max) / 2 };
}

function touching(a: number, b: number) {
  return Math.abs(a - b) <= WALL_EPSILON;
}

function biasedCenter(min: number, max: number, key: string, margin = 28) {
  const safeMin = min + margin;
  const safeMax = max - margin;
  if (safeMax <= safeMin) return (min + max) / 2;
  const ratio = 0.32 + seededUnit(key) * 0.36;
  return safeMin + (safeMax - safeMin) * ratio;
}

function doorBetween(
  room: VisualRoom,
  neighbor: VisualRoom,
  size = DEFAULT_DOOR_SIZE,
  seed = "door"
): Omit<VisualDoor, "id" | "roomId"> | null {
  const a = getVisualBounds(room);
  const b = getVisualBounds(neighbor);
  const vertical = overlap(a.minY, a.maxY, b.minY, b.maxY);
  const horizontal = overlap(a.minX, a.maxX, b.minX, b.maxX);
  const key = `${seed}:${room.id}:${neighbor.id}`;

  if (touching(a.minX, b.maxX) && vertical.size >= MIN_DOOR_OVERLAP) {
    return {
      side: "left",
      x: a.minX,
      y: biasedCenter(vertical.min, vertical.max, `${key}:left`),
      size: clamp(size, 34, vertical.size - 16)
    };
  }

  if (touching(a.maxX, b.minX) && vertical.size >= MIN_DOOR_OVERLAP) {
    return {
      side: "right",
      x: a.maxX,
      y: biasedCenter(vertical.min, vertical.max, `${key}:right`),
      size: clamp(size, 34, vertical.size - 16)
    };
  }

  if (touching(a.minY, b.maxY) && horizontal.size >= MIN_DOOR_OVERLAP) {
    return {
      side: "top",
      x: biasedCenter(horizontal.min, horizontal.max, `${key}:top`),
      y: a.minY,
      size: clamp(size, 34, horizontal.size - 16)
    };
  }

  if (touching(a.maxY, b.minY) && horizontal.size >= MIN_DOOR_OVERLAP) {
    return {
      side: "bottom",
      x: biasedCenter(horizontal.min, horizontal.max, `${key}:bottom`),
      y: a.maxY,
      size: clamp(size, 34, horizontal.size - 16)
    };
  }

  return null;
}

function entryDoor(hall: VisualRoom, bounds: VisualBounds, apartmentId: string): VisualDoor {
  const hallBounds = getVisualBounds(hall);
  const candidates = [
    { side: "left" as const, distance: Math.abs(hallBounds.minX - bounds.minX), x: hallBounds.minX, min: hallBounds.minY, max: hallBounds.maxY },
    { side: "right" as const, distance: Math.abs(hallBounds.maxX - bounds.maxX), x: hallBounds.maxX, min: hallBounds.minY, max: hallBounds.maxY },
    { side: "top" as const, distance: Math.abs(hallBounds.minY - bounds.minY), y: hallBounds.minY, min: hallBounds.minX, max: hallBounds.maxX },
    { side: "bottom" as const, distance: Math.abs(hallBounds.maxY - bounds.maxY), y: hallBounds.maxY, min: hallBounds.minX, max: hallBounds.maxX }
  ].sort((a, b) => a.distance - b.distance);
  const minimumDistance = candidates[0]?.distance ?? 0;
  const nearest = candidates.filter((candidate) => candidate.distance <= minimumDistance + 2);
  const picked = nearest[Math.floor(seededUnit(`${apartmentId}:entry-side`) * nearest.length)] ?? candidates[0];
  const center = biasedCenter(picked.min, picked.max, `${apartmentId}:entry-position`, 32);

  return {
    id: `${hall.id}-entry`,
    roomId: hall.id,
    entry: true,
    side: picked.side,
    x: picked.side === "left" || picked.side === "right" ? picked.x ?? hallBounds.centerX : center,
    y: picked.side === "top" || picked.side === "bottom" ? picked.y ?? hallBounds.centerY : center,
    size: 52
  };
}

function neighborScore(neighbor: VisualRoom) {
  if (isHall(neighbor)) return 100;
  if (isKitchen(neighbor) || isLiving(neighbor)) return 70;
  if (isBedroom(neighbor)) return 45;
  if (isStorage(neighbor)) return 30;
  if (isBathroom(neighbor)) return 15;
  return 20 + Math.min(neighbor.area, 20);
}

export function getVisualDoors(visualRooms: VisualRoom[], apartmentId = "apartment") {
  if (visualRooms.length === 0) return [];

  const doors: VisualDoor[] = [];
  const bounds = getPlanBounds(visualRooms);
  const hall = visualRooms.find(isHall);

  if (hall) doors.push(entryDoor(hall, bounds, apartmentId));

  for (const room of visualRooms) {
    if (room.id === hall?.id || isBalcony(room)) continue;

    const neighbor = visualRooms
      .filter((candidate) => candidate.id !== room.id && !isBalcony(candidate))
      .map((candidate) => ({
        candidate,
        door: doorBetween(room, candidate, isKitchen(room) || isLiving(room) ? 54 : DEFAULT_DOOR_SIZE, apartmentId)
      }))
      .filter((item): item is { candidate: VisualRoom; door: Omit<VisualDoor, "id" | "roomId"> } => Boolean(item.door))
      .sort((a, b) => neighborScore(b.candidate) - neighborScore(a.candidate))[0];

    if (neighbor) {
      doors.push({
        id: `${room.id}-door`,
        roomId: room.id,
        ...neighbor.door
      });
    }
  }

  for (const balcony of visualRooms.filter(isBalcony)) {
    const neighbor = visualRooms
      .filter((candidate) => candidate.id !== balcony.id)
      .map((candidate) => ({ candidate, door: doorBetween(balcony, candidate, 62, apartmentId) }))
      .filter((item): item is { candidate: VisualRoom; door: Omit<VisualDoor, "id" | "roomId"> } => Boolean(item.door))
      .sort((a, b) => neighborScore(b.candidate) - neighborScore(a.candidate))[0];

    if (neighbor) {
      doors.push({
        id: `${balcony.id}-door`,
        roomId: balcony.id,
        ...neighbor.door
      });
    }
  }

  return doors;
}

type ExteriorEdge = {
  side: DoorSide;
  length: number;
  min: number;
  max: number;
  fixed: number;
};

function exteriorEdges(room: VisualRoom, bounds: VisualBounds) {
  const roomBounds = getVisualBounds(room);
  const edges: ExteriorEdge[] = [];

  if (touching(roomBounds.minY, bounds.minY)) {
    edges.push({ side: "top", length: room.visualWidth, min: roomBounds.minX, max: roomBounds.maxX, fixed: roomBounds.minY });
  }
  if (touching(roomBounds.maxY, bounds.maxY)) {
    edges.push({ side: "bottom", length: room.visualWidth, min: roomBounds.minX, max: roomBounds.maxX, fixed: roomBounds.maxY });
  }
  if (touching(roomBounds.minX, bounds.minX)) {
    edges.push({ side: "left", length: room.visualHeight, min: roomBounds.minY, max: roomBounds.maxY, fixed: roomBounds.minX });
  }
  if (touching(roomBounds.maxX, bounds.maxX)) {
    edges.push({ side: "right", length: room.visualHeight, min: roomBounds.minY, max: roomBounds.maxY, fixed: roomBounds.maxX });
  }

  return edges;
}

export function getVisualWindows(visualRooms: VisualRoom[], apartmentId = "apartment") {
  if (visualRooms.length === 0) return [];

  const windows: VisualWindow[] = [];
  const bounds = getPlanBounds(visualRooms);

  for (const room of visualRooms) {
    if (isHall(room) || isBathroom(room) || isStorage(room)) continue;

    const edges = exteriorEdges(room, bounds);
    if (edges.length === 0) continue;

    const sorted = [...edges].sort((a, b) => b.length - a.length);
    const preferred = sorted.slice(0, Math.min(2, sorted.length));
    const edge = preferred[Math.floor(seededUnit(`${apartmentId}:${room.id}:window-edge`) * preferred.length)] ?? sorted[0];
    const glazing = isBalcony(room);
    const count = !glazing && room.area >= 20 && edge.length >= 230 ? 2 : 1;
    const maximumSize = count === 2 ? edge.length * 0.28 : edge.length * (glazing ? 0.72 : 0.44);
    const size = clamp(maximumSize, glazing ? 72 : 48, glazing ? 210 : 124);
    const ratios = count === 2 ? [0.33, 0.67] : [0.38 + seededUnit(`${apartmentId}:${room.id}:window-position`) * 0.24];

    ratios.forEach((ratio, index) => {
      const center = clamp(edge.min + edge.length * ratio, edge.min + size / 2 + 14, edge.max - size / 2 - 14);
      const id = `${room.id}-window-${edge.side}-${index}`;

      if (edge.side === "top" || edge.side === "bottom") {
        windows.push({ id, x1: center - size / 2, y1: edge.fixed, x2: center + size / 2, y2: edge.fixed, kind: glazing ? "glazing" : "window" });
      } else {
        windows.push({ id, x1: edge.fixed, y1: center - size / 2, x2: edge.fixed, y2: center + size / 2, kind: glazing ? "glazing" : "window" });
      }
    });
  }

  return windows;
}

function addKitchenFixtures(fixtures: VisualFixture[], room: VisualRoom, apartmentId: string) {
  const bounds = getVisualBounds(room);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const horizontal = width >= height || seededUnit(`${apartmentId}:${room.id}:kitchen-axis`) > 0.7;
  const placeAtEnd = seededUnit(`${apartmentId}:${room.id}:kitchen-side`) > 0.5;

  if (horizontal) {
    const counterWidth = clamp(width * (0.46 + seededUnit(`${apartmentId}:${room.id}:counter-width`) * 0.18), 92, width - 34);
    const counterHeight = clamp(height * 0.11, 18, 28);
    const x = placeAtEnd ? bounds.maxX - counterWidth - 17 : bounds.minX + 17;
    const y = seededUnit(`${apartmentId}:${room.id}:counter-wall`) > 0.5 ? bounds.maxY - counterHeight - 17 : bounds.minY + 17;
    fixtures.push({ id: `${room.id}-counter`, roomId: room.id, kind: "kitchen-counter", x, y, width: counterWidth, height: counterHeight });
    fixtures.push({ id: `${room.id}-sink`, roomId: room.id, kind: "sink", x: x + counterWidth * 0.18, y: y + 3, width: 27, height: Math.max(12, counterHeight - 6) });
    fixtures.push({ id: `${room.id}-hob`, roomId: room.id, kind: "hob", x: x + counterWidth * 0.7, y: y + 3, width: 28, height: Math.max(12, counterHeight - 6) });
  } else {
    const counterHeight = clamp(height * (0.46 + seededUnit(`${apartmentId}:${room.id}:counter-height`) * 0.18), 92, height - 34);
    const counterWidth = clamp(width * 0.11, 18, 28);
    const x = seededUnit(`${apartmentId}:${room.id}:counter-wall`) > 0.5 ? bounds.maxX - counterWidth - 17 : bounds.minX + 17;
    const y = placeAtEnd ? bounds.maxY - counterHeight - 17 : bounds.minY + 17;
    fixtures.push({ id: `${room.id}-counter`, roomId: room.id, kind: "kitchen-counter", x, y, width: counterWidth, height: counterHeight });
    fixtures.push({ id: `${room.id}-sink`, roomId: room.id, kind: "sink", x: x + 3, y: y + counterHeight * 0.18, width: Math.max(12, counterWidth - 6), height: 27, rotate: 90 });
    fixtures.push({ id: `${room.id}-hob`, roomId: room.id, kind: "hob", x: x + 3, y: y + counterHeight * 0.7, width: Math.max(12, counterWidth - 6), height: 28, rotate: 90 });
  }
}

function addBathroomFixtures(fixtures: VisualFixture[], room: VisualRoom, apartmentId: string) {
  const bounds = getVisualBounds(room);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const roomy = room.area >= 4.7 && width >= 105 && height >= 105;
  const horizontal = width >= height;

  if (roomy) {
    if (horizontal) {
      const bathWidth = clamp(width * 0.55, 72, width - 40);
      fixtures.push({ id: `${room.id}-bath`, roomId: room.id, kind: "bath", x: bounds.minX + 16, y: bounds.minY + 16, width: bathWidth, height: clamp(height * 0.28, 38, 55) });
    } else {
      const bathHeight = clamp(height * 0.55, 72, height - 40);
      fixtures.push({ id: `${room.id}-bath`, roomId: room.id, kind: "bath", x: bounds.minX + 16, y: bounds.minY + 16, width: clamp(width * 0.28, 38, 55), height: bathHeight, rotate: 90 });
    }
  } else {
    const showerSize = clamp(Math.min(width, height) * 0.34, 44, 62);
    fixtures.push({ id: `${room.id}-shower`, roomId: room.id, kind: "shower", x: bounds.minX + 15, y: bounds.minY + 15, width: showerSize, height: showerSize });
  }

  const toiletWidth = clamp(width * 0.2, 28, 38);
  const toiletHeight = clamp(height * 0.23, 34, 48);
  const sinkWidth = clamp(width * 0.25, 34, 48);
  const sinkHeight = clamp(height * 0.16, 24, 34);
  const swap = seededUnit(`${apartmentId}:${room.id}:bath-swap`) > 0.5;

  fixtures.push({
    id: `${room.id}-toilet`,
    roomId: room.id,
    kind: "toilet",
    x: swap ? bounds.minX + 18 : bounds.maxX - toiletWidth - 18,
    y: bounds.maxY - toiletHeight - 17,
    width: toiletWidth,
    height: toiletHeight
  });
  fixtures.push({
    id: `${room.id}-sink`,
    roomId: room.id,
    kind: "sink",
    x: swap ? bounds.maxX - sinkWidth - 18 : bounds.minX + 18,
    y: bounds.maxY - sinkHeight - 17,
    width: sinkWidth,
    height: sinkHeight
  });
}

function addClosetFixture(fixtures: VisualFixture[], room: VisualRoom, apartmentId: string, force = false) {
  const bounds = getVisualBounds(room);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (!force && Math.min(width, height) < 90) return;

  const horizontal = width >= height;
  const farSide = seededUnit(`${apartmentId}:${room.id}:closet-side`) > 0.5;

  if (horizontal) {
    const closetWidth = clamp(width * (force ? 0.62 : 0.38), 70, width - 34);
    const closetHeight = clamp(height * 0.14, 20, 34);
    fixtures.push({
      id: `${room.id}-closet`,
      roomId: room.id,
      kind: "closet",
      x: farSide ? bounds.maxX - closetWidth - 17 : bounds.minX + 17,
      y: bounds.maxY - closetHeight - 17,
      width: closetWidth,
      height: closetHeight
    });
  } else {
    const closetHeight = clamp(height * (force ? 0.62 : 0.38), 70, height - 34);
    const closetWidth = clamp(width * 0.14, 20, 34);
    fixtures.push({
      id: `${room.id}-closet`,
      roomId: room.id,
      kind: "closet",
      x: bounds.maxX - closetWidth - 17,
      y: farSide ? bounds.maxY - closetHeight - 17 : bounds.minY + 17,
      width: closetWidth,
      height: closetHeight,
      rotate: 90
    });
  }
}

export function getVisualFixtures(apartmentId: string | undefined, visualRooms: VisualRoom[]) {
  const seed = apartmentId || "apartment";
  const fixtures: VisualFixture[] = [];
  const hasStorageRoom = visualRooms.some(isStorage);

  for (const room of visualRooms) {
    if (isKitchen(room)) addKitchenFixtures(fixtures, room, seed);
    if (isBathroom(room)) addBathroomFixtures(fixtures, room, seed);
    if (isStorage(room)) addClosetFixture(fixtures, room, seed, true);
    if (isHall(room) && room.area >= 5 && seededUnit(`${seed}:${room.id}:hall-closet`) > 0.32) {
      addClosetFixture(fixtures, room, seed);
    }
    if (!hasStorageRoom && isBedroom(room) && room.area >= 11 && seededUnit(`${seed}:${room.id}:bedroom-closet`) > 0.72) {
      addClosetFixture(fixtures, room, seed);
    }
  }

  const wetRoom = visualRooms.find(isBathroom) ?? visualRooms.find(isKitchen);
  if (wetRoom) {
    const bounds = getVisualBounds(wetRoom);
    const shaftWidth = clamp(wetRoom.visualWidth * 0.14, 20, 32);
    const shaftHeight = clamp(wetRoom.visualHeight * 0.15, 22, 34);
    fixtures.push({
      id: `${wetRoom.id}-shaft`,
      roomId: wetRoom.id,
      kind: "shaft",
      x: bounds.maxX - shaftWidth - 5,
      y: bounds.minY + 5,
      width: shaftWidth,
      height: shaftHeight
    });
  }

  const columnCandidates = visualRooms
    .filter((room) => !isBathroom(room) && !isHall(room) && !isStorage(room) && !isBalcony(room) && room.area >= 12)
    .sort((a, b) => seededUnit(`${seed}:${a.id}:column-order`) - seededUnit(`${seed}:${b.id}:column-order`));
  const columnCount = visualRooms.length >= 8 ? 2 : seededUnit(`${seed}:column-count`) > 0.38 ? 1 : 0;

  columnCandidates.slice(0, columnCount).forEach((room, index) => {
    const bounds = getVisualBounds(room);
    const size = 15 + Math.round(seededUnit(`${seed}:${room.id}:column-size`) * 7);
    const right = seededUnit(`${seed}:${room.id}:column-x`) > 0.5;
    const bottom = seededUnit(`${seed}:${room.id}:column-y`) > 0.5;
    fixtures.push({
      id: `${room.id}-column-${index}`,
      roomId: room.id,
      kind: "column",
      x: right ? bounds.maxX - size - 3 : bounds.minX + 3,
      y: bottom ? bounds.maxY - size - 3 : bounds.minY + 3,
      width: size,
      height: size
    });
  });

  return fixtures;
}
